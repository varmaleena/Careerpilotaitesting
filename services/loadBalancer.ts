
/**
 * RequestLoadBalancer
 * A sophisticated utility to manage API quotas, handle rate limits, 
 * and distribute requests across multiple API keys.
 */

interface QueuedRequest {
    id: string;
    fn: () => Promise<any>;
    priority: number;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    retries: number;
    keyRotations: number; // Track how many times we've rotated keys for this request
}

interface KeyStatus {
    key: string;
    rateLimitedUntil: number; // Timestamp when this key becomes available again
}

export class RequestLoadBalancer {
    private keyStatuses: KeyStatus[];
    private currentKeyIndex: number = 0;
    private queue: QueuedRequest[] = [];
    private isProcessing: boolean = false;
    private lastRequestTime: number = 0;
    private readonly minInterval: number = 1000; // 1 second between requests (more conservative)
    private readonly maxRetries: number = 8; // More retries for quota recovery
    private readonly keyBackoffMs: number = 120000; // 2 minute backoff per key when rate limited

    constructor(keys: string[]) {
        const validKeys = keys.filter(Boolean);
        this.keyStatuses = validKeys.map(key => ({ key, rateLimitedUntil: 0 }));
        if (this.keyStatuses.length === 0) {
            console.error("❌ No API keys provided to Load Balancer");
        }
        console.log(`⚖️ Load Balancer initialized with ${this.keyStatuses.length} keys`);
    }

    public async execute<T>(requestFn: (apiKey: string) => Promise<T>, priority: number = 0): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({
                id: Math.random().toString(36).substring(7),
                fn: () => requestFn(this.getAvailableKey()),
                priority,
                resolve,
                reject,
                retries: 0,
                keyRotations: 0
            });
            this.queue.sort((a, b) => b.priority - a.priority);
            this.processQueue();
        });
    }

    private getAvailableKey(): string {
        const now = Date.now();

        // Find a key that's not rate-limited
        for (let i = 0; i < this.keyStatuses.length; i++) {
            const index = (this.currentKeyIndex + i) % this.keyStatuses.length;
            if (this.keyStatuses[index].rateLimitedUntil <= now) {
                this.currentKeyIndex = index;
                return this.keyStatuses[index].key;
            }
        }

        // All keys are rate-limited, return the one that will be available soonest
        const soonestAvailable = this.keyStatuses.reduce((min, status, index) =>
            status.rateLimitedUntil < this.keyStatuses[min].rateLimitedUntil ? index : min, 0);
        this.currentKeyIndex = soonestAvailable;
        return this.keyStatuses[soonestAvailable].key;
    }

    private markKeyAsRateLimited(keyIndex: number) {
        this.keyStatuses[keyIndex].rateLimitedUntil = Date.now() + this.keyBackoffMs;
        console.log(`🔒 Key ${keyIndex} rate-limited until ${new Date(this.keyStatuses[keyIndex].rateLimitedUntil).toLocaleTimeString()}`);
    }

    // Permanently remove an invalid key from rotation
    private invalidateKeyAtIndex(keyIndex: number) {
        const removed = this.keyStatuses.splice(keyIndex, 1);
        console.warn(`⛔ Removed invalid key at index ${keyIndex}. ${this.keyStatuses.length} keys remain.`);
        if (this.currentKeyIndex >= this.keyStatuses.length) {
            this.currentKeyIndex = 0;
        }
    }

    // Parse common Retry-After semantics from responses (header Seconds or HTTP-date)
    private parseRetryAfterMs(error: any): number | null {
        try {
            const headers = error?.response?.headers || {};
            const raw = headers['retry-after'] || headers['Retry-After'];
            if (raw) {
                const asInt = parseInt(raw, 10);
                if (!Number.isNaN(asInt)) return asInt * 1000;
                const asDate = Date.parse(raw);
                if (!Number.isNaN(asDate)) return Math.max(0, asDate - Date.now());
            }

            // Some APIs return structured retry info in the body
            const body = error?.response?.data || error?.response?.data?.error;
            if (body) {
                // Google sometimes includes details with retry metadata
                const details = body?.details || [];
                for (const d of details) {
                    if (d?.retryDelayMs) return d.retryDelayMs;
                    if (d?.retryDelay) return parseInt(d.retryDelay, 10) * 1000;
                }
            }
        } catch (e) {
            // ignore parse errors
        }
        return null;
    }

    // Mark a key as rate-limited for a specific duration (ms). Adds jitter.
    private markKeyAsRateLimitedWithMs(keyIndex: number, ms?: number) {
        const base = typeof ms === 'number' && ms > 0 ? ms : this.keyBackoffMs;
        const jitter = Math.floor(Math.random() * 1000); // up to 1s jitter
        this.keyStatuses[keyIndex].rateLimitedUntil = Date.now() + base + jitter;
        console.log(`🔒 Key ${keyIndex} rate-limited for ${(base + jitter) / 1000}s until ${new Date(this.keyStatuses[keyIndex].rateLimitedUntil).toLocaleTimeString()}`);
    }

    private async getWaitTimeForNextAvailableKey(): Promise<number> {
        const now = Date.now();
        const soonestTime = Math.min(...this.keyStatuses.map(s => s.rateLimitedUntil));
        return Math.max(0, soonestTime - now);
    }

    private rotateKey() {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keyStatuses.length;
        console.log(`🔄 Rotated to key index: ${this.currentKeyIndex}`);
    }

    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            const timeSinceLast = now - this.lastRequestTime;

            // Rate limiting between requests
            if (timeSinceLast < this.minInterval) {
                await new Promise(r => setTimeout(r, this.minInterval - timeSinceLast));
            }

            // Check if all keys are rate-limited
            const waitTime = await this.getWaitTimeForNextAvailableKey();
            if (waitTime > 0) {
                console.log(`⏳ All keys rate-limited. Waiting ${Math.ceil(waitTime / 1000)}s for next available key...`);
                await new Promise(r => setTimeout(r, Math.min(waitTime, 10000))); // Wait max 10s at a time
            }

            const request = this.queue.shift();
            if (!request) break;

            try {
                this.lastRequestTime = Date.now();
                const result = await request.fn();
                request.resolve(result);
            } catch (error: any) {
                const rawMessage = error?.message || JSON.stringify(error || '');
                const status = error.status || (error.message?.includes('429') ? 429 : error.message?.includes('404') ? 404 : 500);

                // Detect invalid API key errors from Google responses
                const isApiKeyInvalid = rawMessage.includes('API key not valid') || rawMessage.includes('API_KEY_INVALID') || (error?.response?.data?.error?.details && JSON.stringify(error.response.data.error.details).includes('API_KEY_INVALID'));

                if (isApiKeyInvalid) {
                    console.error('❌ API key invalid. Removing key from rotation.');
                    // Remove the currently selected key from pool
                    this.invalidateKeyAtIndex(this.currentKeyIndex);
                    // If no keys remain, fail immediately with a clear error
                    if (this.keyStatuses.length === 0) {
                        request.reject(new Error('No valid API keys remain. Please provide valid Gemini API keys.'));
                        continue;
                    }
                    // Re-queue the request to try with next key
                    this.queue.unshift(request);
                    continue;
                }

                if (status === 429 || rawMessage.includes('quota') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
                    console.warn(`⚠️ Rate limit hit (429). Attempt ${request.retries + 1}/${this.maxRetries}`);

                    // Try to honor server-provided Retry-After if present
                    const retryAfterMs = this.parseRetryAfterMs(error);

                    // Mark current key as rate-limited (using Retry-After when available)
                    if (retryAfterMs) {
                        this.markKeyAsRateLimitedWithMs(this.currentKeyIndex, retryAfterMs);
                    } else {
                        // Apply exponential backoff based on retries for this request
                        const exponential = Math.min(this.keyBackoffMs * Math.pow(2, request.retries), 5 * 60 * 1000); // cap at 5 minutes
                        this.markKeyAsRateLimitedWithMs(this.currentKeyIndex, exponential);
                    }

                    request.keyRotations++;

                    // If we've rotated through all keys, increment retries
                    if (request.keyRotations >= this.keyStatuses.length) {
                        request.retries++;
                        request.keyRotations = 0;

                        if (request.retries >= this.maxRetries) {
                            console.error(`❌ All ${this.maxRetries} retries exhausted. Request failed.`);
                            request.reject(error);
                            continue;
                        }
                    }

                    // Rotate to next key
                    this.rotateKey();

                    // Re-queue the request
                    this.queue.unshift(request);

                } else if (status === 404) {
                    console.error("❌ Model not found (404). This might be a version mismatch or model name issue.");
                    request.reject(error);
                } else {
                    console.error("❌ Request failed:", error.message);
                    request.retries++;
                    if (request.retries < 3) {
                        this.queue.push(request);
                    } else {
                        request.reject(error);
                    }
                }
            }
        }

        this.isProcessing = false;
    }
}

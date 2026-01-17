
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
}

export class RequestLoadBalancer {
    private keys: string[];
    private currentKeyIndex: number = 0;
    private queue: QueuedRequest[] = [];
    private isProcessing: boolean = false;
    private lastRequestTime: number = 0;
    private readonly minInterval: number = 1000; // 1 second between primary requests
    private readonly maxRetries: number = 5;

    constructor(keys: string[]) {
        this.keys = keys.filter(Boolean);
        if (this.keys.length === 0) {
            console.error("❌ No API keys provided to Load Balancer");
        }
        console.log(`⚖️ Load Balancer initialized with ${this.keys.length} keys`);
    }

    public async execute<T>(requestFn: (apiKey: string) => Promise<T>, priority: number = 0): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({
                id: Math.random().toString(36).substring(7),
                fn: () => requestFn(this.getCurrentKey()),
                priority,
                resolve,
                reject,
                retries: 0
            });
            this.queue.sort((a, b) => b.priority - a.priority);
            this.processQueue();
        });
    }

    private getCurrentKey(): string {
        return this.keys[this.currentKeyIndex];
    }

    private rotateKey() {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
        console.log(`🔄 Rotated to key index: ${this.currentKeyIndex}`);
    }

    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            const timeSinceLast = now - this.lastRequestTime;

            if (timeSinceLast < this.minInterval) {
                await new Promise(r => setTimeout(r, this.minInterval - timeSinceLast));
            }

            const request = this.queue.shift();
            if (!request) break;

            try {
                this.lastRequestTime = Date.now();
                const result = await request.fn();
                request.resolve(result);
            } catch (error: any) {
                const status = error.status || (error.message?.includes('429') ? 429 : error.message?.includes('404') ? 404 : 500);

                if (status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
                    console.warn(`⚠️ Rate limit hit (429). Attempt ${request.retries + 1}/${this.maxRetries}`);

                    if (this.keys.length > 1) {
                        this.rotateKey();
                        // Re-queue immediately with the new key
                        this.queue.unshift(request);
                    } else {
                        // Backoff and retry
                        const backoff = Math.min(1000 * Math.pow(2, request.retries + 2), 30000);
                        console.log(`⏳ Single key backoff: waiting ${backoff}ms...`);
                        await new Promise(r => setTimeout(r, backoff));
                        request.retries++;
                        if (request.retries < this.maxRetries) {
                            this.queue.unshift(request);
                        } else {
                            request.reject(error);
                        }
                    }
                } else if (status === 404) {
                    console.error("❌ Model not found (404). This might be a version mismatch or model name issue.");
                    request.reject(error);
                } else {
                    console.error("❌ Request failed:", error.message);
                    request.retries++;
                    if (request.retries < 3) {
                        this.queue.push(request); // Simple retry for other errors
                    } else {
                        request.reject(error);
                    }
                }
            }
        }

        this.isProcessing = false;
    }
}

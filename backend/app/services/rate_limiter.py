import time
from typing import Dict, Tuple
from fastapi import HTTPException, Request

class TokenBucketRateLimiter:
    """
    Production IP-based Token Bucket Rate Limiter.
    Prevents API abuse, DDOS attacks, and quota exhaustion.
    """

    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.buckets: Dict[str, Tuple[float, float]] = {} # ip -> (tokens, last_update_time)

    def is_rate_limited(self, ip: str) -> bool:
        now = time.time()
        max_tokens = float(self.requests_per_minute)
        refill_rate = max_tokens / 60.0 # tokens per second

        if ip not in self.buckets:
            self.buckets[ip] = (max_tokens - 1.0, now)
            return False

        tokens, last_update = self.buckets[ip]
        # Calculate refilled tokens
        elapsed = now - last_update
        tokens = min(max_tokens, tokens + elapsed * refill_rate)

        if tokens >= 1.0:
            self.buckets[ip] = (tokens - 1.0, now)
            return False
        else:
            self.buckets[ip] = (tokens, now)
            return True

# Global Rate Limiter Instance (30 requests/min per IP)
global_rate_limiter = TokenBucketRateLimiter(requests_per_minute=30)

async def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if global_rate_limiter.is_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a moment before sending more requests."
        )

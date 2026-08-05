import time
from app.config import logger

class CircuitBreakerOpenException(Exception):
    """Raised when circuit breaker is OPEN due to repeated failures."""
    pass

class CircuitBreaker:
    """
    Production-Grade Circuit Breaker Pattern implementation.
    States:
    - CLOSED: Normal operation. Requests pass through.
    - OPEN: Service has failed repeatedly. Rejects requests immediately with fallback.
    - HALF-OPEN: Testing recovery after cooldown period.
    """

    def __init__(self, failure_threshold: int = 4, recovery_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.state = "CLOSED"
        self.last_state_change = time.time()

    def can_execute(self) -> bool:
        now = time.time()
        if self.state == "OPEN":
            if now - self.last_state_change > self.recovery_timeout:
                self.state = "HALF-OPEN"
                self.last_state_change = now
                logger.info("Circuit Breaker transitioned from OPEN -> HALF-OPEN. Testing service recovery.")
                return True
            return False
        return True

    def record_success(self):
        self.failure_count = 0
        if self.state != "CLOSED":
            logger.info("Circuit Breaker transitioned to CLOSED. Service restored.")
            self.state = "CLOSED"
            self.last_state_change = time.time()

    def record_failure(self):
        self.failure_count += 1
        logger.warning(f"Circuit Breaker failure recorded ({self.failure_count}/{self.failure_threshold}).")
        if self.failure_count >= self.failure_threshold and self.state != "OPEN":
            self.state = "OPEN"
            self.last_state_change = time.time()
            logger.error(f"Circuit Breaker TRIPPED OPEN. Rejecting calls for {self.recovery_timeout} seconds.")

# Global Circuit Breaker Instance for LLM Services
llm_circuit_breaker = CircuitBreaker()

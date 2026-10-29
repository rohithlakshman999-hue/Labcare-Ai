import hashlib
import secrets

def hash_token(token: str) -> str:
    """Hash an agent token with SHA-256 for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def verify_token(plain_token: str, hashed_token: str) -> bool:
    """Verify an agent token against stored hash."""
    if not plain_token or not hashed_token:
        return False
    return hash_token(plain_token) == hashed_token

def generate_agent_token() -> str:
    """Generate a cryptographically secure agent enrollment token."""
    return f"lca_agent_{secrets.token_urlsafe(24)}"

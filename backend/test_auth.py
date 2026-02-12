import asyncio
from app.core.security import verify_password, get_password_hash

def test_hash():
    password = "Admin@123"
    hashed = get_password_hash(password)
    is_valid = verify_password(password, hashed)
    print(f"Password: {password}")
    print(f"Hash: {hashed}")
    print(f"Verify own hash: {is_valid}")

if __name__ == "__main__":
    test_hash()

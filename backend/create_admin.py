import sys
sys.path.insert(0, '/app')

from app.db.session import SessionLocal
from app.models.models import User, UserRole
import bcrypt

db = SessionLocal()

# Hash password using bcrypt directly
password = "admin123".encode('utf-8')
salt = bcrypt.gensalt()
password_hash = bcrypt.hashpw(password, salt).decode('utf-8')


def normalize_phone_number(raw_phone: str) -> str:
    digits = ''.join(filter(str.isdigit, raw_phone or ""))

    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]

    if len(digits) == 10:
        digits = '7' + digits

    return digits


normalized_phone = normalize_phone_number("+77771234567")

admin = User(
    first_name="Admin",
    last_name="User",
    phone_number=normalized_phone,
    password_hash=password_hash,
    role=UserRole.ADMIN,
    is_active=True,
    bonus_points=0
)

db.add(admin)
db.commit()
print(f"Admin created with ID: {admin.id}")
print(f"Phone: {normalized_phone}")
print(f"Password: admin123")

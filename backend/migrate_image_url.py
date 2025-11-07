"""
Migration script to change image_url column type from VARCHAR(255) to TEXT
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        # Change the column type
        connection.execute(text("""
            ALTER TABLE products 
            ALTER COLUMN image_url TYPE TEXT;
        """))
        connection.commit()
        print("✅ Migration completed successfully: image_url column changed to TEXT")

if __name__ == "__main__":
    migrate()

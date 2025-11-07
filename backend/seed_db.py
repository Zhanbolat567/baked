"""
Database seed script for Social Coffee Shop
Creates initial categories, products, options, and admin user
"""

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.models import (
    User, UserRole, Category, Product, ProductStatus,
    OptionGroup, Option
)
from app.core.security import get_password_hash

def create_admin_user(db: Session):
    """Create initial admin user"""
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    
    if not admin:
        admin = User(
            first_name="Admin",
            last_name="User",
            phone_number="+77001234567",  # Change this
            password_hash=get_password_hash("admin123"),  # Change this
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("✅ Admin user created")
    else:
        print("ℹ️  Admin user already exists")

def create_option_groups(db: Session):
    """Create option groups and options"""
    
    # Check if option groups already exist
    existing = db.query(OptionGroup).first()
    if existing:
        print("ℹ️  Option groups already exist")
        return
    
    # Milk options
    milk_group = OptionGroup(
        name_rus="Молоко",
        name_kaz="Сүт",
        name_eng="Milk",
        is_required=False,
        is_multiple=False
    )
    db.add(milk_group)
    db.flush()
    
    milk_options = [
        {"name_rus": "Обычное", "name_kaz": "Қарапайым", "name_eng": "Regular", "price": 0},
        {"name_rus": "Кокосовое", "name_kaz": "Кокос", "name_eng": "Coconut", "price": 400},
        {"name_rus": "Миндальное", "name_kaz": "Бадам", "name_eng": "Almond", "price": 400},
        {"name_rus": "Овсяное", "name_kaz": "Сұлы", "name_eng": "Oat", "price": 400},
        {"name_rus": "Фундук", "name_kaz": "Фундук", "name_eng": "Hazelnut", "price": 400},
    ]
    
    for opt in milk_options:
        option = Option(group_id=milk_group.id, **opt)
        db.add(option)
    
    # Syrup options
    syrup_group = OptionGroup(
        name_rus="Сироп",
        name_kaz="Сироп",
        name_eng="Syrup",
        is_required=False,
        is_multiple=True
    )
    db.add(syrup_group)
    db.flush()
    
    syrup_options = [
        {"name_rus": "Карамель", "name_kaz": "Карамель", "name_eng": "Caramel", "price": 300},
        {"name_rus": "Соленая карамель", "name_kaz": "Тұзды карамель", "name_eng": "Salted Caramel", "price": 300},
        {"name_rus": "Шоколад", "name_kaz": "Шоколад", "name_eng": "Chocolate", "price": 300},
        {"name_rus": "Ваниль", "name_kaz": "Ваниль", "name_eng": "Vanilla", "price": 300},
        {"name_rus": "Попкорн", "name_kaz": "Попкорн", "name_eng": "Popcorn", "price": 300},
        {"name_rus": "Кокос", "name_kaz": "Кокос", "name_eng": "Coconut", "price": 300},
        {"name_rus": "Жареный лесной орех", "name_kaz": "Қуырылған орман жаңғағы", "name_eng": "Roasted Hazelnut", "price": 300},
    ]
    
    for opt in syrup_options:
        option = Option(group_id=syrup_group.id, **opt)
        db.add(option)
    
    # Extra shot
    shot_group = OptionGroup(
        name_rus="Дополнительный шот",
        name_kaz="Қосымша шот",
        name_eng="Extra Shot",
        is_required=False,
        is_multiple=False
    )
    db.add(shot_group)
    db.flush()
    
    shot_option = Option(
        group_id=shot_group.id,
        name_rus="Эспрессо",
        name_kaz="Эспрессо",
        name_eng="Espresso",
        price=390
    )
    db.add(shot_option)
    
    db.commit()
    print("✅ Option groups created")

def create_categories(db: Session):
    """Create product categories"""
    
    existing = db.query(Category).first()
    if existing:
        print("ℹ️  Categories already exist")
        return
    
    categories = [
        {"name_rus": "Кофе", "name_kaz": "Кофе", "name_eng": "Coffee", "order": 1},
        {"name_rus": "Лимонады", "name_kaz": "Лимонадтар", "name_eng": "Lemonades", "order": 2},
        {"name_rus": "Холодный кофе", "name_kaz": "Суық кофе", "name_eng": "Cold Coffee", "order": 3},
        {"name_rus": "Чай", "name_kaz": "Шай", "name_eng": "Tea", "order": 4},
        {"name_rus": "Молочный Коктейль", "name_kaz": "Сүт коктейлі", "name_eng": "Milkshake", "order": 5},
        {"name_rus": "Слуш", "name_kaz": "Слаш", "name_eng": "Slush", "order": 6},
        {"name_rus": "Матча", "name_kaz": "Матча", "name_eng": "Matcha", "order": 7},
        {"name_rus": "Напитки", "name_kaz": "Сусындар", "name_eng": "Beverages", "order": 8},
        {"name_rus": "Выпечка", "name_kaz": "Нан-тоқаш", "name_eng": "Bakery", "order": 9},
    ]
    
    for cat in categories:
        category = Category(**cat)
        db.add(category)
    
    db.commit()
    print("✅ Categories created")

def create_products(db: Session):
    """Create sample products"""
    
    existing = db.query(Product).first()
    if existing:
        print("ℹ️  Products already exist")
        return
    
    # Get categories
    coffee_cat = db.query(Category).filter(Category.name_rus == "Кофе").first()
    
    # Get option groups
    milk_group = db.query(OptionGroup).filter(OptionGroup.name_rus == "Молоко").first()
    syrup_group = db.query(OptionGroup).filter(OptionGroup.name_rus == "Сироп").first()
    shot_group = db.query(OptionGroup).filter(OptionGroup.name_rus == "Дополнительный шот").first()
    
    if not coffee_cat or not milk_group:
        print("⚠️  Missing required data, skipping products")
        return
    
    products = [
        {
            "category_id": coffee_cat.id,
            "name_rus": "Эспрессо",
            "name_kaz": "Эспрессо",
            "name_eng": "Espresso",
            "description_rus": "Чистый вкус эспрессо, разбавленный горячей водой. Легкий и бодрящий",
            "description_kaz": "Таза эспрессо дәмі, ыстық сумен араластырылған. Жеңіл және сергітетін",
            "description_eng": "Pure espresso taste, diluted with hot water. Light and invigorating",
            "base_price": 590,
            "status": ProductStatus.ACTIVE
        },
        {
            "category_id": coffee_cat.id,
            "name_rus": "Американо",
            "name_kaz": "Американо",
            "name_eng": "Americano",
            "description_rus": "Чистый вкус эспрессо, разбавленный горячей водой. Легкий и бодрящий",
            "description_kaz": "Таза эспрессо дәмі, ыстық сумен араластырылған. Жеңіл және сергітетін",
            "description_eng": "Pure espresso taste, diluted with hot water. Light and invigorating",
            "base_price": 790,
            "status": ProductStatus.ACTIVE
        },
        {
            "category_id": coffee_cat.id,
            "name_rus": "Латте",
            "name_kaz": "Латте",
            "name_eng": "Latte",
            "description_rus": "Нежный кофе с молоком и легкой пенкой",
            "description_kaz": "Сүтпен жұмсақ кофе және жеңіл көбік",
            "description_eng": "Gentle coffee with milk and light foam",
            "base_price": 1090,
            "status": ProductStatus.ACTIVE
        },
        {
            "category_id": coffee_cat.id,
            "name_rus": "Капучино",
            "name_kaz": "Капучино",
            "name_eng": "Cappuccino",
            "description_rus": "Идеальный баланс эспрессо, молока и плотной пенки",
            "description_kaz": "Эспрессо, сүт және тығыз көбіктің керемет балансы",
            "description_eng": "Perfect balance of espresso, milk and dense foam",
            "base_price": 1090,
            "status": ProductStatus.ACTIVE
        },
        {
            "category_id": coffee_cat.id,
            "name_rus": "Флэт Уайт",
            "name_kaz": "Флэт Уайт",
            "name_eng": "Flat White",
            "description_rus": "Насыщенный вкус кофе с бархатистым молоком",
            "description_kaz": "Бархатты сүтпен байытылған кофе дәмі",
            "description_eng": "Rich coffee taste with velvety milk",
            "base_price": 990,
            "status": ProductStatus.ACTIVE
        },
        {
            "category_id": coffee_cat.id,
            "name_rus": "Раф",
            "name_kaz": "Раф",
            "name_eng": "Raf",
            "description_rus": "Кремовый кофейный напиток с ванильным вкусом",
            "description_kaz": "Ванильді дәмі бар кремді кофе сусыны",
            "description_eng": "Creamy coffee drink with vanilla flavor",
            "base_price": 1390,
            "status": ProductStatus.ACTIVE
        },
    ]
    
    for prod_data in products:
        product = Product(**prod_data)
        
        # Add option groups to products (except Espresso)
        if prod_data["name_rus"] != "Эспрессо":
            product.option_groups = [milk_group, syrup_group, shot_group]
        
        db.add(product)
    
    db.commit()
    print("✅ Sample products created")

def seed_database():
    """Main seed function"""
    print("🌱 Starting database seed...")
    
    db = SessionLocal()
    try:
        create_admin_user(db)
        create_option_groups(db)
        create_categories(db)
        create_products(db)
        print("✅ Database seeded successfully!")
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

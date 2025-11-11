from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Table, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum

# User Roles
class UserRole(str, enum.Enum):
    CLIENT = "client"
    ADMIN = "admin"

# Order Status
class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Product Status
class ProductStatus(str, enum.Enum):
    ACTIVE = "active"
    OUT_OF_STOCK = "out_of_stock"
    INACTIVE = "inactive"

# Association table for products and option groups
product_option_groups = Table(
    'product_option_groups',
    Base.metadata,
    Column('product_id', Integer, ForeignKey('products.id', ondelete='CASCADE')),
    Column('option_group_id', Integer, ForeignKey('option_groups.id', ondelete='CASCADE'))
)

# User Model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(Text)
    role = Column(SQLEnum(UserRole), default=UserRole.CLIENT, nullable=False)
    bonus_points = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="user")

# Category Model
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name_rus = Column(String(100), nullable=False)
    name_kaz = Column(String(100), nullable=False)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    products = relationship("Product", back_populates="category")

# Product Model
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey('categories.id', ondelete='CASCADE'))
    name_rus = Column(String(100), nullable=False)
    name_kaz = Column(String(100), nullable=False)
    description_rus = Column(Text)
    description_kaz = Column(Text)
    base_price = Column(Float, nullable=False)
    image_url = Column(Text)  # Changed from String(255) to Text to support base64 images
    status = Column(SQLEnum(ProductStatus), default=ProductStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    category = relationship("Category", back_populates="products")
    option_groups = relationship("OptionGroup", secondary=product_option_groups, back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

# Option Group Model (e.g., "Milk", "Syrup", "Size")
class OptionGroup(Base):
    __tablename__ = "option_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name_rus = Column(String(100), nullable=False)
    name_kaz = Column(String(100), nullable=False)
    is_required = Column(Boolean, default=False)
    is_multiple = Column(Boolean, default=False)  # Can select multiple options
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    options = relationship("Option", back_populates="group")
    products = relationship("Product", secondary=product_option_groups, back_populates="option_groups")

# Option Model (e.g., "Coconut Milk +400₸", "Vanilla Syrup +300₸")
class Option(Base):
    __tablename__ = "options"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('option_groups.id', ondelete='CASCADE'))
    name_rus = Column(String(100), nullable=False)
    name_kaz = Column(String(100), nullable=False)
    price = Column(Float, default=0)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    group = relationship("OptionGroup", back_populates="options")

# Order Model
class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    total_amount = Column(Float, nullable=False)
    bonus_earned = Column(Integer, default=0)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    payment_token = Column(String(255))  # Kaspi QR token
    payment_url = Column(String(500))
    
    # Delivery information
    delivery_type = Column(String(50), default='pickup')  # 'delivery', 'pickup', 'dine_in'
    delivery_address = Column(Text)  # Full address
    delivery_apartment = Column(String(20))  # Apartment number
    delivery_entrance = Column(String(20))  # Entrance number
    delivery_floor = Column(String(20))  # Floor number
    delivery_latitude = Column(Float)  # GPS coordinates
    delivery_longitude = Column(Float)  # GPS coordinates
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

# Order Item Model
class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id', ondelete='CASCADE'))
    product_id = Column(Integer, ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    product_name = Column(String(100), nullable=False)  # Store name in case product is deleted
    base_price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    selected_options = relationship("OrderItemOption", back_populates="order_item", cascade="all, delete-orphan")

# Order Item Options (selected options for each order item)
class OrderItemOption(Base):
    __tablename__ = "order_item_options"
    
    id = Column(Integer, primary_key=True, index=True)
    order_item_id = Column(Integer, ForeignKey('order_items.id', ondelete='CASCADE'))
    option_group_name = Column(String(100), nullable=False)
    option_name = Column(String(100), nullable=False)
    option_price = Column(Float, default=0)
    
    # Relationships
    order_item = relationship("OrderItem", back_populates="selected_options")


# Delivery Zone Model
class DeliveryZone(Base):
    __tablename__ = "delivery_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(20), nullable=False)  # HEX color code
    coordinates = Column(JSON, nullable=False)  # Array of [lat, lng] points
    delivery_fee = Column(Float, nullable=False)
    min_order = Column(Float, nullable=False)
    estimated_time = Column(String(50), nullable=False)  # e.g., "30-40 мин"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PickupLocation(Base):
    __tablename__ = "pickup_locations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    address = Column(Text, nullable=False)
    working_hours = Column(String(100), nullable=False)
    phone = Column(String(30))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

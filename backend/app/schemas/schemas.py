from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, OrderStatus, ProductStatus

# User Schemas
class UserBase(BaseModel):
    first_name: str
    last_name: str
    phone_number: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    phone_number: str
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    bonus_points: int
    is_active: bool
    created_at: datetime
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AdminProfileResponse(UserResponse):
    pass


class AdminProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None


class AdminAvatarUpdate(BaseModel):
    avatar_base64: str


class AdminPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

# Category Schemas
class CategoryBase(BaseModel):
    name_rus: str
    name_kaz: str
    order: int = 0
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name_rus: Optional[str] = None
    name_kaz: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Option Schemas
class OptionBase(BaseModel):
    name_rus: str
    name_kaz: str
    price: float = 0
    is_available: bool = True

class OptionCreate(OptionBase):
    group_id: int

class OptionResponse(OptionBase):
    id: int
    group_id: int
    
    class Config:
        from_attributes = True

# Option Group Schemas
class OptionGroupBase(BaseModel):
    name_rus: str
    name_kaz: str
    is_required: bool = False
    is_multiple: bool = False

class OptionGroupCreate(OptionGroupBase):
    pass

class OptionGroupWithOptions(OptionGroupBase):
    id: int
    options: List[OptionResponse] = []
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    category_id: int
    name_rus: str
    name_kaz: str
    description_rus: Optional[str] = None
    description_kaz: Optional[str] = None
    base_price: float
    image_url: Optional[str] = None
    status: ProductStatus = ProductStatus.ACTIVE

class ProductCreate(ProductBase):
    option_group_ids: List[int] = []

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name_rus: Optional[str] = None
    name_kaz: Optional[str] = None
    description_rus: Optional[str] = None
    description_kaz: Optional[str] = None
    base_price: Optional[float] = None
    image_url: Optional[str] = None
    status: Optional[ProductStatus] = None
    option_group_ids: Optional[List[int]] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    option_groups: List[OptionGroupWithOptions] = []
    
    class Config:
        from_attributes = True

# Menu Response (for client side)
class MenuCategory(BaseModel):
    id: int
    name_rus: str
    name_kaz: str
    order: int
    products: List[ProductResponse] = []

class MenuResponse(BaseModel):
    categories: List[MenuCategory] = []

# Order Item Schemas
class OrderItemOptionCreate(BaseModel):
    option_group_name: str
    option_name: str
    option_price: float

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = 1
    selected_options: List[OrderItemOptionCreate] = []

class OrderItemResponse(BaseModel):
    id: int
    product_name: str
    base_price: float
    quantity: int
    total_price: float
    selected_options: List[OrderItemOptionCreate] = []
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_type: Optional[str] = 'pickup'  # 'delivery', 'pickup', 'dine_in'
    delivery_address: Optional[str] = None
    delivery_apartment: Optional[str] = None
    delivery_entrance: Optional[str] = None
    delivery_floor: Optional[str] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None

class OrderResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    total_amount: float
    bonus_earned: int
    status: OrderStatus
    payment_token: Optional[str] = None
    payment_url: Optional[str] = None
    delivery_type: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_apartment: Optional[str] = None
    delivery_entrance: Optional[str] = None
    delivery_floor: Optional[str] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    created_at: datetime
    items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True

class OrderStatusResponse(BaseModel):
    order_id: int
    status: OrderStatus
    payment_url: Optional[str] = None

# Payment Schemas
class PaymentCreateResponse(BaseModel):
    order_id: int
    payment_url: str
    qr_token: str
    total_amount: float

# Dashboard Stats
class DashboardStats(BaseModel):
    today_sales: float
    monthly_sales: float
    total_orders_today: int
    total_orders_month: int
    active_orders: int


# Delivery Zone Schemas
class DeliveryZoneBase(BaseModel):
    name: str
    color: str
    coordinates: List[List[float]]  # [[lat, lng], ...]
    delivery_fee: float
    min_order: float
    estimated_time: str
    is_active: bool = True

class DeliveryZoneCreate(DeliveryZoneBase):
    pass

class DeliveryZoneUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    coordinates: Optional[List[List[float]]] = None
    delivery_fee: Optional[float] = None
    min_order: Optional[float] = None
    estimated_time: Optional[str] = None
    is_active: Optional[bool] = None

class DeliveryZoneResponse(DeliveryZoneBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Pickup Location Schemas
class PickupLocationBase(BaseModel):
    title: str
    address: str
    working_hours: str
    phone: Optional[str] = None
    latitude: float
    longitude: float
    is_active: bool = True
    display_order: int = 0


class PickupLocationCreate(PickupLocationBase):
    pass


class PickupLocationUpdate(BaseModel):
    title: Optional[str] = None
    address: Optional[str] = None
    working_hours: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class PickupLocationResponse(PickupLocationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

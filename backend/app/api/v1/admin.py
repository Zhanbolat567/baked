from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List
from app.db.session import get_db
from app.schemas.schemas import (
    DashboardStats, OrderResponse, OrderItemResponse, OrderItemOptionCreate,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    OptionGroupCreate, OptionGroupWithOptions, OptionCreate, OptionResponse
)
from app.models.models import (
    Order, OrderStatus, Category, Product, OptionGroup, Option, 
    ProductStatus, OrderItem
)
from app.api.dependencies import get_current_admin
from app.core.cache import cache

router = APIRouter(prefix="/admin", tags=["Admin"])

# Dashboard endpoints
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Get dashboard statistics."""
    
    today = datetime.now().date()
    month_start = datetime(today.year, today.month, 1)
    
    # Today's sales
    today_sales = db.query(func.sum(Order.total_amount)).filter(
        and_(
            func.date(Order.created_at) == today,
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED])
        )
    ).scalar() or 0
    
    # Monthly sales
    monthly_sales = db.query(func.sum(Order.total_amount)).filter(
        and_(
            Order.created_at >= month_start,
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED])
        )
    ).scalar() or 0
    
    # Orders count
    total_orders_today = db.query(func.count(Order.id)).filter(
        and_(
            func.date(Order.created_at) == today,
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED])
        )
    ).scalar() or 0
    
    total_orders_month = db.query(func.count(Order.id)).filter(
        and_(
            Order.created_at >= month_start,
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED])
        )
    ).scalar() or 0
    
    # Active orders
    active_orders = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.PAID
    ).scalar() or 0
    
    return DashboardStats(
        today_sales=float(today_sales),
        monthly_sales=float(monthly_sales),
        total_orders_today=total_orders_today,
        total_orders_month=total_orders_month,
        active_orders=active_orders
    )

# Orders management
@router.get("/orders/active", response_model=List[OrderResponse])
async def get_active_orders(
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Get all active (paid but not completed) orders."""
    
    orders = db.query(Order).filter(Order.status == OrderStatus.PAID).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        items = []
        for item in order.items:
            options = [
                OrderItemOptionCreate(
                    option_group_name=opt.option_group_name,
                    option_name=opt.option_name,
                    option_price=opt.option_price
                )
                for opt in item.selected_options
            ]
            
            items.append(OrderItemResponse(
                id=item.id,
                product_name=item.product_name,
                base_price=item.base_price,
                quantity=item.quantity,
                total_price=item.total_price,
                selected_options=options
            ))
        
        result.append(OrderResponse(
            id=order.id,
            user_id=order.user_id,
            total_amount=order.total_amount,
            bonus_earned=order.bonus_earned,
            status=order.status,
            payment_token=order.payment_token,
            payment_url=order.payment_url,
            created_at=order.created_at,
            items=items
        ))
    
    return result

@router.get("/orders/closed", response_model=List[OrderResponse])
async def get_closed_orders(
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin),
    limit: int = 100
):
    """Get all closed (completed or cancelled) orders."""
    
    orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.COMPLETED, OrderStatus.CANCELLED])
    ).order_by(Order.created_at.desc()).limit(limit).all()
    
    result = []
    for order in orders:
        items = []
        for item in order.items:
            options = [
                OrderItemOptionCreate(
                    option_group_name=opt.option_group_name,
                    option_name=opt.option_name,
                    option_price=opt.option_price
                )
                for opt in item.selected_options
            ]
            
            items.append(OrderItemResponse(
                id=item.id,
                product_name=item.product_name,
                base_price=item.base_price,
                quantity=item.quantity,
                total_price=item.total_price,
                selected_options=options
            ))
        
        result.append(OrderResponse(
            id=order.id,
            user_id=order.user_id,
            total_amount=order.total_amount,
            bonus_earned=order.bonus_earned,
            status=order.status,
            payment_token=order.payment_token,
            payment_url=order.payment_url,
            created_at=order.created_at,
            items=items
        ))
    
    return result

@router.patch("/orders/{order_id}/complete")
async def complete_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Mark order as completed."""
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.now()
    db.commit()
    
    return {"message": "Order completed successfully"}

# Category management
@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Get all categories."""
    return db.query(Category).order_by(Category.order).all()

@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Create a new category."""
    
    new_category = Category(**category_data.model_dump())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    # Invalidate menu cache
    await cache.invalidate_menu_cache()
    
    return new_category

@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Update a category."""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    
    db.commit()
    db.refresh(category)
    
    # Invalidate menu cache
    await cache.invalidate_menu_cache()
    
    return category

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Delete a category."""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    
    # Invalidate menu cache
    await cache.invalidate_menu_cache()
    
    return {"message": "Category deleted successfully"}

# Product management
@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin),
    category_id: int = None
):
    """Get all products, optionally filtered by category."""
    
    query = db.query(Product)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    products = query.all()
    
    result = []
    for product in products:
        option_groups = []
        for group in product.option_groups:
            option_groups.append(OptionGroupWithOptions(
                id=group.id,
                name_rus=group.name_rus,
                name_kaz=group.name_kaz,
                name_eng=group.name_eng,
                is_required=group.is_required,
                is_multiple=group.is_multiple,
                options=[opt for opt in group.options]
            ))
        
        result.append(ProductResponse(
            id=product.id,
            category_id=product.category_id,
            name_rus=product.name_rus,
            name_kaz=product.name_kaz,
            name_eng=product.name_eng,
            description_rus=product.description_rus,
            description_kaz=product.description_kaz,
            description_eng=product.description_eng,
            base_price=product.base_price,
            image_url=product.image_url,
            status=product.status,
            created_at=product.created_at,
            option_groups=option_groups
        ))
    
    return result

@router.post("/products", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Create a new product."""
    
    # Extract option group IDs
    option_group_ids = product_data.option_group_ids
    product_dict = product_data.model_dump(exclude={"option_group_ids"})
    
    new_product = Product(**product_dict)
    
    # Add option groups
    if option_group_ids:
        option_groups = db.query(OptionGroup).filter(OptionGroup.id.in_(option_group_ids)).all()
        new_product.option_groups = option_groups
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    # Invalidate menu cache
    await cache.invalidate_menu_cache()
    
    # Build response
    option_groups_response = []
    for group in new_product.option_groups:
        option_groups_response.append(OptionGroupWithOptions(
            id=group.id,
            name_rus=group.name_rus,
            name_kaz=group.name_kaz,
            name_eng=group.name_eng,
            is_required=group.is_required,
            is_multiple=group.is_multiple,
            options=[opt for opt in group.options]
        ))
    
    return ProductResponse(
        id=new_product.id,
        category_id=new_product.category_id,
        name_rus=new_product.name_rus,
        name_kaz=new_product.name_kaz,
        name_eng=new_product.name_eng,
        description_rus=new_product.description_rus,
        description_kaz=new_product.description_kaz,
        description_eng=new_product.description_eng,
        base_price=new_product.base_price,
        image_url=new_product.image_url,
        status=new_product.status,
        created_at=new_product.created_at,
        option_groups=option_groups_response
    )

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Update a product."""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump(exclude_unset=True, exclude={"option_group_ids"})
    for key, value in update_data.items():
        setattr(product, key, value)
    
    # Update option groups if provided
    if product_data.option_group_ids is not None:
        option_groups = db.query(OptionGroup).filter(
            OptionGroup.id.in_(product_data.option_group_ids)
        ).all()
        product.option_groups = option_groups
    
    db.commit()
    db.refresh(product)
    
    # Invalidate menu cache
    await cache.invalidate_menu_cache()
    
    # Build response
    option_groups_response = []
    for group in product.option_groups:
        option_groups_response.append(OptionGroupWithOptions(
            id=group.id,
            name_rus=group.name_rus,
            name_kaz=group.name_kaz,
            name_eng=group.name_eng,
            is_required=group.is_required,
            is_multiple=group.is_multiple,
            options=[opt for opt in group.options]
        ))
    
    return ProductResponse(
        id=product.id,
        category_id=product.category_id,
        name_rus=product.name_rus,
        name_kaz=product.name_kaz,
        name_eng=product.name_eng,
        description_rus=product.description_rus,
        description_kaz=product.description_kaz,
        description_eng=product.description_eng,
        base_price=product.base_price,
        image_url=product.image_url,
        status=product.status,
        created_at=product.created_at,
        option_groups=option_groups_response
    )

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Delete a product."""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    
    # Invalidate menu cache
    await cache.invalidate_menu_cache()
    
    return {"message": "Product deleted successfully"}

# Option Groups management
@router.get("/option-groups", response_model=List[OptionGroupWithOptions])
async def get_option_groups(
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Get all option groups with their options."""
    
    groups = db.query(OptionGroup).all()
    
    result = []
    for group in groups:
        result.append(OptionGroupWithOptions(
            id=group.id,
            name_rus=group.name_rus,
            name_kaz=group.name_kaz,
            name_eng=group.name_eng,
            is_required=group.is_required,
            is_multiple=group.is_multiple,
            options=[opt for opt in group.options]
        ))
    
    return result

@router.post("/option-groups", response_model=OptionGroupWithOptions)
async def create_option_group(
    group_data: OptionGroupCreate,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Create a new option group."""
    
    new_group = OptionGroup(**group_data.model_dump())
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Invalidate menu cache
    await cache.invalidate_menu_cache()
    
    return OptionGroupWithOptions(
        id=new_group.id,
        name_rus=new_group.name_rus,
        name_kaz=new_group.name_kaz,
        name_eng=new_group.name_eng,
        is_required=new_group.is_required,
        is_multiple=new_group.is_multiple,
        options=[]
    )

# Options management
@router.post("/options", response_model=OptionResponse)
async def create_option(
    option_data: OptionCreate,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Create a new option."""
    
    new_option = Option(**option_data.model_dump())
    db.add(new_option)
    db.commit()
    db.refresh(new_option)
    
    # Invalidate menu cache
    await cache.invalidate_menu_cache()
    
    return new_option

@router.delete("/options/{option_id}")
async def delete_option(
    option_id: int,
    db: Session = Depends(get_db),
    admin: bool = Depends(get_current_admin)
):
    """Delete an option."""
    
    option = db.query(Option).filter(Option.id == option_id).first()
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")
    
    db.delete(option)
    db.commit()
    
    # Invalidate menu cache
    await cache.invalidate_menu_cache()
    
    return {"message": "Option deleted successfully"}

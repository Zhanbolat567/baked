from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.db.session import get_db
from app.schemas.schemas import (
    OrderCreate, OrderResponse, OrderStatusResponse, 
    PaymentCreateResponse, OrderItemResponse, OrderItemOptionCreate
)
from app.models.models import Order, OrderItem, OrderItemOption, Product, User, OrderStatus
from app.api.dependencies import get_current_user, get_optional_current_user
from app.services.kaspi import kaspi_service

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=PaymentCreateResponse)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Create a new order and generate Kaspi QR payment."""
    
    # Calculate total amount
    total_amount = 0
    order_items_data = []
    
    for item in order_data.items:
        # Get product
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found"
            )
        
        # Calculate item price
        item_price = product.base_price
        for option in item.selected_options:
            item_price += option.option_price
        
        item_total = item_price * item.quantity
        total_amount += item_total
        
        order_items_data.append({
            "product": product,
            "quantity": item.quantity,
            "base_price": product.base_price,
            "total_price": item_total,
            "selected_options": item.selected_options
        })
    
    # Calculate bonus points (1% of total)
    bonus_earned = int(total_amount * 0.01) if current_user else 0
    
    # Create order
    new_order = Order(
        user_id=current_user.id if current_user else None,
        total_amount=total_amount,
        bonus_earned=bonus_earned,
        status=OrderStatus.PENDING
    )
    
    db.add(new_order)
    db.flush()  # Get order ID
    
    # Create order items
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item_data["product"].id,
            product_name=item_data["product"].name_rus,
            base_price=item_data["base_price"],
            quantity=item_data["quantity"],
            total_price=item_data["total_price"]
        )
        db.add(order_item)
        db.flush()
        
        # Add selected options
        for option in item_data["selected_options"]:
            order_item_option = OrderItemOption(
                order_item_id=order_item.id,
                option_group_name=option.option_group_name,
                option_name=option.option_name,
                option_price=option.option_price
            )
            db.add(order_item_option)
    
    # Create Kaspi payment
    try:
        payment_data = await kaspi_service.create_invoice(new_order.id, total_amount)
        new_order.payment_token = payment_data["token"]
        new_order.payment_url = payment_data["payment_url"]
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment"
        )
    
    db.commit()
    
    return PaymentCreateResponse(
        order_id=new_order.id,
        payment_url=new_order.payment_url,
        qr_token=new_order.payment_token,
        total_amount=total_amount
    )

@router.get("/status/{order_id}", response_model=OrderStatusResponse)
async def get_order_status(order_id: int, db: Session = Depends(get_db)):
    """Check order payment status."""
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # If already paid, return status
    if order.status in [OrderStatus.PAID, OrderStatus.COMPLETED]:
        return OrderStatusResponse(
            order_id=order.id,
            status=order.status,
            payment_url=order.payment_url
        )
    
    # Check with Kaspi if still pending
    if order.status == OrderStatus.PENDING and order.payment_token:
        payment_status = await kaspi_service.check_payment_status(order.payment_token)
        
        if payment_status == "paid":
            order.status = OrderStatus.PAID
            
            # Add bonus points to user if exists
            if order.user_id:
                user = db.query(User).filter(User.id == order.user_id).first()
                if user:
                    user.bonus_points += order.bonus_earned
            
            db.commit()
    
    return OrderStatusResponse(
        order_id=order.id,
        status=order.status,
        payment_url=order.payment_url
    )

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get order details."""
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user owns this order
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Build response
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
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        total_amount=order.total_amount,
        bonus_earned=order.bonus_earned,
        status=order.status,
        payment_token=order.payment_token,
        payment_url=order.payment_url,
        created_at=order.created_at,
        items=items
    )

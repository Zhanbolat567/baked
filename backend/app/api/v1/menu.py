from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.db.session import get_db
from app.schemas.schemas import MenuResponse, MenuCategory, ProductResponse, OptionGroupWithOptions
from app.models.models import Category, Product, ProductStatus
from app.core.cache import cache
from app.core.config import settings
import json

router = APIRouter(prefix="/menu", tags=["Menu"])

@router.get("", response_model=MenuResponse)
async def get_menu(db: Session = Depends(get_db)):
    """Get complete menu with caching."""
    
    # Try to get from cache
    cached_menu = await cache.get(settings.REDIS_MENU_CACHE_KEY)
    
    if cached_menu:
        return MenuResponse(**json.loads(cached_menu))
    
    # Build menu from database
    categories = db.query(Category).filter(Category.is_active == True).order_by(Category.order).all()
    
    menu_categories = []
    for category in categories:
        # Get active products for this category
        products = db.query(Product).filter(
            and_(
                Product.category_id == category.id,
                Product.status == ProductStatus.ACTIVE
            )
        ).all()
        
        product_responses = []
        for product in products:
            # Build option groups with options
            option_groups = []
            for group in product.option_groups:
                options_list = [opt for opt in group.options if opt.is_available]
                option_groups.append(OptionGroupWithOptions(
                    id=group.id,
                    name_rus=group.name_rus,
                    name_kaz=group.name_kaz,
                    name_eng=group.name_eng,
                    is_required=group.is_required,
                    is_multiple=group.is_multiple,
                    options=options_list
                ))
            
            product_responses.append(ProductResponse(
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
        
        menu_categories.append(MenuCategory(
            id=category.id,
            name_rus=category.name_rus,
            name_kaz=category.name_kaz,
            name_eng=category.name_eng,
            order=category.order,
            products=product_responses
        ))
    
    menu_response = MenuResponse(categories=menu_categories)
    
    # Cache the menu
    await cache.set(
        settings.REDIS_MENU_CACHE_KEY,
        menu_response.model_dump_json(),
        settings.REDIS_CACHE_TTL
    )
    
    return menu_response

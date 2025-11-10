import React, { useState, useEffect } from 'react';
import { Product, OptionGroup, Option, CartItemOption } from '../types';
import { useAppStore, useCartStore } from '../store';
import './components.css';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const language = useAppStore((state) => state.language);
  const addItem = useCartStore((state) => state.addItem);

  const [selectedOptions, setSelectedOptions] = useState<Map<number, Option[]>>(new Map());
  const [quantity, setQuantity] = useState(1);

  const getLocalizedName = (item: any) => {
    switch (language) {
      case 'rus': return item.name_rus;
      case 'kaz': return item.name_kaz;
      default: return item.name_rus;
    }
  };

  const getLocalizedDescription = (item: any) => {
    switch (language) {
      case 'rus': return item.description_rus;
      case 'kaz': return item.description_kaz;
      default: return item.description_rus;
    }
  };

  const handleOptionSelect = (group: OptionGroup, option: Option) => {
    const newSelected = new Map(selectedOptions);
    
    if (group.is_multiple) {
      // Multiple selection
      const current = newSelected.get(group.id) || [];
      const index = current.findIndex(o => o.id === option.id);
      
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(option);
      }
      
      newSelected.set(group.id, current);
    } else {
      // Single selection
      newSelected.set(group.id, [option]);
    }
    
    setSelectedOptions(newSelected);
  };

  const isOptionSelected = (group: OptionGroup, option: Option): boolean => {
    const selected = selectedOptions.get(group.id);
    return selected ? selected.some(o => o.id === option.id) : false;
  };

  const calculateTotalPrice = (): number => {
    let total = product.base_price;
    
    // Add options prices
    selectedOptions.forEach((options) => {
      options.forEach(option => {
        total += option.price;
      });
    });
    
    return total * quantity;
  };

  const handleAddToCart = () => {
    const cartOptions: CartItemOption[] = [];
    
    // Add selected options
    product.option_groups.forEach(group => {
      const selected = selectedOptions.get(group.id) || [];
      selected.forEach(option => {
        cartOptions.push({
          option_group_name: getLocalizedName(group),
          option_name: getLocalizedName(option),
          option_price: option.price
        });
      });
    });

    addItem(product, quantity, cartOptions);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal product-modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="product-modal-container">
          {/* Left Side - Image */}
          <div className="product-modal-left">
            {product.image_url && (
              <img src={product.image_url} alt={getLocalizedName(product)} className="product-modal-img" />
            )}
          </div>

          {/* Right Side - Content */}
          <div className="product-modal-right">
            <div className="product-modal-header">
              <h2 className="product-modal-title">{getLocalizedName(product)}</h2>
              <div className="product-modal-price">{product.base_price} ₸</div>
            </div>

            <div className="product-modal-body">
              {/* Product Description */}
              {getLocalizedDescription(product) && (
                <p className="product-modal-description">{getLocalizedDescription(product)}</p>
              )}

              {/* Option Groups */}
              {product.option_groups.map((group) => (
                <div key={group.id} className="option-section">
                  <h3 className="option-section-title">
                    {getLocalizedName(group)}
                {group.is_required && <span className="required-badge">*</span>}
              </h3>
              <div className="options-grid">
                {group.options.map((option) => (
                  <button
                    key={option.id}
                    className={`option-btn ${isOptionSelected(group, option) ? 'active' : ''}`}
                    onClick={() => handleOptionSelect(group, option)}
                    disabled={!option.is_available}
                  >
                    <div className="option-name">{getLocalizedName(option)}</div>
                    {option.price > 0 && (
                      <div className="option-price">+{option.price} ₸</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

              {/* Quantity Selector */}
              <div className="quantity-section">
                <h3 className="option-section-title">
                  {language === 'rus' ? 'Количество' : language === 'kaz' ? 'Саны' : 'Quantity'}
                </h3>
                <div className="quantity-controls">
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    −
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with Add Button */}
            <div className="product-modal-footer">
              <button className="btn btn-primary btn-full btn-large" onClick={handleAddToCart}>
                {language === 'rus' ? 'В корзину' : language === 'kaz' ? 'Себетке' : 'Add to cart'} · {calculateTotalPrice()} ₸
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

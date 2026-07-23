// components/cart/CartItem.jsx — แถวสินค้าในตะกร้า (รูป, variant, ปุ่มปรับจำนวน, ลบ)
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const formatTHB = (value) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(value);

export default function CartItem({ item }) {
  const { updateQty, removeItem } = useCart();
  const atMax = item.qty >= item.stockQty;

  return (
    <div className="cart-item">
      <Link to={`/products/${item.productId}`} className="cart-item__image">
        <img src={item.image} alt={item.name} />
      </Link>

      <div className="cart-item__info">
        <Link to={`/products/${item.productId}`} className="cart-item__name">
          {item.name}
        </Link>
        <div className="cart-item__variant">{item.variantLabel}</div>
        <div className="cart-item__unit-price">{formatTHB(item.unitPrice)} / ชิ้น</div>

        <div className="cart-item__qty">
          <button
            type="button"
            onClick={() => updateQty(item.variantId, item.qty - 1)}
            disabled={item.qty <= 1}
            aria-label="ลดจำนวน"
          >
            −
          </button>
          <span>{item.qty}</span>
          <button
            type="button"
            onClick={() => updateQty(item.variantId, item.qty + 1)}
            disabled={atMax}
            aria-label="เพิ่มจำนวน"
          >
            +
          </button>
        </div>
        {atMax && <div className="cart-item__stock-note">มีสินค้าในสต็อก {item.stockQty} ชิ้น</div>}
      </div>

      <div className="cart-item__right">
        <div className="cart-item__line-total">{formatTHB(item.unitPrice * item.qty)}</div>
        <button
          type="button"
          className="cart-item__remove"
          onClick={() => removeItem(item.variantId)}
          aria-label="ลบออกจากตะกร้า"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
}

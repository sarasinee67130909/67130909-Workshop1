// components/cart/OrderSummary.jsx — สรุปยอดคำสั่งซื้อ (ยอดรวม/ส่วนลด/สุทธิ) + ปุ่มไปชำระเงิน
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import PromoCodeInput from './PromoCodeInput';

const formatTHB = (value) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(value);

export default function OrderSummary() {
  const { subtotal, discount, total, promo, itemCount } = useCart();

  return (
    <aside className="order-summary">
      <h3>สรุปคำสั่งซื้อ</h3>

      <PromoCodeInput />

      <div className="order-summary__row">
        <span>ยอดรวม ({itemCount} ชิ้น)</span>
        <span>{formatTHB(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="order-summary__row order-summary__row--discount">
          <span>ส่วนลด ({promo.code})</span>
          <span>-{formatTHB(discount)}</span>
        </div>
      )}
      <div className="order-summary__row order-summary__row--total">
        <span>ยอดสุทธิ</span>
        <span>{formatTHB(total)}</span>
      </div>

      <Link to="/checkout" className="btn-cta order-summary__checkout">
        ดำเนินการชำระเงิน
      </Link>
    </aside>
  );
}

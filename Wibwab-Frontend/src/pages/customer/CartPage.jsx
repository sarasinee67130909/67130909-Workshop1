// pages/customer/CartPage.jsx — หน้าตะกร้าสินค้า (ธีม Rose Gold)
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import CartItem from '../../components/cart/CartItem';
import OrderSummary from '../../components/cart/OrderSummary';
import { useCart } from '../../context/CartContext';
import '../../styles/customer.css';

export default function CartPage() {
  const { items } = useCart();

  return (
    <div className="customer-page">
      <Navbar />

      <main className="cart-page">
        <h1 className="cart-page__title">ตะกร้าสินค้า</h1>

        {items.length === 0 ? (
          <div className="cart-page__empty">
            <span className="material-symbols-outlined">shopping_bag</span>
            <p>ตะกร้าของคุณยังว่างเปล่า</p>
            <Link to="/products" className="btn-cta">
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div className="cart-page__layout">
            <div className="cart-page__items">
              {items.map((item) => (
                <CartItem key={item.variantId} item={item} />
              ))}
            </div>
            <OrderSummary />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

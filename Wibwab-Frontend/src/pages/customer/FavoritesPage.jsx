// pages/customer/FavoritesPage.jsx — หน้ารายการสินค้าโปรดของลูกค้า
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ProductCard from '../../components/product/ProductCard';
import { useFavorites } from '../../context/FavoritesContext';
import '../../styles/customer.css';

export default function FavoritesPage() {
  const { favorites, loading } = useFavorites();

  return (
    <div className="customer-page">
      <Navbar />
      <main className="product-page">
        <div className="product-page__header">
          <h1 className="product-page__title">สินค้าโปรดของฉัน</h1>
          <p className="product-page__subtitle">
            รายการสินค้าที่คุณกดบันทึกไว้ — กดไอคอนหัวใจซ้ำเพื่อนำออกจากรายการ
          </p>
        </div>

        {loading ? (
          <p>กำลังโหลดรายการโปรด...</p>
        ) : favorites.length === 0 ? (
          <div className="ohp-empty-state">
            <span className="material-symbols-outlined">favorite_border</span>
            <h3>ยังไม่มีสินค้าโปรด</h3>
            <p>กดไอคอนหัวใจที่การ์ดสินค้าหรือหน้ารายละเอียดสินค้า เพื่อบันทึกไว้ดูภายหลัง</p>
            <Link to="/products" className="btn-cta">เลือกซื้อสินค้า</Link>
          </div>
        ) : (
          <div className="product-grid__container">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

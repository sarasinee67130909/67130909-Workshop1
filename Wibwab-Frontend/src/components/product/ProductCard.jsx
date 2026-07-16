// components/product/ProductCard.jsx — ชิ้นส่วน UI ฝั่งสินค้า (ยังไม่ implement)
import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  // ฟอร์แมตราคาเป็นเงินบาท (THB)
  const formattedPrice = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="product-card">
      <div className="product-card__image-wrap">
        <img 
          src={product.image_url || '/placeholder-image.jpg'} 
          alt={product.name} 
          className="product-card__image"
        />
        {/* ไอคอนหัวใจ (Wishlist - แสดงผลไว้ตามโจทย์) */}
        <button className="product-card__wishlist" aria-label="Add to wishlist">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>favorite</span>
        </button>
      </div>
      
      <div className="product-card__info">
        <h3 className="product-card__name">{product.name}</h3>
        <span className="product-card__price">{formattedPrice}</span>
        
        {/* ปุ่มไปหน้าดูรายละเอียดสินค้า */}
        <Link to={`/products/${product.id}`} style={{ width: '100%' }}>
          <button className="product-card__button">
            ดูสินค้า
          </button>
        </Link>
      </div>
    </div>
  );
}
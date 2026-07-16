// components/product/ProductGrid.jsx — ชิ้นส่วน UI ฝั่งสินค้า (ยังไม่ implement)
import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, page, totalPages, onPageChange }) {
  
  if (loading) {
    return <div className="product-grid__loading">กำลังโหลดข้อมูลสินค้า...</div>;
  }

  if (!products || products.length === 0) {
    return <div className="product-grid__empty">ไม่พบสินค้าที่คุณกำลังมองหา ลองปรับตัวกรองใหม่</div>;
  }

  return (
    <div className="product-grid__wrapper">
      <div className="product-grid__container">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {/* ระบบแบ่งหน้า (Pagination) */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination__button" 
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ก่อนหน้า
          </button>
          <span>หน้า {page} จาก {totalPages}</span>
          <button 
            className="pagination__button" 
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
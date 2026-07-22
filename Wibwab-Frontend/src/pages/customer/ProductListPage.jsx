// pages/customer/ProductListPage.jsx — หน้ารายการสินค้า + ตัวกรอง (ธีม Rose Gold)
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import FilterSidebar from '../../components/product/FilterSidebar';
import ProductGrid from '../../components/product/ProductGrid';
import { getProducts } from '../../api/product.api';

export default function ProductListPage() {
  // อ่านหมวดหมู่จาก URL (?category=1) ที่ลิงก์มาจาก Navbar/HomePage
  const [searchParams] = useSearchParams();

  // สถานะสินค้าที่ดึงมา
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // สถานะตัวกรอง (Lifted state) — category เริ่มต้นตามค่าใน URL
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    material: '',
    minPrice: '',
    maxPrice: '',
    size: '',
    keyword: searchParams.get('q') || '',
    page: 1
  });

  // ถ้า URL เปลี่ยนระหว่างอยู่หน้านี้ (เช่น กดหมวดอื่นใน Navbar หรือค้นหาซ้ำ) ให้ sync ลง filter
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const keyword = searchParams.get('q') || '';
    setFilters(prev =>
      prev.category === cat && prev.keyword === keyword
        ? prev
        : { ...prev, category: cat, keyword, page: 1 }
    );
  }, [searchParams]);

  // ใช้ useEffect เพื่อเรียก API เมื่อตัวกรองหรือหน้าเปลี่ยน
  useEffect(() => {
    const fetchProductsData = async () => {
      setLoading(true);
      try {
        const result = await getProducts(filters);
        // สมมติว่า Backend ตอบกลับมาในรูปแบบนี้
        if (result.success) {
          setProducts(result.data.products);
          setTotalPages(result.data.totalPages);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, [filters]); // Dependency คือตัวแปร filters ทั้ง object

  // จัดการเมื่อเปลี่ยนหน้าใน Pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนจอขึ้นด้านบนเมื่อเปลี่ยนหน้า
  };

  return (
    <div className="customer-page">
      <Navbar />
      
      <main className="product-page">
        <div className="product-page__header">
          <h1 className="product-page__title">คอลเลกชันเครื่องประดับ</h1>
          {filters.keyword ? (
            <p className="product-page__subtitle">
              ผลการค้นหา: "{filters.keyword}" — <Link to="/products">ล้างการค้นหา</Link>
            </p>
          ) : (
            <p className="product-page__subtitle">
              ค้นพบเครื่องประดับที่บ่งบอกความเป็นคุณ ผ่านคอลเลกชันที่ดีที่สุดของเรา
            </p>
          )}
        </div>

        <div className="product-page__layout">
          {/* Sidebar จัดการตัวกรอง ส่ง state และตัวเปลี่ยน state ไป */}
          <FilterSidebar filters={filters} setFilters={setFilters} />
          
          {/* Grid สินค้า ส่งข้อมูลที่ได้จาก API ลงไปเรนเดอร์ */}
          <ProductGrid 
            products={products} 
            loading={loading}
            page={filters.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
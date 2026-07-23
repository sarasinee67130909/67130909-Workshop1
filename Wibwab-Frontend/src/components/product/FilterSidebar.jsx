// components/product/FilterSidebar.jsx — แถบตัวกรองสินค้า (หมวดหมู่/วัสดุ/ราคา/ไซซ์)
import React from 'react';

export default function FilterSidebar({ filters, setFilters }) {
  // ใช้ id เป็นค่ามาตรฐานเดียวกับลิงก์ ?category= (ตรงกับตาราง categories ใน seed.sql)
  const categories = [
    { id: '1', label: 'แหวน' },
    { id: '2', label: 'สร้อยคอ' },
    { id: '3', label: 'ต่างหู' },
    { id: '4', label: 'กำไล' },
  ];
  // คีย์เวิร์ดวัสดุ — Backend จะค้นแบบ LIKE %ค่า% ให้ครอบคลุมชื่อวัสดุจริงใน DB
  const materials = ['เงินแท้', 'สแตนเลส', 'ชุบทอง', 'มุก', 'หิน'];
  // ไซซ์ตามข้อมูลจริงใน seed.sql — Backend ค้นแบบ LIKE ค่า%
  const sizes = [
    { value: '5', label: 'แหวน 5 (49 มม.)' },
    { value: '6', label: 'แหวน 6 (52 มม.)' },
    { value: '7', label: 'แหวน 7 (54 มม.)' },
    { value: '16 นิ้ว', label: 'สร้อย 16 นิ้ว' },
    { value: '18 นิ้ว', label: 'สร้อย 18 นิ้ว' },
    { value: '20 นิ้ว', label: 'สร้อย 20 นิ้ว' },
    { value: 'ฟรีไซซ์', label: 'ฟรีไซซ์' },
  ];

  // ฟังก์ชันช่วยเปลี่ยนค่า State
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // สำหรับ Checkbox (หมวดหมู่ / วัสดุ)
      // โค้ดนี้สมมติให้เลือกได้ทีละ 1 ค่า (ส่งไปหา API ง่ายๆ) หรือปรับเป็น Array ได้ถ้า Backend รองรับ
      // เพื่อความเรียบง่ายตามโจทย์ ให้คลิกแล้วแทนที่ค่าไปเลย หากติ๊กออกให้เป็นค่าว่าง
      setFilters(prev => ({
        ...prev,
        [name]: checked ? value : '',
        page: 1 // รีเซ็ตหน้ากลับไป 1 เมื่อเปลี่ยนฟิลเตอร์
      }));
    } else {
      // สำหรับ Input Text และ Select
      setFilters(prev => ({
        ...prev,
        [name]: value,
        page: 1
      }));
    }
  };

  // ล้างค่าตัวกรองทั้งหมด
  const handleClearAll = () => {
    setFilters({
      category: '',
      material: '',
      minPrice: '',
      maxPrice: '',
      size: '',
      page: 1
    });
  };

  return (
    <aside className="filter-sidebar">
      <div className="filter-sidebar__header">
        <h2 className="filter-sidebar__title">ตัวกรอง</h2>
        <button className="filter-sidebar__clear" onClick={handleClearAll}>
          ล้างตัวกรองทั้งหมด
        </button>
      </div>

      {/* หมวดหมู่ */}
      <div className="filter-group">
        <h3 className="filter-group__title">หมวดหมู่</h3>
        {categories.map(cat => (
          <label key={cat.id} className="filter-checkbox">
            <input
              type="checkbox"
              name="category"
              value={cat.id}
              checked={filters.category === cat.id}
              onChange={handleChange}
            />
            {cat.label}
          </label>
        ))}
      </div>

      {/* วัสดุ */}
      <div className="filter-group">
        <h3 className="filter-group__title">วัสดุ</h3>
        {materials.map(mat => (
          <label key={mat} className="filter-checkbox">
            <input 
              type="checkbox" 
              name="material"
              value={mat}
              checked={filters.material === mat}
              onChange={handleChange}
            />
            {mat}
          </label>
        ))}
      </div>

      {/* ช่วงราคา */}
      <div className="filter-group">
        <h3 className="filter-group__title">ช่วงราคา</h3>
        <div className="filter-price-inputs">
          <input 
            type="number" 
            placeholder="ต่ำสุด (฿)" 
            name="minPrice"
            value={filters.minPrice}
            onChange={handleChange}
            className="filter-price-input"
          />
          <span>-</span>
          <input 
            type="number" 
            placeholder="สูงสุด (฿)" 
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
            className="filter-price-input"
          />
        </div>
      </div>

      {/* ไซซ์แหวน */}
      <div className="filter-group">
        <h3 className="filter-group__title">ไซซ์</h3>
        <select 
          name="size" 
          value={filters.size} 
          onChange={handleChange}
          className="filter-size-select"
        >
          <option value="">ทั้งหมด</option>
          {sizes.map(size => (
            <option key={size.value} value={size.value}>{size.label}</option>
          ))}
        </select>
      </div>
    </aside>
  );
}
// components/product/VariantSelector.jsx — ชิปเลือกตัวเลือกสินค้า (ไซซ์/สี) + ราคาและสถานะสต็อกต่อ variant
import React from 'react';

// รวม attribute ที่มีค่าเป็นป้ายชิป เช่น "16 นิ้ว · เงิน" (สินค้าส่วนใหญ่ต่างกันแกนเดียว)
export function variantLabel(variant) {
  return [variant.size, variant.color].filter(Boolean).join(' · ');
}

const formatTHB = (value) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(value);

export default function VariantSelector({ variants = [], selected, onSelect, onOpenSizeGuide }) {
  if (variants.length === 0) return null;

  return (
    <div className="pdp-variants">
      <div className="pdp-variants__header">
        <label className="pdp-variants__label">ตัวเลือกสินค้า</label>
        <button type="button" className="pdp-variants__size-guide" onClick={onOpenSizeGuide}>
          ตารางไซซ์
        </button>
      </div>

      <div className="pdp-variants__options">
        {variants.map((variant) => {
          const outOfStock = variant.stock_qty === 0;
          return (
            <label
              key={variant.id}
              className={`pdp-variants__option ${outOfStock ? 'pdp-variants__option--disabled' : ''}`}
            >
              <input
                type="radio"
                name="variant"
                value={variant.id}
                checked={selected?.id === variant.id}
                onChange={() => onSelect(variant)}
                disabled={outOfStock}
              />
              <div className="pdp-variants__option-box pdp-variants__option-box--rich">
                <span>{variantLabel(variant)}</span>
                <span className="pdp-variants__option-price">{formatTHB(variant.price)}</span>
                {outOfStock && <div className="pdp-variants__strike-through"></div>}
              </div>
            </label>
          );
        })}
      </div>

      {/* สถานะสต็อกของตัวเลือกที่เลือกอยู่ */}
      {selected && (
        selected.stock_qty === 0 ? (
          <p className="pdp-stock pdp-stock--out">สินค้าหมด</p>
        ) : selected.stock_qty <= (selected.low_stock_threshold ?? 5) ? (
          <p className="pdp-stock pdp-stock--low">เหลือเพียง {selected.stock_qty} ชิ้น — รีบหน่อยนะ!</p>
        ) : (
          <p className="pdp-stock pdp-stock--in">มีสินค้าพร้อมส่ง</p>
        )
      )}

      {selected?.material && (
        <p className="pdp-variants__material">วัสดุ: {selected.material} · SKU: {selected.sku}</p>
      )}
    </div>
  );
}

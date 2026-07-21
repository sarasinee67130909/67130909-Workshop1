// components/cart/PromoCodeInput.jsx — ช่องกรอกโค้ดส่วนลด + แสดงผลการตรวจสอบ
import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function PromoCodeInput() {
  const { promo, applyPromo, removePromo } = useCart();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(null); // { success, text }
  const [checking, setChecking] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    const result = await applyPromo(code);
    setChecking(false);
    setMessage({ success: result.success, text: result.message });
    if (result.success) setCode('');
  };

  // มีโค้ดใช้อยู่แล้ว — แสดงสถานะ + ปุ่มยกเลิก
  if (promo) {
    return (
      <div className="promo-box promo-box--applied">
        <span className="material-symbols-outlined">sell</span>
        <span>
          ใช้โค้ด <strong>{promo.code}</strong> แล้ว
        </span>
        <button
          type="button"
          onClick={() => {
            removePromo();
            setMessage(null);
          }}
        >
          ยกเลิก
        </button>
      </div>
    );
  }

  return (
    <form className="promo-box" onSubmit={handleApply}>
      <div className="promo-box__row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="โค้ดส่วนลด เช่น WELCOME10"
          aria-label="โค้ดส่วนลด"
        />
        <button type="submit" className="btn-outline promo-box__apply" disabled={checking}>
          {checking ? 'กำลังตรวจสอบ...' : 'ใช้โค้ด'}
        </button>
      </div>
      {message && (
        <p className={`promo-box__msg ${message.success ? 'promo-box__msg--ok' : 'promo-box__msg--err'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}

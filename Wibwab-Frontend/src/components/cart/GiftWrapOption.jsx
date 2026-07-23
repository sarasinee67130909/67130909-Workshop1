// components/cart/GiftWrapOption.jsx — ตัวเลือกห่อของขวัญ + ข้อความในการ์ด (ตรงกับ orders.gift_wrap / gift_message)
import React from 'react';

export default function GiftWrapOption({ isGift, onIsGiftChange, message, onMessageChange }) {
  return (
    <div className="chk-gift-wrap">
      <label className="chk-gift-wrap__checkbox">
        <input
          type="checkbox"
          checked={isGift}
          onChange={(e) => onIsGiftChange(e.target.checked)}
        />
        <span className="material-symbols-outlined">
          {isGift ? 'check_box' : 'check_box_outline_blank'}
        </span>
        <span>บริการห่อของขวัญในกล่องพรีเมียม (ฟรี)</span>
      </label>

      {isGift && (
        <div className="chk-gift-wrap__message">
          <label htmlFor="gift_message">ข้อความในการ์ด (ไม่เกิน 150 ตัวอักษร)</label>
          <textarea
            id="gift_message"
            rows="3"
            maxLength="150"
            placeholder="เช่น สุขสันต์วันเกิดนะ ขอให้มีความสุขมากๆ"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
          ></textarea>
        </div>
      )}
    </div>
  );
}

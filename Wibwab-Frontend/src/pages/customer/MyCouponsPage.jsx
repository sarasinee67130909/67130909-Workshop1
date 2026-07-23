// pages/customer/MyCouponsPage.jsx — กระเป๋าคูปองของลูกค้า (โค้ดที่ถูก push เข้าบัญชีอัตโนมัติ)
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getMyCoupons } from '../../api/coupon.api';
import '../../styles/customer.css';

function formatDiscount(coupon) {
  return coupon.discount_type === 'percent'
    ? `ลด ${coupon.discount_value}%`
    : `ลด ฿${coupon.discount_value.toLocaleString('th-TH')}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MyCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCoupons()
      .then((res) => res.success && setCoupons(res.data))
      .catch((err) => console.error('Failed to fetch coupons:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="customer-page">
      <Navbar />
      <main className="ohp-main">
        <div className="ohp-header">
          <h1>คูปองของฉัน</h1>
          <p>คูปองส่วนลดที่ระบบส่งเข้าบัญชีคุณโดยอัตโนมัติ นำโค้ดไปกรอกตอนเช็คเอาท์ได้เลย</p>
        </div>

        {loading ? (
          <p>กำลังโหลดคูปอง...</p>
        ) : coupons.length === 0 ? (
          <div className="ohp-empty-state">
            <span className="material-symbols-outlined">redeem</span>
            <h3>ยังไม่มีคูปองในกระเป๋า</h3>
            <p>เมื่อร้านค้าแจกโค้ดส่วนลดให้คุณ คูปองจะมาปรากฏที่นี่โดยอัตโนมัติ</p>
          </div>
        ) : (
          <div className="ohp-list">
            {coupons.map((coupon) => {
              const disabled = coupon.is_used || coupon.is_expired;
              return (
                <div
                  key={coupon.user_coupon_id}
                  className="ohp-card"
                  style={disabled ? { opacity: 0.55 } : undefined}
                >
                  <div className="ohp-card__header">
                    <div>
                      <span className="ohp-card__date">
                        ได้รับเมื่อ {formatDate(coupon.assigned_at)}
                        {coupon.expires_at && ` · หมดอายุ ${formatDate(coupon.expires_at)}`}
                      </span>
                      <h3 className="ohp-card__id">{coupon.label || coupon.code}</h3>
                    </div>
                    <span
                      className={`ohp-status ohp-status--${
                        coupon.is_used ? 'gray' : coupon.is_expired ? 'gray' : 'green'
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {coupon.is_used ? 'task_alt' : coupon.is_expired ? 'cancel' : 'sell'}
                      </span>
                      {coupon.is_used ? 'ใช้แล้ว' : coupon.is_expired ? 'หมดอายุ' : 'ใช้งานได้'}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0' }}>
                    <strong>{formatDiscount(coupon)}</strong>
                    {coupon.min_order_total > 0 && (
                      <span> เมื่อซื้อครบ ฿{coupon.min_order_total.toLocaleString('th-TH')}</span>
                    )}
                  </p>
                  <p className="mono" style={{ marginTop: 8, color: 'var(--rg-text-muted, #888)' }}>
                    โค้ด: {coupon.code}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

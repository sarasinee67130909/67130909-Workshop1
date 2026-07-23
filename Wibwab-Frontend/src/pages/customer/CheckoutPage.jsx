// pages/customer/CheckoutPage.jsx — หน้าชำระเงินและกรอกที่อยู่ (แปลงจากดีไซน์ + ปรับตามระบบ)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Footer from '../../components/common/Footer';
import PromoCodeInput from '../../components/cart/PromoCodeInput';
import GiftWrapOption from '../../components/cart/GiftWrapOption';
import { createOrder, uploadSlip } from '../../api/order.api';

// ฟอร์แมตราคาเป็นเงินบาท
const formatTHB = (value) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(value);

export default function CheckoutPage() {
  const { items, subtotal, discount, total, promo, clearCart } = useCart();
  const navigate = useNavigate();

  // State สำหรับฟอร์ม
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
  });
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Guard: ถ้าตะกร้าว่าง ให้ redirect ไปหน้าสินค้า
  useEffect(() => {
    if (items.length === 0 && !isSubmitting) {
      navigate('/products');
    }
  }, [items, navigate, isSubmitting]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentSlip(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!shippingInfo.name) newErrors.name = 'กรุณากรอกชื่อผู้รับ';
    if (!shippingInfo.phone) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    if (!shippingInfo.address) newErrors.address = 'กรุณากรอกที่อยู่';
    if (!shippingInfo.subdistrict) newErrors.subdistrict = 'กรุณากรอกตำบล/แขวง';
    if (!shippingInfo.district) newErrors.district = 'กรุณากรอกอำเภอ/เขต';
    if (!shippingInfo.province) newErrors.province = 'กรุณากรอกจังหวัด';
    if (!shippingInfo.postalCode) newErrors.postalCode = 'กรุณากรอกรหัสไปรษณีย์';
    if (!paymentSlip) newErrors.slip = 'กรุณาแนบสลิปโอนเงิน';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitError('');
    setIsSubmitting(true);
    try {
      // รวมที่อยู่เป็นบรรทัดเดียว ตรงกับที่ตาราง orders เก็บ shipping_address เป็น TEXT ก้อนเดียว
      const shipping_address = `${shippingInfo.address} ต.${shippingInfo.subdistrict} อ.${shippingInfo.district} จ.${shippingInfo.province}`;

      const orderRes = await createOrder({
        items: items.map((it) => ({ variant_id: it.variantId, quantity: it.qty })),
        shipping_name: shippingInfo.name,
        shipping_phone: shippingInfo.phone,
        shipping_address,
        shipping_postal_code: shippingInfo.postalCode,
        promo_code: promo?.code,
        gift_wrap: isGift,
        gift_message: isGift ? giftMessage : undefined,
      });

      const orderId = orderRes.data.order_id;
      await uploadSlip(orderId, paymentSlip);

      clearCart();
      navigate('/orders');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="wip-page">
        <h1>ตะกร้าสินค้าว่าง</h1>
        <p>ไม่มีสินค้าในตะกร้าสำหรับชำระเงิน</p>
        <Link to="/products">← กลับไปเลือกซื้อสินค้า</Link>
      </div>
    );
  }

  return (
    <div className="chk-page-container">
      {/* ── Header แบบเรียบสำหรับหน้า Checkout ── */}
      <header className="chk-header">
        <Link to="/" className="chk-header__brand">
          วิบวับ
        </Link>
      </header>

      <main className="chk-main">
        <div className="chk-layout">
          {/* ── ซ้าย: ฟอร์มที่อยู่และชำระเงิน ── */}
          <div className="chk-left-col">
            <form onSubmit={handleSubmit} noValidate>
              {/* ที่อยู่จัดส่ง */}
              <div className="chk-section">
                <h2 className="chk-section__title">ที่อยู่สำหรับจัดส่ง</h2>
                <div className="chk-grid">
                  <div className="chk-grid__full">
                    <input type="text" name="name" placeholder="ชื่อ-นามสกุล ผู้รับ" className="custom-input" onChange={handleInputChange} />
                    {errors.name && <span className="chk-error-msg">{errors.name}</span>}
                  </div>
                  <div className="chk-grid__full">
                    <input type="tel" name="phone" placeholder="เบอร์โทรศัพท์" className="custom-input" onChange={handleInputChange} />
                    {errors.phone && <span className="chk-error-msg">{errors.phone}</span>}
                  </div>
                  <div className="chk-grid__full">
                    <input type="text" name="address" placeholder="ที่อยู่ (บ้านเลขที่, หมู่, ถนน)" className="custom-input" onChange={handleInputChange} />
                    {errors.address && <span className="chk-error-msg">{errors.address}</span>}
                  </div>
                  <div className="chk-grid__half">
                    <input type="text" name="subdistrict" placeholder="ตำบล/แขวง" className="custom-input" onChange={handleInputChange} />
                    {errors.subdistrict && <span className="chk-error-msg">{errors.subdistrict}</span>}
                  </div>
                  <div className="chk-grid__half">
                    <input type="text" name="district" placeholder="อำเภอ/เขต" className="custom-input" onChange={handleInputChange} />
                    {errors.district && <span className="chk-error-msg">{errors.district}</span>}
                  </div>
                  <div className="chk-grid__half">
                    <input type="text" name="province" placeholder="จังหวัด" className="custom-input" onChange={handleInputChange} />
                    {errors.province && <span className="chk-error-msg">{errors.province}</span>}
                  </div>
                  <div className="chk-grid__half">
                    <input type="text" name="postalCode" placeholder="รหัสไปรษณีย์" className="custom-input" onChange={handleInputChange} />
                    {errors.postalCode && <span className="chk-error-msg">{errors.postalCode}</span>}
                  </div>
                </div>
              </div>

              {/* บริการห่อของขวัญ */}
              <div className="chk-section">
                <h2 className="chk-section__title">บริการพิเศษ</h2>
                <GiftWrapOption
                  isGift={isGift}
                  onIsGiftChange={setIsGift}
                  message={giftMessage}
                  onMessageChange={setGiftMessage}
                />
              </div>

              {/* การชำระเงิน (โอนเงิน + แนบสลิป) */}
              <div className="chk-section">
                <h2 className="chk-section__title">การชำระเงิน</h2>
                <div className="chk-payment-box">
                  <p>กรุณาโอนเงินค่าสินค้าเต็มจำนวนมาที่บัญชี:</p>
                  <div className="chk-payment-account">
                    <p>ธนาคารกสิกรไทย</p>
                    <p>ชื่อบัญชี: บจก. วิบวับ จิวเวลรี่</p>
                    <p>เลขที่บัญชี: <strong>123-4-56789-0</strong></p>
                  </div>
                  <p>ยอดชำระ: <strong className="chk-payment-total">{formatTHB(total)}</strong></p>
                  <hr className="chk-payment-divider" />
                  <label htmlFor="payment-slip" className="chk-payment-upload-label">
                    <span className="material-symbols-outlined">upload_file</span>
                    แนบสลิปโอนเงิน
                  </label>
                  <input type="file" id="payment-slip" accept="image/*" onChange={handleFileChange} className="chk-payment-upload-input" />
                  {errors.slip && <span className="chk-error-msg">{errors.slip}</span>}
                  {slipPreview && (
                    <div className="chk-payment-preview">
                      <img src={slipPreview} alt="ภาพสลิปที่แนบ" />
                    </div>
                  )}
                </div>
              </div>

              {submitError && <p className="chk-error-msg chk-submit-error">{submitError}</p>}

              <div className="chk-actions">
                <Link to="/cart" className="chk-back-link">
                  <span className="material-symbols-outlined">arrow_back</span>
                  กลับไปที่ตะกร้า
                </Link>
                <button type="submit" className="btn-cta chk-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันคำสั่งซื้อ'}
                </button>
              </div>
            </form>
          </div>

          {/* ── ขวา: สรุปรายการสั่งซื้อ ── */}
          <div className="chk-right-col">
            <div className="chk-summary">
              <h2 className="chk-summary__title">สรุปรายการสั่งซื้อ</h2>
              <div className="chk-summary__items">
                {items.map((item) => (
                  <div key={item.variantId} className="chk-summary-item">
                    <div className="chk-summary-item__image">
                      <img src={item.image} alt={item.name} />
                      <span className="chk-summary-item__qty">{item.qty}</span>
                    </div>
                    <div className="chk-summary-item__info">
                      <p className="chk-summary-item__name">{item.name}</p>
                      <p className="chk-summary-item__variant">{item.variantLabel}</p>
                    </div>
                    <p className="chk-summary-item__price">{formatTHB(item.unitPrice * item.qty)}</p>
                  </div>
                ))}
              </div>

              <div className="chk-summary__promo">
                <PromoCodeInput />
              </div>

              <div className="chk-summary__totals">
                <div className="chk-summary__row">
                  <span>ยอดรวม</span>
                  <span>{formatTHB(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="chk-summary__row chk-summary__row--discount">
                    <span>ส่วนลด ({promo.code})</span>
                    <span>- {formatTHB(discount)}</span>
                  </div>
                )}
                <div className="chk-summary__row chk-summary__row--final">
                  <span>ยอดสุทธิ</span>
                  <span>{formatTHB(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

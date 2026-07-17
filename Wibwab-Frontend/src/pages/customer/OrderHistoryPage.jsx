// pages/customer/OrderHistoryPage.jsx — หน้าประวัติคำสั่งซื้อ (แปลงจากดีไซน์ + ปรับตามระบบ)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { getMyOrders } from '../../api/order.api';
import '../../styles/customer.css';

// Map กลางสำหรับสถานะออเดอร์ (Single Source of Truth)
const STATUS_MAP = {
  pending_payment: { label: 'รอชำระเงิน', icon: 'schedule', color: 'orange' },
  paid: { label: 'ชำระเงินแล้ว', icon: 'check_circle', color: 'blue' },
  preparing: { label: 'กำลังเตรียมจัดส่ง', icon: 'inventory_2', color: 'purple' },
  shipped: { label: 'จัดส่งแล้ว', icon: 'local_shipping', color: 'indigo' },
  delivered: { label: 'ได้รับสินค้าแล้ว', icon: 'task_alt', color: 'green' },
  cancelled: { label: 'ยกเลิกแล้ว', icon: 'cancel', color: 'gray' },
};

const FILTER_TABS = ['all', ...Object.keys(STATUS_MAP)];

const formatTHB = (value) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(value);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [reviewingItem, setReviewingItem] = useState(null); // { orderId, item }

  useEffect(() => {
    setLoading(true);
    getMyOrders()
      .then((res) => {
        if (res.success) {
          setOrders(res.data);
          if (res.isMock) setIsMock(true);
        }
      })
      .catch((err) => console.error('Failed to fetch orders:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelOrder = (orderId) => {
    if (window.confirm(`ต้องการยกเลิกคำสั่งซื้อ #${orderId} ใช่หรือไม่?`)) {
      // TODO: เรียก API PUT /api/orders/:id/cancel เมื่อ Backend เสร็จ
      alert(`(เดโม) ส่งคำขอยกเลิกคำสั่งซื้อ #${orderId} แล้ว`);
    }
  };

  const handleUploadSlip = (orderId) => {
    // TODO: เปิด Modal สำหรับอัปโหลดไฟล์ และเรียก POST /api/orders/:id/slip
    alert(`(เดโม) เปิดหน้าต่างสำหรับแนบสลิปของคำสั่งซื้อ #${orderId}`);
  };

  const filteredOrders =
    activeFilter === 'all' ? orders : orders.filter((o) => o.status === activeFilter);

  const renderEmptyState = () => (
    <div className="ohp-empty-state">
      <span className="material-symbols-outlined">receipt_long</span>
      <h3>ยังไม่มีคำสั่งซื้อ</h3>
      <p>ค้นหาเครื่องประดับชิ้นโปรดและเริ่มเส้นทางการช้อปปิ้งของคุณกับวิบวับ</p>
      <Link to="/products" className="btn-cta">
        เริ่มช้อปปิง
      </Link>
    </div>
  );

  const renderOrderCard = (order) => {
    const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.cancelled;
    return (
      <div key={order.id} className="ohp-card">
        <div className="ohp-card__header">
          <div>
            <span className="ohp-card__date">วันที่สั่งซื้อ: {formatDate(order.created_at)}</span>
            <h3 className="ohp-card__id">คำสั่งซื้อ #{order.id}</h3>
          </div>
          <span className={`ohp-status ohp-status--${statusInfo.color}`}>
            <span className="material-symbols-outlined">{statusInfo.icon}</span>
            {statusInfo.label}
          </span>
        </div>

        <div className="ohp-card__body">
          {order.items.map((item, index) => (
            <div key={index} className="ohp-item">
              <div className="ohp-item__image">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="ohp-item__info">
                <h4 className="ohp-item__name">{item.name}</h4>
                <p className="ohp-item__variant">{item.variant_label}</p>
                <p className="ohp-item__price">
                  {formatTHB(item.unit_price)} x {item.qty}
                </p>
                {order.gift_wrap && index === 0 && (
                  <div className="ohp-item__gift">
                    <span className="material-symbols-outlined">redeem</span>
                    ห่อของขวัญพร้อมการ์ด
                  </div>
                )}
              </div>
              <div className="ohp-item__actions">
                {order.status === 'delivered' &&
                  (order.reviewed_product_ids?.includes(item.product_id) ? (
                    <span className="ohp-item__reviewed">รีวิวแล้ว ✓</span>
                  ) : (
                    <button
                      className="btn-outline"
                      onClick={() => setReviewingItem({ orderId: order.id, item })}
                    >
                      รีวิวสินค้า
                    </button>
                  ))}
              </div>
            </div>
          ))}
          {order.status === 'shipped' && order.tracking_number && (
            <div className="ohp-tracking-info">
              <strong>เลขพัสดุ:</strong> {order.tracking_number}
            </div>
          )}
        </div>

        <div className="ohp-card__footer">
          <div className="ohp-card__total">ยอดรวม: {formatTHB(order.total_amount)}</div>
          <div className="ohp-card__actions">
            {order.status === 'pending_payment' && (
              <>
                <button className="btn-outline ohp-btn--cancel" onClick={() => handleCancelOrder(order.id)}>
                  ยกเลิก
                </button>
                {!order.slip_image && (
                  <button className="btn-cta" onClick={() => handleUploadSlip(order.id)}>
                    แนบสลิป
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="customer-page">
      <Navbar />
      <main className="ohp-main">
        <div className="ohp-header">
          <h1>คำสั่งซื้อของฉัน</h1>
          <p>ติดตามสถานะ ตรวจสอบประวัติ และรีวิวสินค้าที่คุณได้รับ</p>
        </div>

        {isMock && (
          <div className="pdp-mock-banner" style={{ marginBottom: '24px' }}>
            <span className="material-symbols-outlined">info</span>
            กำลังแสดงข้อมูลตัวอย่าง — ยังไม่ได้เชื่อมต่อ Backend
          </div>
        )}

        {/* Filter Tabs */}
        <div className="ohp-filter-tabs">
          <div className="ohp-filter-tabs__inner">
            {FILTER_TABS.map((status) => (
              <button
                key={status}
                className={`ohp-filter-tab ${activeFilter === status ? 'ohp-filter-tab--active' : ''}`}
                onClick={() => setActiveFilter(status)}
              >
                {status === 'all' ? 'ทั้งหมด' : STATUS_MAP[status]?.label || status}
              </button>
            ))}
          </div>
        </div>

        {/* Order List */}
        <div className="ohp-list">
          {loading ? (
            <p>กำลังโหลดประวัติการสั่งซื้อ...</p>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map(renderOrderCard)
          ) : (
            renderEmptyState()
          )}
        </div>
      </main>

      {reviewingItem && (
        <ReviewModal
          orderId={reviewingItem.orderId}
          item={reviewingItem.item}
          onClose={() => setReviewingItem(null)}
          onSuccess={() => {
            // ทำให้ UI อัปเดตทันทีโดยไม่ต้อง fetch ใหม่
            setOrders((prev) =>
              prev.map((o) =>
                o.id === reviewingItem.orderId
                  ? { ...o, reviewed_product_ids: [...(o.reviewed_product_ids || []), reviewingItem.item.product_id] }
                  : o
              )
            );
            setReviewingItem(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}

// --- Review Modal Component ---

function ReviewModal({ orderId, item, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('กรุณาให้คะแนนสินค้า');
      return;
    }
    // TODO: เรียก API POST /api/reviews เมื่อ Backend เสร็จ
    // body: { product_id: item.product_id, order_id: orderId, rating, comment }
    console.log('Submitting review:', {
      orderId,
      productId: item.product_id,
      rating,
      comment,
    });
    alert('(เดโม) ส่งรีวิวสำหรับสินค้าเรียบร้อยแล้ว ขอบคุณค่ะ!');
    onSuccess();
  };

  return (
    <div className="pdp-modal-backdrop" onClick={onClose}>
      <div className="pdp-modal ohp-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdp-modal__head">
          <h3>เขียนรีวิวสินค้า</h3>
          <button onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ohp-review-modal__item">
            <div className="ohp-review-modal__image">
              <img src={item.image} alt={item.name} />
            </div>
            <div>
              <h4>{item.name}</h4>
              <p>{item.variant_label}</p>
            </div>
          </div>

          <div className="ohp-review-modal__rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className="material-symbols-outlined"
                style={{ fontVariationSettings: `'FILL' ${star <= rating ? 1 : 0}` }}
                onClick={() => setRating(star)}
              >
                star
              </span>
            ))}
          </div>

          <div className="ohp-review-modal__comment">
            <textarea
              placeholder="แบ่งปันประสบการณ์ของคุณ..."
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>

          <div className="ohp-review-modal__footer">
            <button type="submit" className="btn-cta">
              ส่งรีวิว
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
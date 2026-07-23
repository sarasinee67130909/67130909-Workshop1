import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import NotificationBell from '../dashboard/NotificationBell';
import {
  getStaffNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getStaffReview,
} from '../../api/staff.api';

// ป๊อปอัพแสดงรีวิวใบเดียว (เปิดตอนคลิกแจ้งเตือน "ลูกค้ารีวิว") — มีปุ่มไปดูหน้าสินค้าเพิ่มเติม
function ReviewModal({ reviewId, onClose, onViewProduct }) {
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getStaffReview(reviewId)
      .then((res) => res.success && setReview(res.data))
      .catch((err) => setError(err.response?.data?.message || 'โหลดรีวิวไม่สำเร็จ'));
  }, [reviewId]);

  return (
    <Modal onClose={onClose}>
      <div style={{ minWidth: 320, maxWidth: 420 }}>
        <h3 style={{ marginTop: 0 }}>รีวิวจากลูกค้า</h3>
        {error && <p className="staff-login__error">{error}</p>}
        {!review && !error && <p>กำลังโหลด...</p>}
        {review && (
          <>
            <p style={{ margin: '0 0 4px' }}>
              สินค้า: <strong>{review.product_name}</strong>
            </p>
            <p style={{ margin: '0 0 8px', color: 'var(--staff-text-muted)' }}>
              โดย {review.user_name} · {review.created_at}
            </p>
            <div style={{ color: '#eab308', fontSize: 18, marginBottom: 8 }}>
              {'★'.repeat(review.rating)}
              <span style={{ color: 'var(--staff-border)' }}>{'★'.repeat(5 - review.rating)}</span>
            </div>
            {review.comment && <p style={{ margin: '0 0 16px' }}>{review.comment}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="staff-btn staff-btn--primary"
                onClick={() => onViewProduct(review.product_id)}
              >
                ดูหน้าสินค้า
              </button>
              <button type="button" className="staff-btn staff-btn--secondary" onClick={onClose}>
                ปิด
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// แจ้งเตือน "ลูกค้ารีวิว" เปิดเป็นป๊อปอัพแสดงรีวิวใบนั้นโดยตรง — ประเภทอื่นผูกกับออเดอร์ (order_id)
// พาไปเปิดออเดอร์นั้นที่หน้าคำสั่งซื้อเหมือนเดิม
export default function StaffTopbar() {
  const navigate = useNavigate();
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  function handleNotifSelect(notif) {
    if (notif.type === 'new_review' && notif.review_id) {
      setSelectedReviewId(notif.review_id);
      return;
    }
    if (notif.order_id) {
      navigate('/staff/orders', { state: { openOrderId: notif.order_id } });
    }
  }

  return (
    <header className="staff-topbar">
      <div className="staff-topbar__left">
        <button className="staff-icon-btn staff-mobile-only" aria-label="เปิดเมนู">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div className="staff-topbar__right">
        <NotificationBell
          classPrefix="staff"
          markAllLinkClassName="staff-card__link"
          getNotifications={getStaffNotifications}
          markRead={markNotificationRead}
          markAllRead={markAllNotificationsRead}
          deleteNotification={deleteNotification}
          onSelect={handleNotifSelect}
        />

        <button className="staff-icon-btn" aria-label="ช่วยเหลือ">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </div>

      {selectedReviewId && (
        <ReviewModal
          reviewId={selectedReviewId}
          onClose={() => setSelectedReviewId(null)}
          onViewProduct={(productId) => {
            setSelectedReviewId(null);
            navigate(`/staff/products/${productId}`);
          }}
        />
      )}
    </header>
  );
}

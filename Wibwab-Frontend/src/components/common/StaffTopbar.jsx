import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth as useAuth } from '../../context/StaffAuthContext';
import { getStaffNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/staff.api';

const POLL_INTERVAL_MS = 25000;

// สร้างอักษรย่อจากชื่อ-นามสกุลจริง (เช่น "สมชาย ใจดี" → "สจ") ไว้โชว์ตอนไม่มีรูปโปรไฟล์
function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p.charAt(0)).join('');
  return initials.toUpperCase() || '?';
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'เมื่อสักครู่';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hours / 24)} วันที่แล้ว`;
}

/**
 * แถบด้านบนของ Staff Portal — มีปุ่มแจ้งเตือน (กระดิ่ง) และผู้ใช้ปัจจุบัน
 *
 * ช่องค้นหาย้ายไปอยู่เฉพาะหน้าคำสั่งซื้อ (OrderManagePage) แล้ว — topbar นี้ไม่มีช่องค้นหาส่วนกลางอีกต่อไป
 *
 * props:
 *   title - ข้อความหัวข้อที่โชว์ตอนจอมือถือ (เช่น "Orders")
 */
export default function StaffTopbar({ title = 'ระบบพนักงาน วิบวับ' }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  function loadNotifications() {
    getStaffNotifications()
      .then((res) => {
        if (!res.success) return;
        setNotifications(res.data.items);
        setUnreadCount(res.data.unread_count);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleItemClick(notif) {
    setOpen(false);
    if (!notif.is_read) {
      markNotificationRead(notif.id).catch(() => {});
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.order_id) {
      navigate('/staff/orders', { state: { openOrderId: notif.order_id } });
    }
  }

  function handleMarkAllRead() {
    markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  return (
    <header className="staff-topbar">
      <div className="staff-topbar__left">
        <button className="staff-icon-btn staff-mobile-only" aria-label="เปิดเมนู">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="staff-topbar__title">{title}</span>
      </div>

      <div className="staff-topbar__right">
        <div className="staff-notif" ref={panelRef}>
          <button className="staff-icon-btn" aria-label="การแจ้งเตือน" onClick={() => setOpen((v) => !v)}>
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="staff-icon-btn__dot" />}
          </button>

          {open && (
            <div className="staff-notif__panel">
              <div className="staff-notif__header">
                <span>การแจ้งเตือน</span>
                {unreadCount > 0 && (
                  <button className="staff-card__link" onClick={handleMarkAllRead}>
                    อ่านทั้งหมด
                  </button>
                )}
              </div>
              <div className="staff-notif__list">
                {notifications.length === 0 && (
                  <p className="staff-notif__empty">ยังไม่มีการแจ้งเตือน</p>
                )}
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    className={`staff-notif__item${notif.is_read ? '' : ' staff-notif__item--unread'}`}
                    onClick={() => handleItemClick(notif)}
                  >
                    <span className="staff-notif__message">{notif.message}</span>
                    <span className="staff-notif__time">{timeAgo(notif.created_at)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="staff-icon-btn" aria-label="ช่วยเหลือ">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
        <div className="staff-topbar__user">
          <span className="staff-topbar__username">{user?.full_name ?? 'พนักงาน'}</span>
          <div className="staff-topbar__avatar staff-topbar__avatar--fallback">
            {getInitials(user?.full_name)}
          </div>
        </div>
      </div>
    </header>
  );
}

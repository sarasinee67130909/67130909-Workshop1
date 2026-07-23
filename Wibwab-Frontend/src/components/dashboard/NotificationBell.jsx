// components/dashboard/NotificationBell.jsx — กระดิ่งแจ้งเตือน ใช้ร่วมกันทั้ง Staff/Admin Topbar
// ต่างกันแค่ endpoint ที่เรียก (props) และปลายทางที่คลิกแล้วพาไป (resolveLink) — เนื้อหา/ประเภทถูกกรองไว้แล้วฝั่ง backend
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const POLL_INTERVAL_MS = 25000;

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
 * props:
 *   classPrefix          - 'staff' | 'admin' — ใช้ประกอบชื่อคลาส CSS ของแต่ละธีม (ดู staff.css / admin.css)
 *   markAllLinkClassName - class ปุ่มลิงก์ "อ่านทั้งหมด" ของธีมนั้น (staff-card__link / admin-link-btn)
 *   getNotifications     - () => Promise<{success, data: {items, unread_count}}>
 *   markRead             - (id) => Promise
 *   markAllRead          - () => Promise
 *   deleteNotification   - (id) => Promise (optional — ไม่ส่ง prop นี้มา = ไม่แสดงปุ่มลบ)
 *   resolveLink          - (notif) => { to, state } | null — ปลายทางตอนคลิกแจ้งเตือน (null = ไม่ต้องนำทาง)
 *   onSelect             - (notif) => void (optional) — ถ้าส่งมา จะเรียกแทน resolveLink/navigate ทั้งหมด
 *                          ใช้ตอนอยากทำอย่างอื่นนอกจากนำทาง เช่นเปิดป๊อปอัพ (mark-read ยังทำงานตามปกติ)
 */
export default function NotificationBell({
  classPrefix,
  markAllLinkClassName,
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  resolveLink,
  onSelect,
}) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  function loadNotifications() {
    getNotifications()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      markRead(notif.id).catch(() => {});
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (onSelect) {
      onSelect(notif);
      return;
    }
    const link = resolveLink?.(notif);
    if (link) navigate(link.to, { state: link.state });
  }

  function handleMarkAllRead() {
    markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  function handleDelete(notif) {
    if (!window.confirm('ยืนยันลบการแจ้งเตือนนี้? เมื่อลบแล้วจะไม่สามารถกู้คืนได้')) return;
    deleteNotification(notif.id).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    if (!notif.is_read) setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div className={`${classPrefix}-notif`} ref={panelRef}>
      <button className={`${classPrefix}-icon-btn`} aria-label="การแจ้งเตือน" onClick={() => setOpen((v) => !v)}>
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && <span className={`${classPrefix}-icon-btn__dot`} />}
      </button>

      {open && (
        <div className={`${classPrefix}-notif__panel`}>
          <div className={`${classPrefix}-notif__header`}>
            <span>การแจ้งเตือน</span>
            {unreadCount > 0 && (
              <button className={markAllLinkClassName} onClick={handleMarkAllRead}>
                อ่านทั้งหมด
              </button>
            )}
          </div>
          <div className={`${classPrefix}-notif__list`}>
            {notifications.length === 0 && (
              <p className={`${classPrefix}-notif__empty`}>ยังไม่มีการแจ้งเตือน</p>
            )}
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`${classPrefix}-notif__item${notif.is_read ? '' : ` ${classPrefix}-notif__item--unread`}`}
              >
                <button
                  type="button"
                  className={`${classPrefix}-notif__item-main`}
                  onClick={() => handleItemClick(notif)}
                >
                  <span className={`${classPrefix}-notif__message`}>{notif.message}</span>
                  <span className={`${classPrefix}-notif__time`}>{timeAgo(notif.created_at)}</span>
                </button>
                {deleteNotification && (
                  <button
                    type="button"
                    className={`${classPrefix}-notif__delete`}
                    aria-label="ลบการแจ้งเตือน"
                    onClick={() => handleDelete(notif)}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

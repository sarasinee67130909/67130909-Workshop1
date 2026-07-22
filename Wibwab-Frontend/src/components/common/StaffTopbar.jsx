import NotificationBell from '../dashboard/NotificationBell';
import { getStaffNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/staff.api';

// แจ้งเตือนของ staff ทุกประเภทผูกกับออเดอร์ (order_id) — คลิกแล้วพาไปเปิดออเดอร์นั้นที่หน้าคำสั่งซื้อ
function resolveStaffLink(notif) {
  if (!notif.order_id) return null;
  return { to: '/staff/orders', state: { openOrderId: notif.order_id } };
}

/**
 * แถบด้านบนของ Staff Portal — บัญชีพนักงานย้ายไปโชว์ที่แถบโลโก้บน Sidebar แล้ว (ดู StaffSidebar.jsx)
 * topbar นี้เหลือแค่ปุ่มแจ้งเตือน (กระดิ่ง) และช่วยเหลือฝั่งขวา
 *
 * ช่องค้นหาย้ายไปอยู่เฉพาะหน้าคำสั่งซื้อ (OrderManagePage) แล้ว — topbar นี้ไม่มีช่องค้นหาส่วนกลางอีกต่อไป
 */
export default function StaffTopbar() {
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
          resolveLink={resolveStaffLink}
        />

        <button className="staff-icon-btn" aria-label="ช่วยเหลือ">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </div>
    </header>
  );
}

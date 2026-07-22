// components/common/AdminTopbar.jsx — แถบด้านบนของ Executive Suite
// บัญชีแอดมินย้ายไปโชว์ที่แถบโลโก้บน Sidebar แล้ว (ดู AdminSidebar.jsx) — topbar นี้เหลือแค่แจ้งเตือนฝั่งขวา
import NotificationBell from '../dashboard/NotificationBell';
import { getAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } from '../../api/admin.api';

// low_stock -> พาไปหน้ารายงานสต็อก พร้อม highlight ตัวเลือกสินค้านั้น
// order_overdue -> ยังไม่มีหน้าจัดการออเดอร์ฝั่ง admin โดยตรง พาไปหน้า dashboard ภาพรวมแทน
function resolveAdminLink(notif) {
  if (notif.type === 'low_stock' && notif.variant_id) {
    return { to: '/admin/stock-report', state: { highlightVariantId: notif.variant_id } };
  }
  if (notif.type === 'order_overdue') {
    return { to: '/admin/dashboard' };
  }
  return null;
}

export default function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left" />
      <div className="admin-topbar__right">
        <NotificationBell
          classPrefix="admin"
          markAllLinkClassName="admin-link-btn"
          getNotifications={getAdminNotifications}
          markRead={markAdminNotificationRead}
          markAllRead={markAllAdminNotificationsRead}
          resolveLink={resolveAdminLink}
        />
      </div>
    </header>
  );
}

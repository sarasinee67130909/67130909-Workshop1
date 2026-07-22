import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth as useAuth } from '../../context/AdminAuthContext';

// เมนูฝั่งแอดมิน — เพิ่ม/ลด item ได้ตรงนี้ที่เดียว
// หมายเหตุ: "โปรโมชัน" และ "พนักงาน" อยู่นอกขอบเขตของโปรเจกต์นี้ (ดู PROJECT_STRUCTURE.md ข้อ 10)
// ใส่ไว้ในดีไซน์ต้นฉบับแต่ยังไม่ผูก route จริง เผื่ออนาคตขยายระบบ
const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'ภาพรวม', icon: 'dashboard' },
  { to: '/admin/sales-report', label: 'รายงานยอดขาย', icon: 'payments' },
  { to: '/admin/stock-report', label: 'รายงานสต็อก', icon: 'inventory_2' },
  { to: '/admin/profit-report', label: 'รายงานกำไร', icon: 'trending_up' },
];

// สร้างอักษรย่อจากชื่อ-นามสกุลจริง (เช่น "มานี มีทรัพย์" → "มม") ไว้โชว์ตอนไม่มีรูปโปรไฟล์
function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p.charAt(0)).join('');
  return initials.toUpperCase() || '?';
}

/**
 * Sidebar นำทางฝั่งแอดมิน (Executive Suite)
 */
export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <nav className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__logo">{getInitials(user?.full_name)}</div>
        <div className="admin-sidebar__brand-text">
          <h1>{user?.full_name ?? 'แอดมิน'}</h1>
          <p>{user?.email ?? ''}</p>
        </div>
      </div>

      <div className="admin-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              'admin-sidebar__link' + (isActive ? ' is-active' : '')
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="admin-sidebar__footer">
        <a className="admin-sidebar__link" href="#">
          <span className="material-symbols-outlined">settings</span>
          <span>ตั้งค่า</span>
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          className="admin-sidebar__link"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <span className="material-symbols-outlined">logout</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </nav>
  );
}
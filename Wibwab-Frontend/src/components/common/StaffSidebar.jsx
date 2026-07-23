import { NavLink, useNavigate } from 'react-router-dom';
import { useStaffAuth as useAuth } from '../../context/StaffAuthContext';

// เมนูฝั่งพนักงาน — เพิ่ม/ลด item ได้ตรงนี้ที่เดียว
const NAV_ITEMS = [
  { to: '/staff/dashboard', label: 'แดชบอร์ด', icon: 'dashboard' },
  { to: '/staff/orders', label: 'คำสั่งซื้อ', icon: 'shopping_cart' },
  { to: '/staff/inventory', label: 'คลังสินค้า', icon: 'inventory_2' },
  { to: '/staff/products', label: 'สินค้า', icon: 'diamond' },
  { to: '/staff/promos', label: 'โปรโมชั่น', icon: 'local_offer' },
];

// สร้างอักษรย่อจากชื่อ-นามสกุลจริง (เช่น "สมชาย ใจดี" → "สจ") ไว้โชว์ตอนไม่มีรูปโปรไฟล์
function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p.charAt(0)).join('');
  return initials.toUpperCase() || '?';
}

/**
 * Sidebar นำทางฝั่งพนักงาน (Staff Portal)
 * ใช้ NavLink ของ react-router-dom เพื่อไฮไลต์เมนูที่ active อัตโนมัติ
 */
export default function StaffSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate('/staff/login', { replace: true });
  }

  return (
    <nav className="staff-sidebar">
      <div className="staff-sidebar__brand">
        <div className="staff-sidebar__logo">{getInitials(user?.full_name)}</div>
        <div className="staff-sidebar__brand-text">
          <h1>{user?.full_name ?? 'พนักงาน'}</h1>
          <p>{user?.email ?? ''}</p>
        </div>
      </div>

      <div className="staff-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              'staff-sidebar__link' + (isActive ? ' is-active' : '')
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>



      <div className="staff-sidebar__footer">
        <button
          type="button"
          onClick={handleSignOut}
          className="staff-sidebar__link"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <span className="material-symbols-outlined">logout</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </nav>
  );
}
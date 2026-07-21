// components/common/Navbar.jsx — แถบนำทางหลักฝั่งลูกค้า (sticky + เมนูมือถือ + badge ตะกร้า + สถานะล็อกอิน)
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCustomerAuth as useAuth } from '../../context/CustomerAuthContext';

// เมนูหมวดหมู่ — ค่า category ตรงกับ id ในตาราง categories (seed.sql)
const NAV_LINKS = [
  { label: 'หน้าแรก', to: '/' },
  { label: 'สินค้าทั้งหมด', to: '/products' },
  { label: 'แหวน', to: '/products?category=1' },
  { label: 'สร้อยคอ', to: '/products?category=2' },
  { label: 'ต่างหู', to: '/products?category=3' },
  { label: 'กำไล', to: '/products?category=4' },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button
          className="navbar-menu-btn"
          aria-label="เปิด/ปิดเมนู"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>

        <Link to="/" className="navbar-brand">
          วิบวับ
        </Link>

        {/* เมนูจอใหญ่ */}
        <nav className="navbar-links">
          {NAV_LINKS.map((item) =>
            item.to === '/' ? (
              <NavLink
                key={item.label}
                to="/"
                end
                className={({ isActive }) => (isActive ? 'navbar-link active' : 'navbar-link')}
              >
                {item.label}
              </NavLink>
            ) : (
              <Link key={item.label} to={item.to} className="navbar-link">
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="navbar-icons">
          <Link to="/products" aria-label="ค้นหาสินค้า">
            <span className="material-symbols-outlined">search</span>
          </Link>
          <Link to="/cart" aria-label="ตะกร้าสินค้า" className="navbar-cart">
            <span className="material-symbols-outlined">shopping_bag</span>
            {itemCount > 0 && <span className="navbar-cart__badge">{itemCount}</span>}
          </Link>
          {isLoggedIn ? (
            <>
              {/* ล็อกอินแล้ว: ไอคอนคน → ประวัติการสั่งซื้อ + ปุ่มออกจากระบบ */}
              <Link to="/account" aria-label="บัญชีของฉัน" className="navbar-user" title={user?.full_name}>
                <span className="material-symbols-outlined">person</span>
                <span className="navbar-user__name">{user?.full_name?.split(' ')[0]}</span>
              </Link>
              <button
                type="button"
                className="navbar-logout"
                aria-label="ออกจากระบบ"
                title="ออกจากระบบ"
                onClick={logout}
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" aria-label="เข้าสู่ระบบ">
              <span className="material-symbols-outlined">person</span>
            </Link>
          )}
        </div>
      </div>

      {/* เมนูจอเล็ก — แสดงเมื่อกด hamburger */}
      {menuOpen && (
        <nav className="navbar-mobile">
          {NAV_LINKS.map((item) => (
            <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export default Navbar;

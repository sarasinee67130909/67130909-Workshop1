// components/common/Footer.jsx — ส่วนท้ายเว็บฝั่งลูกค้า
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/">วิบวับ</Link>
          <p>
            เครื่องประดับแฟชั่นคัดสรรอย่างประณีต เปล่งประกายได้ในทุกโอกาส — แหวน สร้อยคอ ต่างหู
            และกำไล พร้อมบริการห่อของขวัญและการ์ดข้อความถึงคนพิเศษของคุณ
          </p>
        </div>

        <div className="footer-col">
          <h4>เลือกซื้อ</h4>
          <Link to="/products">สินค้าทั้งหมด</Link>
          <Link to="/products?category=1">แหวน</Link>
          <Link to="/products?category=2">สร้อยคอ</Link>
          <Link to="/products?category=4">กำไล</Link>
        </div>

        <div className="footer-col">
          <h4>บัญชีของฉัน</h4>
          <Link to="/login">เข้าสู่ระบบ</Link>
          <Link to="/register">สมัครสมาชิก</Link>
          <Link to="/orders">ประวัติการสั่งซื้อ</Link>
        </div>
      </div>

      <div className="footer-copy">© 2026 Wibwab (วิบวับ) — Online Fashion Jewelry E-Commerce</div>
    </footer>
  );
}

export default Footer;

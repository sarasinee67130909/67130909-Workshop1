// App.jsx — กำหนด routes ทั้งหมด แยกตาม role
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/customer/HomePage';
import ProductListPage from './pages/customer/ProductListPage';

// หน้าชั่วคราวสำหรับ route ที่ยังไม่ implement — กันหน้าขาวตอนกดลิงก์ในเมนู
function ComingSoon() {
  return (
    <div className="wip-page">
      <h1>อยู่ระหว่างพัฒนา 🚧</h1>
      <p>หน้านี้ยังไม่เปิดใช้งานในเวอร์ชันปัจจุบัน</p>
      <Link to="/">← กลับหน้าแรก</Link>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* ── ฝั่งลูกค้า (ธีม Rose Gold) ── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductListPage />} />
      {/* TODO: /products/:id, /cart, /checkout, /orders, /login, /register */}

      {/* ── ฝั่งพนักงาน (ธีม Teal) ── TODO: /staff/* */}
      {/* ── ฝั่งแอดมิน (ธีม Slate) ── TODO: /admin/* */}

      {/* route อื่นที่ยังไม่มี → หน้าอยู่ระหว่างพัฒนา */}
      <Route path="*" element={<ComingSoon />} />
    </Routes>
  );
}

export default App;

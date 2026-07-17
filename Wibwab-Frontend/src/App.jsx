// App.jsx — กำหนด routes ทั้งหมด แยกตาม role
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/customer/HomePage';
import ProductListPage from './pages/customer/ProductListPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';

// ── ฝั่งพนักงาน (ธีม Teal) ──
import StaffLayout from './components/common/StaffLayout';
import StaffLoginPage from './pages/staff/StaffLoginPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import OrderManagePage from './pages/staff/OrderManagePage';
import InventoryPage from './pages/staff/InventoryPage';
import ProductManagePage from './pages/staff/ProductManagePage';

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
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders" element={<OrderHistoryPage />} />
      {/* TODO: /login, /register */}

      {/* ── ฝั่งพนักงาน (ธีม Teal) ──
          หมายเหตุ: ยังไม่ห่อ ProtectedRoute เพราะ backend/auth ยังไม่เสร็จ
          พอมี JWT + AuthContext ทำงานจริงแล้ว ให้กลับมาห่อ /staff (ยกเว้น /staff/login)
          ด้วย <ProtectedRoute role="staff"> ตามตัวอย่างที่ comment ไว้ด้านล่าง */}
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route path="/staff" element={<StaffLayout />}>
        <Route index element={<StaffDashboardPage />} />
        <Route path="dashboard" element={<StaffDashboardPage />} />
        <Route path="orders" element={<OrderManagePage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="products" element={<ProductManagePage />} />
      </Route>
      {/*
        เมื่อ backend/auth พร้อมแล้ว ให้เปลี่ยนเป็นแบบนี้แทน:

        import ProtectedRoute from './components/common/ProtectedRoute';

        <Route
          path="/staff"
          element={
            <ProtectedRoute role="staff">
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          ...route ลูกเหมือนเดิม...
        </Route>
      */}

      {/* ── ฝั่งแอดมิน (ธีม Slate) ── TODO: /admin/* */}

      {/* route อื่นที่ยังไม่มี → หน้าอยู่ระหว่างพัฒนา */}
      <Route path="*" element={<ComingSoon />} />
    </Routes>
  );
}

export default App;
// App.jsx — กำหนด routes ทั้งหมด แยกตาม role
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/customer/HomePage';
import ProductListPage from './pages/customer/ProductListPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import LoginPage from './pages/customer/LoginPage';
import RegisterPage from './pages/customer/RegisterPage';
import ProfilePage from './pages/customer/ProfilePage';
import ForgotPasswordPage from './pages/customer/ForgotPasswordPage';
import ResetPasswordPage from './pages/customer/ResetPasswordPage';

// ── ฝั่งพนักงาน (ธีม Teal) ──
import StaffLayout from './components/common/StaffLayout';
import StaffLoginPage from './pages/staff/StaffLoginPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import OrderManagePage from './pages/staff/OrderManagePage';
import InventoryPage from './pages/staff/InventoryPage';
import ProductManagePage from './pages/staff/ProductManagePage';
import ProtectedRoute from './components/common/ProtectedRoute';

// ── ฝั่งแอดมิน/ผู้บริหาร (ธีม Slate + ทอง) ──
import AdminLayout from './components/common/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SalesReportPage from './pages/admin/SalesReportPage';
import StockReportPage from './pages/admin/StockReportPage';
import ProfitReportPage from './pages/admin/ProfitReportPage';

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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Routes สำหรับลูกค้าที่ล็อกอินแล้ว */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute role="customer">
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute role="customer">
            <OrderHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute role="customer">
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ── ฝั่งพนักงาน (ธีม Teal) ── */}
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route
        path="/staff"
        element={
          <ProtectedRoute role="staff">
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffDashboardPage />} />
        <Route path="dashboard" element={<StaffDashboardPage />} />
        <Route path="orders" element={<OrderManagePage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="products" element={<ProductManagePage />} />
        <Route path="products/new" element={<ProductManagePage />} />
        <Route path="products/:id" element={<ProductManagePage />} />
      </Route>

      {/* ── ฝั่งแอดมิน/ผู้บริหาร (ธีม Slate + ทอง) ── */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="sales-report" element={<SalesReportPage />} />
        <Route path="stock-report" element={<StockReportPage />} />
        <Route path="profit-report" element={<ProfitReportPage />} />
      </Route>


      {/* route อื่นที่ยังไม่มี → หน้าอยู่ระหว่างพัฒนา */}
      <Route path="*" element={<ComingSoon />} />
    </Routes>
  );
}

export default App;
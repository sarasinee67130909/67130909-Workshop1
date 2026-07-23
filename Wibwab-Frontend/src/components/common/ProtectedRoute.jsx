// components/common/ProtectedRoute.jsx — กันหน้าที่ต้องล็อกอิน + เช็ค role ก่อนเข้าถึง
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { useAdminAuth } from '../../context/AdminAuthContext';

// หน้า login ของแต่ละ role — ใช้ตอน redirect กรณียังไม่ได้ล็อกอิน
const LOGIN_PATH_BY_ROLE = {
  customer: '/login',
  staff: '/staff/login',
  admin: '/admin/login',
};

/**
 * ครอบ route ที่ต้องล็อกอินก่อนถึงจะเข้าได้
 * แต่ละ role (customer/staff/admin) อ่าน session จาก Context/localStorage key ของตัวเอง
 * (ดู context/CustomerAuthContext.jsx, StaffAuthContext.jsx, AdminAuthContext.jsx)
 * ทำให้ล็อกอินพร้อมกันได้ทั้ง 3 role ในเบราว์เซอร์เดียวกัน โดยไม่ทับ/เด้ง session กันเอง
 *
 * วิธีใช้:
 *   <ProtectedRoute role="staff"><StaffLayout /></ProtectedRoute>
 *
 * พฤติกรรม:
 *   - ยังไม่ล็อกอินใน portal นี้     → เด้งไปหน้า login ของ role นั้น พร้อมจำหน้าที่ตั้งใจจะเข้า (state.from)
 *   - ล็อกอินแล้วและ role ตรง       → แสดง children ตามปกติ
 */
export default function ProtectedRoute({ children, role }) {
  const location = useLocation();

  // เรียก hook ทั้ง 3 ตัวเสมอ (กติกาของ React Hooks) แล้วค่อยเลือกใช้อันที่ตรงกับ role ที่ต้องการ
  const customerAuth = useCustomerAuth();
  const staffAuth = useStaffAuth();
  const adminAuth = useAdminAuth();

  const AUTH_BY_ROLE = { customer: customerAuth, staff: staffAuth, admin: adminAuth };

  // รองรับทั้ง role เดี่ยว ('staff') และหลาย role (['staff', 'admin'])
  const allowedRoles = Array.isArray(role) ? role : [role];

  // มี role ไหนใน allowedRoles ที่ portal นั้นล็อกอินอยู่จริงบ้าง (เช็คตาม session ของ portal นั้นเอง)
  const matchedRole = allowedRoles.find((r) => AUTH_BY_ROLE[r]?.isLoggedIn && AUTH_BY_ROLE[r]?.user?.role === r);

  if (!matchedRole) {
    const primaryRole = allowedRoles[0];
    const loginPath = LOGIN_PATH_BY_ROLE[primaryRole] || '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return children;
}

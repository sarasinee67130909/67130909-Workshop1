import { Outlet } from 'react-router-dom';
import StaffSidebar from './StaffSidebar';
import StaffTopbar from './StaffTopbar';
import '../../styles/staff.css';

/**
 * Layout กลางของทุกหน้าใน Staff Portal (Sidebar + Topbar + เนื้อหา)
 *
 * วิธีใช้ใน App.jsx:
 *   <Route path="/staff" element={<ProtectedRoute role="staff"><StaffLayout /></ProtectedRoute>}>
 *     <Route path="dashboard" element={<StaffDashboardPage />} />
 *     <Route path="orders" element={<OrderManagePage />} />
 *     <Route path="inventory" element={<InventoryPage />} />
 *     <Route path="products" element={<ProductManagePage />} />
 *   </Route>
 *
 * หมายเหตุ: ต้องเพิ่ม Google Fonts link นี้ใน index.html เพื่อให้ไอคอนแสดงผล
 *   <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
 *   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
 */
export default function StaffLayout() {
  return (
    <div className="staff-app">
      <div className="staff-layout">
        <StaffSidebar />
        <div className="staff-main">
          <StaffTopbar />
          <main className="staff-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

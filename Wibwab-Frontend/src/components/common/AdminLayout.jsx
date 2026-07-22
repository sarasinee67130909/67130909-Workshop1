import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import '../../styles/admin.css';

/**
 * Layout กลางของทุกหน้าใน Executive Suite (Sidebar + Topbar + เนื้อหา)
 *
 * วิธีใช้ใน App.jsx:
 *   <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
 *     <Route path="dashboard" element={<AdminDashboardPage />} />
 *     <Route path="sales-report" element={<SalesReportPage />} />
 *     <Route path="stock-report" element={<StockReportPage />} />
 *     <Route path="profit-report" element={<ProfitReportPage />} />
 *   </Route>
 */
export default function AdminLayout() {
  return (
    <div className="admin-app">
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main">
          <AdminTopbar />
          <main className="admin-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

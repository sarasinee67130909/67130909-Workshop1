import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { getStaffDashboard } from '../../api/staff.api';
import { useEffect, useState } from 'react';

function formatCurrency(n) {
  return `฿${Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StaffDashboardPage() {
  const [kpis, setKpis] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getStaffDashboard()
      .then((res) => {
        if (!active || !res.success) return;
        const k = res.data.kpis;
        setKpis([
          { icon: 'payments', label: 'ยอดขายรวม', value: formatCurrency(k.total_sales) },
          { icon: 'pending_actions', label: 'คำสั่งซื้อรอดำเนินการ', value: String(k.pending_orders) },
          { icon: 'group_add', label: 'ลูกค้าใหม่ (30 วัน)', value: String(k.new_customers_30d) },
          {
            icon: 'warning',
            label: 'สินค้าหมดสต็อก',
            value: String(k.out_of_stock_variants),
            iconTone: k.out_of_stock_variants > 0 ? 'error' : 'primary',
          },
        ]);
        setRecentOrders(res.data.recentOrders);
        setTopProducts(res.data.topProducts);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'โหลดข้อมูลแดชบอร์ดไม่สำเร็จ');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <h1>แดชบอร์ด</h1>
          <p>ภาพรวมการดำเนินงานวันนี้</p>
        </div>
      </div>

      {error && <p className="staff-login__error">{error}</p>}

      <div className="staff-kpi-grid">
        {(loading ? Array.from({ length: 4 }) : kpis).map((kpi, i) => (
          <StatCard key={kpi?.label || i} {...(kpi || { icon: 'hourglass_empty', label: 'กำลังโหลด...', value: '—' })} />
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Orders */}
        <div className="staff-card">
          <div className="staff-card__header">
            <h3>คำสั่งซื้อล่าสุด</h3>
          </div>
          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>รหัสคำสั่งซื้อ</th>
                  <th>ลูกค้า</th>
                  <th>วันที่</th>
                  <th>ยอดรวม</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {!loading && recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--staff-text-muted)' }}>
                      ยังไม่มีคำสั่งซื้อ
                    </td>
                  </tr>
                )}
                {recentOrders.map((order) => (
                  <tr key={order.id} className="is-row">
                    <td className="mono">#ORD-{String(order.id).padStart(4, '0')}</td>
                    <td>{order.customer}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td className="mono">{formatCurrency(order.total_amount)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="staff-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="staff-card__header">
            <h3>สินค้าขายดี</h3>
          </div>
          <div className="staff-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {!loading && topProducts.length === 0 && (
              <p style={{ color: 'var(--staff-text-muted)', fontSize: 13 }}>ยังไม่มีข้อมูลยอดขาย</p>
            )}
            {topProducts.map((p) => (
              <div key={p.sku} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="staff-table__thumb-placeholder" style={{ width: 40, height: 40 }}>
                  <span className="material-symbols-outlined">diamond</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--staff-text-muted)' }}>
                    {p.category} • SKU: {p.sku}
                  </p>
                </div>
                <div className="mono" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>ขายแล้ว {p.sold}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* จัดเลย์เอาต์ 2 คอลัมน์ (แทน Tailwind grid-cols-12: 8/4) */}
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}

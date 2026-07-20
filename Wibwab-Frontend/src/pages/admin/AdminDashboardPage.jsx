import { useEffect, useState } from 'react';
import { getAdminDashboard, exportAdminDashboard } from '../../api/admin.api';
import ExportMenu from '../../components/common/ExportMenu';

function formatCurrency(n) {
  return `฿${Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
}

function formatPct(p) {
  if (p === null || p === undefined) return null;
  const tone = p > 0 ? 'up' : p < 0 ? 'down' : 'flat';
  return { text: `${p > 0 ? '+' : ''}${p}%`, tone };
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminDashboard(range)
      .then((res) => {
        if (!active || !res.success) return;
        setData(res.data);
        setError('');
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'โหลดข้อมูลแดชบอร์ดไม่สำเร็จ');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [range]);

  const k = data?.kpis;
  const revenueTrend = formatPct(k?.revenue_this_month_change_pct);
  const customersTrend = formatPct(k?.new_customers_change_pct);

  const kpis = k
    ? [
        { label: 'ยอดขายวันนี้', value: formatCurrency(k.sales_today) },
        { label: 'รายได้เดือนนี้', value: formatCurrency(k.revenue_this_month), trend: revenueTrend },
        { label: 'คำสั่งซื้อทั้งหมด', value: k.total_orders.toLocaleString('th-TH') },
        { label: 'ลูกค้าใหม่ (30 วัน)', value: k.new_customers_30d.toLocaleString('th-TH'), trend: customersTrend },
      ]
    : [];

  const dailySales = data?.dailySales || [];
  const maxDaily = Math.max(1, ...dailySales.map((d) => d.total));
  const topProducts = data?.topProducts || [];

  return (
    <div>
      <div className="admin-page-header">
        <h1>ภาพรวม</h1>
        <div className="admin-page-header__actions">
          <div className="admin-filters">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--admin-text-muted)' }}>
              calendar_today
            </span>
            <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
              {range === '7d' ? '7 วันล่าสุด' : '30 วันล่าสุด'}
            </span>
          </div>
          <ExportMenu onExport={(format) => exportAdminDashboard({ range, format })} label="ส่งออก" />
        </div>
      </div>

      {error && <p className="admin-login__error">{error}</p>}

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        {(loading ? Array.from({ length: 4 }) : kpis).map((kpi, i) => (
          <div className="admin-kpi-card" key={kpi?.label || i}>
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label" style={{ textTransform: 'none', letterSpacing: 0 }}>
                {kpi?.label || 'กำลังโหลด...'}
              </span>
              {kpi?.trend && (
                <span className={`admin-trend admin-trend--${kpi.trend.tone}`}>
                  {kpi.trend.tone === 'up' && <span className="material-symbols-outlined">arrow_upward</span>}
                  {kpi.trend.tone === 'down' && <span className="material-symbols-outlined">arrow_downward</span>}
                  {kpi.trend.tone === 'flat' && <span className="material-symbols-outlined">remove</span>}
                  {kpi.trend.text}
                </span>
              )}
            </div>
            <div className="admin-kpi-card__value">{kpi?.value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* ยอดขายรายวัน */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card__header">
          <h3>ยอดขายรายวัน</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setRange('7d')}
              className="admin-btn admin-btn--secondary"
              style={{
                height: 28,
                padding: '0 12px',
                fontSize: 12,
                ...(range === '7d' ? { borderColor: 'var(--admin-primary)', color: 'var(--admin-primary)' } : {}),
              }}
            >
              7 วัน
            </button>
            <button
              onClick={() => setRange('30d')}
              className="admin-btn admin-btn--secondary"
              style={{
                height: 28,
                padding: '0 12px',
                fontSize: 12,
                ...(range === '30d' ? { borderColor: 'var(--admin-primary)', color: 'var(--admin-primary)' } : {}),
              }}
            >
              30 วัน
            </button>
          </div>
        </div>
        <div className="admin-card__body">
          {!loading && dailySales.length === 0 ? (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>ยังไม่มีข้อมูลยอดขายในช่วงนี้</p>
          ) : (
            <div className="admin-chart-bars">
              {(loading ? Array.from({ length: 7 }) : dailySales).map((d, i) => (
                <div
                  key={d?.date || i}
                  className="admin-chart-bars__bar"
                  style={{ height: `${d ? Math.max(2, (d.total / maxDaily) * 100) : 4}%` }}
                  title={d ? `${d.date}: ${formatCurrency(d.total)}` : ''}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top selling products table */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3>สินค้าขายดี</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>หมวดหมู่</th>
                <th className="align-right">จำนวนที่ขาย</th>
                <th className="align-right">รายได้</th>
              </tr>
            </thead>
            <tbody>
              {!loading && topProducts.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    ยังไม่มีข้อมูลยอดขาย
                  </td>
                </tr>
              )}
              {topProducts.map((p) => (
                <tr key={p.product_id}>
                  <td>
                    <div className="admin-cell-thumb">
                      <div className="admin-cell-thumb-placeholder">
                        <span className="material-symbols-outlined">diamond</span>
                      </div>
                      <span className="admin-cell-primary">{p.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--admin-text-muted)' }}>{p.category}</td>
                  <td className="align-right">{p.sold}</td>
                  <td className="align-right">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
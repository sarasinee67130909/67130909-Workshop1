import { useEffect, useMemo, useState } from 'react';
import { getSalesReport, exportSalesReport } from '../../api/admin.api';
import { getStaffCategories } from '../../api/staff.api';
import ExportMenu from '../../components/common/ExportMenu';

function formatCurrency(n) {
  return `฿ ${Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// สร้างตัวเลือกเดือนย้อนหลัง 6 เดือน (รวมเดือนปัจจุบัน) พร้อมช่วง from/to ของแต่ละเดือน
function buildMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const from = toDateStr(new Date(Date.UTC(year, month, 1)));
    const isCurrentMonth = i === 0;
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const to = isCurrentMonth ? toDateStr(now) : toDateStr(lastDay);
    const label = d.toLocaleDateString('th-TH', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    options.push({ value: `${year}-${String(month + 1).padStart(2, '0')}`, label, from, to });
  }
  return options;
}

export default function SalesReportPage() {
  const monthOptions = useMemo(buildMonthOptions, []);
  const [monthValue, setMonthValue] = useState(monthOptions[0].value);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStaffCategories()
      .then((res) => res.success && setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const selected = monthOptions.find((m) => m.value === monthValue) || monthOptions[0];
    let active = true;
    setLoading(true);
    getSalesReport({ from: selected.from, to: selected.to, category: category || undefined })
      .then((res) => {
        if (!active || !res.success) return;
        setData(res.data);
        setError('');
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'โหลดรายงานยอดขายไม่สำเร็จ');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [monthValue, category, monthOptions]);

  const k = data?.kpis;
  const kpis = k
    ? [
        { label: 'รายได้รวม', value: formatCurrency(k.total_revenue) },
        { label: 'กำไรขั้นต้น', value: formatCurrency(k.gross_profit) },
        { label: 'มูลค่าเฉลี่ยต่อออเดอร์', value: formatCurrency(k.avg_order_value) },
        { label: 'จำนวนออเดอร์', value: k.order_count.toLocaleString('th-TH') },
      ]
    : [];

  const dailySales = data?.dailySales || [];
  const maxDaily = Math.max(1, ...dailySales.map((d) => d.total));
  const bestSellers = data?.bestSellersByCategory || [];

  return (
    <div>
      <div className="admin-page-header">
        <h1>รายงานยอดขาย</h1>
        <div className="admin-page-header__actions">
          <div className="admin-filters">
            <select className="admin-select" value={monthValue} onChange={(e) => setMonthValue(e.target.value)}>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select className="admin-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <ExportMenu
            onExport={(format) => {
              const selected = monthOptions.find((m) => m.value === monthValue) || monthOptions[0];
              return exportSalesReport({ from: selected.from, to: selected.to, category: category || undefined, format });
            }}
            label="ส่งออก"
          />
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
            </div>
            <div className="admin-kpi-card__value">{kpi?.value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card__header">
          <h3>ยอดขายรายวัน</h3>
          <div className="admin-card__legend">
            <span className="admin-card__legend-dot" />
            <span>รายได้ (฿)</span>
          </div>
        </div>
        <div className="admin-card__body">
          {!loading && dailySales.length === 0 ? (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>ยังไม่มีข้อมูลยอดขายในช่วงนี้</p>
          ) : (
            <>
              <div className="admin-chart-bars">
                {(loading ? Array.from({ length: 30 }) : dailySales).map((d, i) => (
                  <div
                    key={d?.date || i}
                    className={`admin-chart-bars__bar${i % 3 === 2 ? ' admin-chart-bars__bar--alt' : ''}`}
                    style={{ height: `${d ? Math.max(2, (d.total / maxDaily) * 100) : 4}%` }}
                    title={d ? `${d.date}: ${formatCurrency(d.total)}` : ''}
                  />
                ))}
              </div>
              <div className="admin-chart-x-labels">
                <span>{dailySales[0]?.date?.slice(-2)}</span>
                <span>{dailySales[Math.floor(dailySales.length * 0.25)]?.date?.slice(-2)}</span>
                <span>{dailySales[Math.floor(dailySales.length * 0.5)]?.date?.slice(-2)}</span>
                <span>{dailySales[Math.floor(dailySales.length * 0.75)]?.date?.slice(-2)}</span>
                <span>{dailySales[dailySales.length - 1]?.date?.slice(-2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Best sellers by category */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3>สินค้าขายดีตามหมวดหมู่</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>หมวดหมู่</th>
                <th className="align-right">จำนวนที่ขาย</th>
                <th className="align-right">รายได้ (฿)</th>
                <th className="align-right">กำไร (฿)</th>
              </tr>
            </thead>
            <tbody>
              {!loading && bestSellers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    ยังไม่มีข้อมูลยอดขายในช่วงนี้
                  </td>
                </tr>
              )}
              {bestSellers.map((row) => (
                <tr key={row.category_id}>
                  <td className="admin-cell-primary">{row.category}</td>
                  <td className="align-right">{row.sold}</td>
                  <td className="align-right">{formatCurrency(row.revenue)}</td>
                  <td className="align-right admin-cell-gold">{formatCurrency(row.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
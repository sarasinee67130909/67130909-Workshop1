import { useEffect, useMemo, useState } from 'react';
import { getProfitReport } from '../../api/admin.api';

const MONTH_LABELS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const CATEGORY_COLORS = ['#b08d57', '#1e293b', '#64748b', '#e2e8f0', '#94a3b8', '#0f766e'];

function formatCurrency(n) {
  return `฿ ${Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// แปลงจุดข้อมูล (ตัวเลขจริง) เป็น path points ของ SVG viewBox 0 0 1000 200 (แกน y กลับด้าน)
function toSvgPoints(values) {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? 1000 / (values.length - 1) : 0;
  return values
    .map((v, i) => `${Math.round(i * step)},${Math.round(200 - (Math.max(0, v) / max) * 180)}`)
    .join(' ');
}

function monthLabel(ym) {
  const [, m] = ym.split('-').map(Number);
  return MONTH_LABELS[m - 1];
}

function monthFullLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('th-TH', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function ProfitReportPage() {
  // ค่าเริ่มต้น: ปีปฏิทินปัจจุบัน (1 ม.ค. — วันนี้) ให้ครอบคลุมแนวโน้มรายเดือนทั้งปี
  const defaultRange = useMemo(() => {
    const now = new Date();
    return { from: `${now.getUTCFullYear()}-01-01`, to: toDateStr(now) };
  }, []);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProfitReport(defaultRange)
      .then((res) => {
        if (!active || !res.success) return;
        setData(res.data);
        setError('');
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'โหลดรายงานกำไรไม่สำเร็จ');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [defaultRange]);

  const k = data?.kpis;
  const kpis = k
    ? [
        { label: 'รายได้รวม', value: formatCurrency(k.total_revenue) },
        { label: 'ต้นทุนรวม', value: formatCurrency(k.total_cost) },
        {
          label: 'กำไรขั้นต้น',
          value: formatCurrency(k.gross_profit),
          gold: true,
          trend:
            k.gross_profit_change_pct !== null
              ? { text: `${k.gross_profit_change_pct > 0 ? '+' : ''}${k.gross_profit_change_pct}%`, tone: k.gross_profit_change_pct >= 0 ? 'up' : 'down' }
              : null,
        },
        { label: 'อัตรากำไรขั้นต้น', value: `${k.margin_pct}%` },
      ]
    : [];

  const monthlyTrend = data?.monthlyTrend || [];
  const points = toSvgPoints(monthlyTrend.map((m) => m.profit));
  const pointCoords = points ? points.split(' ').map((p) => p.split(',').map(Number)) : [];
  const monthlyBreakdown = [...monthlyTrend].reverse(); // ล่าสุดขึ้นก่อน
  const profitByCategory = data?.profitByCategory || [];

  return (
    <div>
      <div className="admin-page-header">
        <h1>รายงานกำไร</h1>
        <div className="admin-page-header__actions">
          <span className="admin-link-btn">
            {defaultRange.from} — {defaultRange.to}
          </span>
          <button className="admin-btn admin-btn--primary">
            <span className="material-symbols-outlined">download</span>
            ส่งออกเป็น Excel
          </button>
        </div>
      </div>

      {error && <p className="admin-login__error">{error}</p>}

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        {(loading ? Array.from({ length: 4 }) : kpis).map((kpi, i) => (
          <div className="admin-kpi-card" key={kpi?.label || i}>
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label">{kpi?.label || 'กำลังโหลด...'}</span>
              {kpi?.trend && (
                <span className={`admin-trend admin-trend--${kpi.trend.tone}`}>
                  <span className="material-symbols-outlined">
                    {kpi.trend.tone === 'up' ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  {kpi.trend.text}
                </span>
              )}
            </div>
            <div className={`admin-kpi-card__value${kpi?.gold ? '' : ' admin-kpi-card__value--slate'}`}>
              {kpi?.value ?? '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card__header">
          <h3>แนวโน้มกำไรรายเดือน</h3>
          <div className="admin-card__legend">
            <span className="admin-card__legend-dot" />
            <span>กำไร (บาท)</span>
          </div>
        </div>
        <div className="admin-card__body">
          <div style={{ width: '100%', height: 240, position: 'relative' }}>
            <svg viewBox="0 0 1000 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {points && (
                <polyline
                  points={points}
                  fill="none"
                  stroke="var(--admin-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {pointCoords.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="var(--admin-gold)" />
              ))}
            </svg>
            <div
              style={{
                position: 'absolute',
                bottom: -24,
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--admin-text-muted)',
              }}
            >
              {monthlyTrend.map((m) => (
                <span key={m.month}>{monthLabel(m.month)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: monthly breakdown + profit by category */}
      <div className="admin-profit-bottom-grid">
        <div className="admin-card admin-profit-bottom-grid__table">
          <div className="admin-card__header">
            <h3>สรุปรายเดือน</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>เดือน</th>
                  <th className="align-right">รายได้</th>
                  <th className="align-right">ต้นทุน</th>
                  <th className="align-right">กำไร</th>
                  <th className="align-right">อัตรากำไร</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((row) => (
                  <tr key={row.month}>
                    <td className="admin-cell-primary">{monthFullLabel(row.month)}</td>
                    <td className="align-right">{formatCurrency(row.revenue)}</td>
                    <td className="align-right">{formatCurrency(row.cost)}</td>
                    <td className="align-right admin-cell-gold">{formatCurrency(row.profit)}</td>
                    <td className="align-right">{row.margin_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header">
            <h3>กำไรตามหมวดหมู่</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table" style={{ minWidth: 'auto' }}>
              <thead>
                <tr>
                  <th>หมวดหมู่</th>
                  <th className="align-right">กำไร</th>
                </tr>
              </thead>
              <tbody>
                {!loading && profitByCategory.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                      ยังไม่มีข้อมูล
                    </td>
                  </tr>
                )}
                {profitByCategory.map((row, i) => (
                  <tr key={row.category_id}>
                    <td>
                      <span className="admin-dot" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      {row.category}
                    </td>
                    <td className="align-right" style={{ fontWeight: 500 }}>
                      {formatCurrency(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .admin-profit-bottom-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .admin-profit-bottom-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStockReport, exportStockReport } from '../../api/admin.api';
import { updateVariantStock } from '../../api/staff.api';
import ExportMenu from '../../components/common/ExportMenu';

function formatCurrency(n) {
  return `฿ ${Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
}

export default function StockReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restockingId, setRestockingId] = useState(null);
  const [highlightVariantId, setHighlightVariantId] = useState(location.state?.highlightVariantId ?? null);
  const [exportPeriod, setExportPeriod] = useState('daily');

  const load = useCallback(() => {
    setLoading(true);
    return getStockReport()
      .then((res) => {
        if (!res.success) return;
        setData(res.data);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'โหลดรายงานสต็อกไม่สำเร็จ');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // มาจากคลิกแจ้งเตือนสต็อกใกล้หมด (AdminTopbar ส่ง state.highlightVariantId มาทาง navigate) — เลื่อนไปแถวนั้นให้
  useEffect(() => {
    if (!highlightVariantId || !data) return;
    const row = document.getElementById(`variant-row-${highlightVariantId}`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function handleRestock(item) {
    const input = window.prompt(`เติมสต็อกสินค้า "${item.name}" (${item.sku}) กี่ชิ้น?`, '10');
    if (input === null) return;
    const qty = Number(input);
    if (!Number.isInteger(qty) || qty <= 0) {
      window.alert('กรุณากรอกจำนวนเต็มบวก');
      return;
    }
    setRestockingId(item.variant_id);
    try {
      await updateVariantStock(item.variant_id, { delta: qty });
      await load();
    } catch (err) {
      window.alert(err.response?.data?.message || 'เติมสต็อกไม่สำเร็จ');
    } finally {
      setRestockingId(null);
    }
  }

  const k = data?.kpis;
  const kpis = k
    ? [
        { label: 'SKU ทั้งหมด', value: k.total_skus.toLocaleString('th-TH'), icon: 'category', tone: 'slate' },
        { label: 'มีสต็อก', value: k.in_stock.toLocaleString('th-TH'), icon: 'check_circle', tone: 'slate' },
        { label: 'สต็อกต่ำ', value: k.low_stock.toLocaleString('th-TH'), icon: 'warning', tone: 'warning' },
        { label: 'หมดสต็อก', value: k.out_of_stock.toLocaleString('th-TH'), icon: 'error', tone: 'danger' },
      ]
    : [];

  const lowStockItems = data?.lowStockItems || [];
  const slowMoving = data?.slowMoving || [];

  return (
    <div>
      <div className="admin-page-header">
        <h1>รายงานสต็อก</h1>
        <div className="admin-page-header__actions">
          <select
            className="admin-select"
            value={exportPeriod}
            onChange={(e) => setExportPeriod(e.target.value)}
            aria-label="ช่วงเวลาที่จะส่งออก"
          >
            <option value="daily">ส่งออกรายวัน</option>
            <option value="weekly">ส่งออกรายสัปดาห์</option>
          </select>
          <ExportMenu onExport={(format) => exportStockReport({ period: exportPeriod, format })} label="ส่งออก" />
        </div>
      </div>

      {error && <p className="admin-login__error">{error}</p>}

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        {(loading ? Array.from({ length: 4 }) : kpis).map((kpi, i) => (
          <div className="admin-kpi-card" key={kpi?.label || i}>
            <div className="admin-kpi-card__top" style={{ marginBottom: 4 }}>
              <span className="admin-kpi-card__label" style={{ textTransform: 'none', letterSpacing: 0 }}>
                {kpi?.label || 'กำลังโหลด...'}
              </span>
              {kpi && (
                <span
                  className="material-symbols-outlined admin-kpi-card__icon"
                  style={
                    kpi.tone === 'warning'
                      ? { color: 'var(--admin-warning-text)' }
                      : kpi.tone === 'danger'
                      ? { color: 'var(--admin-error-text)' }
                      : undefined
                  }
                >
                  {kpi.icon}
                </span>
              )}
            </div>
            <div
              className={`admin-kpi-card__value admin-kpi-card__value--${
                kpi?.tone === 'warning' ? 'warning' : kpi?.tone === 'danger' ? 'danger' : 'slate'
              }`}
            >
              {kpi?.value ?? '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Low stock table */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card__header">
          <h3>สินค้าใกล้หมดสต็อก</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>SKU</th>
                <th>ตัวเลือก</th>
                <th className="align-right">คงเหลือ</th>
                <th className="align-right">เกณฑ์แจ้งเตือน</th>
                <th className="align-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {!loading && lowStockItems.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    ไม่มีสินค้าใกล้หมดสต็อกในขณะนี้
                  </td>
                </tr>
              )}
              {lowStockItems.map((item) => (
                <tr
                  key={item.variant_id}
                  id={`variant-row-${item.variant_id}`}
                  style={
                    highlightVariantId === item.variant_id
                      ? { backgroundColor: 'var(--admin-gold-soft)' }
                      : undefined
                  }
                >
                  <td>
                    <div className="admin-cell-thumb">
                      <div className="admin-cell-thumb-placeholder">
                        <span className="material-symbols-outlined">diamond</span>
                      </div>
                      <span className="admin-cell-primary">{item.name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ color: 'var(--admin-text-muted)' }}>{item.sku}</td>
                  <td style={{ color: 'var(--admin-text-muted)' }}>{item.variant_label || '-'}</td>
                  <td className="align-right" style={{ fontWeight: 500, color: 'var(--admin-warning-text)' }}>
                    {item.stock_qty}
                  </td>
                  <td className="align-right" style={{ color: 'var(--admin-text-muted)' }}>
                    {item.low_stock_threshold}
                  </td>
                  <td className="align-right">
                    <button
                      className="admin-btn admin-btn--secondary"
                      style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                      disabled={restockingId === item.variant_id}
                      onClick={() => handleRestock(item)}
                    >
                      {restockingId === item.variant_id ? 'กำลังเติม...' : 'เติมสต็อก'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slow moving table */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3>สินค้าที่ขายช้า</h3>
          <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>ไม่มีการขายมากกว่า 90 วัน</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>หมวดหมู่</th>
                <th className="align-right">มูลค่ารวม</th>
                <th className="align-right">จำนวนวันในสต็อก</th>
              </tr>
            </thead>
            <tbody>
              {!loading && slowMoving.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    ไม่มีสินค้าที่ขายช้าในขณะนี้
                  </td>
                </tr>
              )}
              {slowMoving.map((item) => (
                <tr key={item.product_id}>
                  <td className="admin-cell-primary">{item.name}</td>
                  <td style={{ color: 'var(--admin-text-muted)' }}>{item.category}</td>
                  <td className="align-right" style={{ color: 'var(--admin-text-muted)' }}>
                    {formatCurrency(item.stock_value)}
                  </td>
                  <td className="align-right" style={{ color: 'var(--admin-text-muted)' }}>
                    {item.days_in_stock} วัน
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
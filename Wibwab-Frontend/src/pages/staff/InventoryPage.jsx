import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import Pagination from '../../components/dashboard/Pagination';
import { getInventory, updateVariantStock } from '../../api/staff.api';

function formatCurrency(n) {
  return `฿${Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function stockTone(stock, threshold) {
  if (stock === 0) return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#dc2626' };
  if (stock <= threshold) return { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', dot: '#ea580c' };
  return null;
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, pageSize: 20 });
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingSaves, setPendingSaves] = useState({}); // variantId -> boolean

  function load() {
    setLoading(true);
    getInventory({ search: search || undefined, lowStockOnly, page })
      .then((res) => {
        if (!res.success) return;
        setCollections(res.data.collections);
        setKpis(res.data.kpis);
        setMeta({ total: res.data.total, totalPages: res.data.totalPages, pageSize: res.data.pageSize });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly, page]);

  async function adjustStock(collectionIdx, variantIdx, delta) {
    const variant = collections[collectionIdx].variants[variantIdx];
    if (variant.stock + delta < 0) return;

    // อัปเดตหน้าจอทันที (optimistic) แล้วค่อยยืนยันกับ backend
    setCollections((prev) => {
      const next = structuredClone(prev);
      next[collectionIdx].variants[variantIdx].stock += delta;
      return next;
    });
    setPendingSaves((p) => ({ ...p, [variant.id]: true }));
    try {
      await updateVariantStock(variant.id, { delta });
    } catch (err) {
      // ผิดพลาด → ย้อนค่ากลับ
      setCollections((prev) => {
        const next = structuredClone(prev);
        next[collectionIdx].variants[variantIdx].stock -= delta;
        return next;
      });
      alert(err.response?.data?.message || 'ปรับสต็อกไม่สำเร็จ');
    } finally {
      setPendingSaves((p) => ({ ...p, [variant.id]: false }));
    }
  }

  const kpiCards = kpis
    ? [
        { icon: 'inventory_2', label: 'จำนวน SKU ทั้งหมด', value: String(kpis.total_skus) },
        {
          icon: 'warning', label: 'แจ้งเตือนสต็อกต่ำ', value: String(kpis.low_stock_alerts),
          iconTone: kpis.low_stock_alerts > 0 ? 'error' : 'primary',
        },
        { icon: 'payments', label: 'มูลค่าสต็อกรวม', value: formatCurrency(kpis.total_stock_value), iconTone: 'accent' },
        { icon: 'local_shipping', label: 'สินค้าหมดสต็อก', value: String(kpis.out_of_stock) },
      ]
    : [];

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <h2>จัดการคลังสินค้า</h2>
          <p>จัดการตัวเลือกสินค้า ติดตามระดับสต็อก และอัปเดตข้อมูลอย่างรวดเร็ว</p>
        </div>
        <div className="staff-page-header__actions">
          <button
            className={`staff-btn ${lowStockOnly ? 'staff-btn--primary' : 'staff-btn--secondary'}`}
            onClick={() => {
              setPage(1);
              setLowStockOnly((v) => !v);
            }}
          >
            <span className="material-symbols-outlined">filter_list</span>
            เฉพาะสต็อกต่ำ
          </button>
          <button className="staff-btn staff-btn--primary" onClick={() => navigate('/staff/products/new')}>
            <span className="material-symbols-outlined">add</span>
            เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      <div className="staff-kpi-grid">
        {kpiCards.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="staff-card">
        <div className="staff-card__header">
          <h3 style={{ fontWeight: 400 }}>ภาพรวมสต็อกตามตัวเลือกสินค้า</h3>
          <div className="staff-input" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า / SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  load();
                }
              }}
              style={{ border: 'none', outline: 'none', width: 180 }}
            />
          </div>
        </div>

        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th>ชื่อสินค้า</th>
                <th>รหัส SKU</th>
                <th>สี</th>
                <th>ไซซ์</th>
                <th className="align-right">ราคา</th>
                <th className="align-right">สต็อก</th>
                <th className="align-center">แก้ไขด่วน</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--staff-text-muted)' }}>กำลังโหลด...</td></tr>
              )}
              {!loading && collections.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--staff-text-muted)' }}>ไม่พบตัวเลือกสินค้า</td></tr>
              )}
              {collections.map((collection, cIdx) => (
                <>
                  <tr key={collection.product_id} className="staff-table__group-row">
                    <td colSpan={7}>
                      คอลเลกชัน: {collection.name}{' '}
                      <button
                        className="staff-card__link"
                        style={{ marginLeft: 8 }}
                        onClick={() => navigate(`/staff/products/${collection.product_id}`)}
                      >
                        แก้ไขสินค้า
                      </button>
                    </td>
                  </tr>
                  {collection.variants.map((variant, vIdx) => {
                    const tone = stockTone(variant.stock, variant.low_stock_threshold);
                    return (
                      <tr key={variant.id} className="is-row">
                        <td>
                          <div className="staff-table__thumb">
                            <div className="staff-table__thumb-placeholder">
                              <span className="material-symbols-outlined">{variant.hasImage ? 'diamond' : 'image'}</span>
                            </div>
                            <span style={{ fontWeight: 600 }}>{variant.name}</span>
                          </div>
                        </td>
                        <td className="mono">{variant.sku}</td>
                        <td>{variant.color || '-'}</td>
                        <td>{variant.size || '-'}</td>
                        <td className="mono align-right">{formatCurrency(variant.price)}</td>
                        <td className="align-right">
                          {tone ? (
                            <span
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '4px 8px', borderRadius: 9999,
                                backgroundColor: tone.bg, border: `1px solid ${tone.border}`,
                              }}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tone.dot }} />
                              <span className="mono" style={{ color: tone.text, fontWeight: 600 }}>{variant.stock}</span>
                            </span>
                          ) : (
                            <span className="mono">{variant.stock}</span>
                          )}
                        </td>
                        <td>
                          <div className={`staff-stepper${variant.stock === 0 ? ' staff-stepper--disabled' : ''}`}>
                            <button
                              onClick={() => adjustStock(cIdx, vIdx, -1)}
                              aria-label="ลดสต็อก"
                              disabled={pendingSaves[variant.id]}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
                            </button>
                            <input type="text" value={variant.stock} readOnly />
                            <button
                              onClick={() => adjustStock(cIdx, vIdx, 1)}
                              aria-label="เพิ่มสต็อก"
                              disabled={pendingSaves[variant.id]}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          pageSize={meta.pageSize}
          onPageChange={setPage}
          itemLabel="SKU"
        />
      </div>
    </div>
  );
}

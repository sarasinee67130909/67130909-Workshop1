import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import Pagination from '../../components/dashboard/Pagination';
import { getStaffPromos, pushPromo } from '../../api/staff.api';

function formatDiscount(promo) {
  return promo.discount_type === 'percent' ? `${promo.discount_value}%` : `฿${promo.discount_value.toLocaleString('th-TH')}`;
}

function promoStatus(promo) {
  if (!promo.is_active) return { label: 'ปิดใช้งาน', variant: 'neutral' };
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { label: 'หมดอายุ', variant: 'error' };
  return { label: 'ใช้งานอยู่', variant: 'success' };
}

/**
 * หน้ารายการโค้ดส่วนลด (Coupon/Promo Management)
 * โค้ดที่ตั้ง push_trigger เป็น "แจกตอนสมัครสมาชิก" จะแจกอัตโนมัติ ไม่ต้องกด Push
 * ส่วนโค้ดแบบ "กด Push เอง" staff ต้องกดปุ่ม Push ในตารางเพื่อยัดเข้ากระเป๋าลูกค้าทุกคน
 */
export default function PromoManagePage() {
  const navigate = useNavigate();
  const [promos, setPromos] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pushingId, setPushingId] = useState(null);

  function load() {
    setLoading(true);
    getStaffPromos({ search: search || undefined, page })
      .then((res) => {
        if (!res.success) return;
        setPromos(res.data.items);
        setMeta({ total: res.data.total, totalPages: res.data.totalPages, pageSize: res.data.pageSize });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handlePush(promo) {
    if (!window.confirm(`ยืนยันส่งโค้ด "${promo.code}" เข้ากระเป๋าลูกค้าทุกคนที่ยังไม่มีโค้ดนี้?`)) return;
    setPushingId(promo.id);
    try {
      const res = await pushPromo(promo.id);
      alert(`ส่งสำเร็จ ${res.data.pushed_count} คน`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Push ไม่สำเร็จ');
    } finally {
      setPushingId(null);
    }
  }

  const kpiCards = [
    { icon: 'local_offer', label: 'โค้ดทั้งหมด', value: String(meta.total) },
    { icon: 'redeem', label: 'ใช้งานอยู่หน้านี้', value: String(promos.filter((p) => promoStatus(p).label === 'ใช้งานอยู่').length) },
  ];

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <h2>โปรโมชั่น &amp; คูปอง</h2>
          <p>สร้างโค้ดส่วนลด แจกอัตโนมัติตอนสมัครสมาชิก หรือ Push เข้ากระเป๋าลูกค้าทั้งหมด</p>
        </div>
        <div className="staff-page-header__actions">
          <button className="staff-btn staff-btn--primary" onClick={() => navigate('/staff/promos/new')}>
            <span className="material-symbols-outlined">add</span>
            สร้างโค้ดใหม่
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
          <h3 style={{ fontWeight: 400 }}>รายการโค้ดส่วนลด</h3>
          <div className="staff-input" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="ค้นหาโค้ด / ชื่อ"
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
                <th>โค้ด</th>
                <th>ชื่อที่แสดง</th>
                <th>ส่วนลด</th>
                <th>รูปแบบแจก</th>
                <th className="align-right">ในกระเป๋า / ใช้แล้ว</th>
                <th>สถานะ</th>
                <th className="align-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--staff-text-muted)' }}>กำลังโหลด...</td></tr>
              )}
              {!loading && promos.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--staff-text-muted)' }}>ยังไม่มีโค้ดส่วนลด</td></tr>
              )}
              {promos.map((promo) => {
                const status = promoStatus(promo);
                return (
                  <tr key={promo.id} className="is-row">
                    <td className="mono" style={{ fontWeight: 600 }}>{promo.code}</td>
                    <td>{promo.label || '-'}</td>
                    <td className="mono">{formatDiscount(promo)}</td>
                    <td>
                      <StatusBadge
                        label={promo.push_trigger === 'on_register' ? 'แจกตอนสมัครสมาชิก' : 'กด Push เอง'}
                        variant={promo.push_trigger === 'on_register' ? 'info' : 'neutral'}
                      />
                    </td>
                    <td className="mono align-right">{promo.wallet_count} / {promo.wallet_used_count}</td>
                    <td><StatusBadge label={status.label} variant={status.variant} /></td>
                    <td className="align-center">
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button className="staff-card__link" onClick={() => navigate(`/staff/promos/${promo.id}`)}>
                          แก้ไข
                        </button>
                        {promo.push_trigger === 'manual' && (
                          <button
                            className="staff-card__link"
                            disabled={pushingId === promo.id}
                            onClick={() => handlePush(promo)}
                          >
                            {pushingId === promo.id ? 'กำลังส่ง...' : 'Push ให้ทุกคน'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          pageSize={meta.pageSize}
          onPageChange={setPage}
          itemLabel="โค้ด"
        />
      </div>
    </div>
  );
}

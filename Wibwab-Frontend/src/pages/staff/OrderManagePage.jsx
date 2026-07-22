import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/dashboard/StatusBadge';
import Pagination from '../../components/dashboard/Pagination';
import Modal from '../../components/common/Modal';
import {
  getStaffOrders,
  getStaffOrderDetail,
  verifyOrderPayment,
  updateOrderStatus,
  cancelStaffOrder,
} from '../../api/staff.api';

const STATUS_OPTIONS = [
  { value: '', label: 'สถานะทั้งหมด' },
  { value: 'pending_payment', label: 'รอชำระเงิน' },
  { value: 'paid', label: 'ชำระแล้ว' },
  { value: 'preparing', label: 'กำลังเตรียมสินค้า' },
  { value: 'shipped', label: 'จัดส่งแล้ว' },
  { value: 'delivered', label: 'สำเร็จ' },
  { value: 'cancelled', label: 'ยกเลิก' },
];

const NEXT_STATUS = { paid: 'preparing', preparing: 'shipped', shipped: 'delivered' };
const NEXT_LABEL = {
  preparing: 'เริ่มเตรียมสินค้า',
  shipped: 'ทำเครื่องหมายว่าจัดส่งแล้ว',
  delivered: 'ทำเครื่องหมายว่าสำเร็จ',
};

function formatCurrency(n) {
  return `฿${Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}
function initialsOf(name) {
  return (name || '').trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function OrderManagePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);

  // overrides ใช้ตอนอยากยิง request ทันทีด้วยค่าใหม่ โดยไม่รอ state อัปเดตก่อน (เช่น คลิกตัวเลือกที่แนะนำ)
  function loadOrders(overrides = {}) {
    const searchTerm = overrides.search !== undefined ? overrides.search : search;
    const pageNum = overrides.page !== undefined ? overrides.page : page;
    setLoading(true);
    getStaffOrders({ status: statusFilter || undefined, search: searchTerm || undefined, page: pageNum })
      .then((res) => {
        if (!res.success) return;
        setOrders(res.data.items);
        setMeta({ total: res.data.total, totalPages: res.data.totalPages, pageSize: res.data.pageSize });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  // แนะนำชื่อลูกค้าที่ใกล้เคียงระหว่างพิมพ์ (debounce กันยิง request ทุกตัวอักษร)
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      getStaffOrders({ search: search.trim(), page: 1 }).then((res) => {
        if (!res.success) return;
        const names = [...new Set(res.data.items.map((o) => o.customer).filter(Boolean))];
        setSuggestions(names.slice(0, 6));
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!showSuggestions) return;
    function handleClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  function selectSuggestion(name) {
    setSearch(name);
    setShowSuggestions(false);
    setPage(1);
    loadOrders({ search: name, page: 1 });
  }

  // มาจากคลิกแจ้งเตือนที่กระดิ่ง (StaffTopbar ส่ง state.openOrderId มาทาง navigate) — เปิดออเดอร์นั้นให้ทันที
  useEffect(() => {
    if (location.state?.openOrderId) {
      openOrder(location.state.openOrderId);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  function openOrder(orderId) {
    setActionError('');
    setTracking('');
    setDetailLoading(true);
    setSelectedOrder({ id: orderId });
    getStaffOrderDetail(orderId)
      .then((res) => res.success && setSelectedOrder(res.data))
      .catch((err) => setActionError(err.response?.data?.message || 'โหลดรายละเอียดไม่สำเร็จ'))
      .finally(() => setDetailLoading(false));
  }

  async function handleVerifyPayment() {
    if (!selectedOrder) return;
    setBusy(true);
    setActionError('');
    try {
      await verifyOrderPayment(selectedOrder.id);
      await openOrder(selectedOrder.id);
      loadOrders();
    } catch (err) {
      setActionError(err.response?.data?.message || 'ยืนยันการชำระเงินไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  async function handleAdvanceStatus() {
    if (!selectedOrder) return;
    const nextStatus = NEXT_STATUS[selectedOrder.status];
    if (!nextStatus) return;
    if (nextStatus === 'shipped' && !tracking.trim()) {
      setActionError('กรุณากรอกเลขพัสดุก่อนเปลี่ยนเป็นสถานะจัดส่งแล้ว');
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      await updateOrderStatus(selectedOrder.id, nextStatus, tracking.trim() || undefined);
      openOrder(selectedOrder.id);
      loadOrders();
    } catch (err) {
      setActionError(err.response?.data?.message || 'อัปเดตสถานะไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!selectedOrder) return;
    if (!window.confirm('ยืนยันยกเลิกคำสั่งซื้อนี้? สต็อกจะถูกคืนทั้งหมด')) return;
    setBusy(true);
    setActionError('');
    try {
      await cancelStaffOrder(selectedOrder.id);
      openOrder(selectedOrder.id);
      loadOrders();
    } catch (err) {
      setActionError(err.response?.data?.message || 'ยกเลิกคำสั่งซื้อไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <h1 style={{ fontSize: 24 }}>คำสั่งซื้อ</h1>
          <p>จัดการและติดตามคำสั่งซื้อเครื่องประดับของลูกค้า</p>
        </div>
      </div>

      {/* Filters */}
      <div className="staff-filters">
        <div className="staff-filters__row">
          <select
            className="staff-select"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="staff-input staff-search" ref={searchBoxRef} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า / รหัสคำสั่งซื้อ"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSuggestions(false);
                  setPage(1);
                  loadOrders({ page: 1 });
                }
              }}
              style={{ border: 'none', outline: 'none', width: 220 }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="staff-search__suggestions">
                {suggestions.map((name) => (
                  <li key={name}>
                    <button type="button" onMouseDown={() => selectSuggestion(name)}>
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="staff-card">
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th>รหัสคำสั่งซื้อ</th>
                <th>วันที่</th>
                <th>ลูกค้า</th>
                <th>สถานะ</th>
                <th className="align-right">ยอดรวม</th>
                <th className="align-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--staff-text-muted)' }}>กำลังโหลด...</td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--staff-text-muted)' }}>ไม่พบคำสั่งซื้อ</td>
                </tr>
              )}
              {orders.map((order) => (
                <tr key={order.id} className="is-row">
                  <td className="mono" style={{ color: 'var(--staff-primary)', fontWeight: 600 }}>
                    #ORD-{String(order.id).padStart(4, '0')}
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          backgroundColor: 'var(--staff-surface-low)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: 11,
                          color: 'var(--staff-text-muted)',
                        }}
                      >
                        {initialsOf(order.customer)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{order.customer}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="mono align-right" style={{ fontWeight: 600 }}>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="align-right">
                    <div className="staff-table__actions">
                      <button className="staff-icon-btn" title="ดูรายละเอียด" onClick={() => openOrder(order.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
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
        />
      </div>

      {selectedOrder && (
        <Modal onClose={() => setSelectedOrder(null)}>
          {detailLoading ? (
            <p>กำลังโหลด...</p>
          ) : (
            <div style={{ minWidth: 320, maxWidth: 480 }}>
              <h3 style={{ marginTop: 0 }}>คำสั่งซื้อ #ORD-{String(selectedOrder.id).padStart(4, '0')}</h3>
              <p>
                ลูกค้า: <strong>{selectedOrder.customer}</strong> ({selectedOrder.customer_email})
              </p>
              <p>สถานะปัจจุบัน: <StatusBadge status={selectedOrder.status} /></p>
              <p>ที่อยู่จัดส่ง: {selectedOrder.shipping_address}, {selectedOrder.shipping_postal_code}</p>
              {selectedOrder.gift_wrap && <p>🎁 ห่อของขวัญ{selectedOrder.gift_message ? `: ${selectedOrder.gift_message}` : ''}</p>}
              {selectedOrder.tracking_number && <p>เลขพัสดุ: <span className="mono">{selectedOrder.tracking_number}</span></p>}
              {selectedOrder.slip_image && (
                <p>
                  สลิปโอนเงิน: <a href={selectedOrder.slip_image} target="_blank" rel="noreferrer">ดูสลิป</a>
                </p>
              )}

              {Array.isArray(selectedOrder.items) && (
                <table className="staff-table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr><th>สินค้า</th><th className="align-right">จำนวน</th><th className="align-right">ราคา</th></tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.name} {it.variant_label && <span style={{ color: 'var(--staff-text-muted)' }}>({it.variant_label})</span>}</td>
                        <td className="align-right">{it.qty}</td>
                        <td className="align-right mono">{formatCurrency(it.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <p style={{ fontWeight: 700, marginTop: 12 }}>ยอดรวม: {formatCurrency(selectedOrder.total_amount)}</p>

              {actionError && <p className="staff-login__error">{actionError}</p>}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {selectedOrder.status === 'pending_payment' && (
                  <button
                    className="staff-btn staff-btn--primary"
                    disabled={busy || !selectedOrder.slip_image}
                    onClick={handleVerifyPayment}
                    title={!selectedOrder.slip_image ? 'ลูกค้ายังไม่แนบสลิป' : ''}
                  >
                    ยืนยันการชำระเงิน
                  </button>
                )}

                {NEXT_STATUS[selectedOrder.status] && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {NEXT_STATUS[selectedOrder.status] === 'shipped' && (
                      <input
                        type="text"
                        className="staff-form-control"
                        placeholder="เลขพัสดุ"
                        value={tracking}
                        onChange={(e) => setTracking(e.target.value)}
                        style={{ width: 160 }}
                      />
                    )}
                    <button className="staff-btn staff-btn--primary" disabled={busy} onClick={handleAdvanceStatus}>
                      {NEXT_LABEL[NEXT_STATUS[selectedOrder.status]]}
                    </button>
                  </div>
                )}

                {['pending_payment', 'paid', 'preparing'].includes(selectedOrder.status) && (
                  <button className="staff-btn staff-btn--secondary" disabled={busy} onClick={handleCancel}>
                    ยกเลิกคำสั่งซื้อ
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

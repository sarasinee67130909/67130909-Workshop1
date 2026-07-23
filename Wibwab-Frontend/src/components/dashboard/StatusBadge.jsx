/**
 * ป้ายสถานะรูปแคปซูล ใช้กับสถานะออเดอร์ / การชำระเงิน / สต็อก
 *
 * ใช้แบบกำหนด variant เอง:
 *   <StatusBadge label="Paid" variant="success" />
 *
 * หรือส่ง status ตามสถานะออเดอร์จริงของระบบ (pending_payment, paid, preparing,
 * shipped, delivered, cancelled) แล้วให้ component เลือกสีให้อัตโนมัติ:
 *   <StatusBadge status="shipped" />
 */
const STATUS_MAP = {
  // สถานะออเดอร์ (ต้องตรงกับ utils/orderStatus.js ฝั่ง backend)
  pending_payment: { label: 'รอชำระเงิน', variant: 'warning' },
  paid: { label: 'ชำระแล้ว', variant: 'success' },
  preparing: { label: 'กำลังเตรียมสินค้า', variant: 'info' },
  shipped: { label: 'จัดส่งแล้ว', variant: 'info' },
  delivered: { label: 'สำเร็จ', variant: 'success' },
  cancelled: { label: 'ยกเลิก', variant: 'error' },

  // สถานะทั่วไปที่ใช้ในดีไซน์ต้นฉบับ
  processing: { label: 'กำลังดำเนินการ', variant: 'info' },
  refunded: { label: 'คืนเงินแล้ว', variant: 'error' },
  pending: { label: 'รอดำเนินการ', variant: 'warning' },
  unfulfilled: { label: 'ยังไม่จัดส่ง', variant: 'neutral' },
};

export default function StatusBadge({ status, label, variant }) {
  const mapped = status ? STATUS_MAP[status] : null;
  const finalVariant = variant || mapped?.variant || 'neutral';
  const finalLabel = label || mapped?.label || status || '-';

  return <span className={`staff-badge staff-badge--${finalVariant}`}>{finalLabel}</span>;
}

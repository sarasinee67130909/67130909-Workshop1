/**
 * การ์ดสรุปตัวเลข (KPI) ใช้ในหน้า Dashboard / Inventory
 *
 * props:
 *   icon      - ชื่อ Material Symbol เช่น "payments"
 *   iconTone  - 'primary' | 'error' | 'accent' (สีพื้นหลังไอคอน)
 *   label     - ป้ายชื่อ เช่น "Total Revenue"
 *   value     - ค่าหลัก เช่น "$45,200.00"
 *   trend     - ข้อความ badge มุมขวาบน เช่น "+12%" (optional)
 *   note      - ข้อความเสริมด้านล่าง เช่น "+3 since yesterday" (optional)
 *   noteTone  - 'up' | 'default'
 */
export default function StatCard({
  icon,
  iconTone = 'primary',
  label,
  value,
  trend,
  note,
  noteTone = 'default',
}) {
  return (
    <div className="staff-kpi-card">
      <div className="staff-kpi-card__top">
        <div className={`staff-kpi-card__icon staff-kpi-card__icon--${iconTone}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend && <span className="staff-kpi-card__trend">{trend}</span>}
      </div>
      <div>
        <p className="staff-kpi-card__label">{label}</p>
        <p className="staff-kpi-card__value">{value}</p>
        {note && (
          <p className={`staff-kpi-card__note${noteTone === 'up' ? ' staff-kpi-card__note--up' : ''}`}>
            {noteTone === 'up' && <span className="material-symbols-outlined">arrow_upward</span>}
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

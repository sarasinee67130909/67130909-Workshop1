import { useState } from 'react';
// TODO: ต่อกับ AuthContext จริง เพื่อดึงชื่อ/รูป staff ที่ login อยู่ และทำปุ่ม Sign out
// import { useStaffAuth as useAuth } from '../../context/StaffAuthContext';

/**
 * แถบด้านบนของ Staff Portal — มีช่องค้นหา, ปุ่มแจ้งเตือน/ช่วยเหลือ, และผู้ใช้ปัจจุบัน
 *
 * props:
 *   title       - ข้อความหัวข้อที่โชว์ตอนจอมือถือ (เช่น "Orders")
 *   onSearch    - callback(query: string) เรียกตอนพิมพ์ค้นหา (optional)
 *   hasAlerts   - true = โชว์จุดแดงที่ปุ่มแจ้งเตือน
 */
export default function StaffTopbar({ title = 'ระบบพนักงาน วิบวับ', onSearch, hasAlerts = true }) {
  const [query, setQuery] = useState('');
  // const { user, logout } = useAuth();

  function handleChange(e) {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  }

  return (
    <header className="staff-topbar">
      <div className="staff-topbar__left">
        <button className="staff-icon-btn staff-mobile-only" aria-label="เปิดเมนู">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="staff-topbar__title">{title}</span>
        <div className="staff-topbar__search">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="ค้นหาคำสั่งซื้อ, SKU..."
            value={query}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="staff-topbar__right">
        <button className="staff-icon-btn" aria-label="การแจ้งเตือน">
          <span className="material-symbols-outlined">notifications</span>
          {hasAlerts && <span className="staff-icon-btn__dot" />}
        </button>
        <button className="staff-icon-btn" aria-label="ช่วยเหลือ">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
        <div className="staff-topbar__user">
          <div className="staff-topbar__avatar staff-topbar__avatar--fallback">
            {/* {user?.initials ?? 'JD'} */}
            JD
          </div>
        </div>
      </div>
    </header>
  );
}

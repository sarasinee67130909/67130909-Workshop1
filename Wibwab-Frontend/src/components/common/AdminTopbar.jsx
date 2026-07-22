// components/common/AdminTopbar.jsx — แถบด้านบนของ Executive Suite
// บัญชีแอดมินย้ายไปโชว์ที่แถบโลโก้บน Sidebar แล้ว (ดู AdminSidebar.jsx) — topbar นี้เหลือแค่แจ้งเตือนฝั่งขวา
export default function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left" />
      <div className="admin-topbar__right">
        <button className="admin-icon-btn" aria-label="การแจ้งเตือน">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  );
}

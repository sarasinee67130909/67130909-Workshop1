// components/common/Modal.jsx — กล่องโต้ตอบแบบใช้ซ้ำ (คลิกพื้นหลังหรือปุ่มปิดเพื่อปิด)
export default function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff', borderRadius: 8, padding: 24,
          maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="ปิด"
          style={{
            position: 'absolute', top: 12, right: 12, border: 'none',
            background: 'none', cursor: 'pointer', display: 'flex',
          }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        {children}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

// ปุ่ม "ส่งออก" พร้อมเมนูเลือกรูปแบบไฟล์ (Excel / PDF)
// onExport(format) ต้องคืนค่าเป็น Promise (เช่น เรียก exportXxxReport จาก admin.api.js)
export default function ExportMenu({ onExport, label = 'ส่งออก' }) {
  const [open, setOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState(null);
  const [error, setError] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSelect(format) {
    setOpen(false);
    setLoadingFormat(format);
    setError('');
    try {
      await onExport(format);
    } catch (err) {
      setError(err.response?.data?.message || 'ส่งออกไฟล์ไม่สำเร็จ');
    } finally {
      setLoadingFormat(null);
    }
  }

  const busy = loadingFormat !== null;

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="admin-btn admin-btn--primary"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="material-symbols-outlined">{busy ? 'progress_activity' : 'download'}</span>
        {busy ? 'กำลังส่งออก...' : label}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 20,
            minWidth: 180,
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius-md)',
            boxShadow: 'var(--admin-shadow)',
            overflow: 'hidden',
          }}
        >
          <button type="button" className="admin-export-menu__item" onClick={() => handleSelect('xlsx')}>
            <span className="material-symbols-outlined">description</span>
            ส่งออกเป็น Excel (.xlsx)
          </button>
          <button type="button" className="admin-export-menu__item" onClick={() => handleSelect('pdf')}>
            <span className="material-symbols-outlined">picture_as_pdf</span>
            ส่งออกเป็น PDF
          </button>
        </div>
      )}

      {error && (
        <p
          className="admin-login__error"
          style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, whiteSpace: 'nowrap' }}
        >
          {error}
        </p>
      )}

      <style>{`
        .admin-export-menu__item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          background: none;
          border: none;
          font-size: 13px;
          color: var(--admin-text);
          cursor: pointer;
          text-align: left;
        }
        .admin-export-menu__item:hover {
          background-color: var(--admin-surface-low);
        }
        .admin-export-menu__item .material-symbols-outlined {
          font-size: 18px;
          color: var(--admin-text-muted);
        }
      `}</style>
    </div>
  );
}

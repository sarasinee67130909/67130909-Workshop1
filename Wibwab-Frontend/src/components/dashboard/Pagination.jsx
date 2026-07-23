/**
 * แถบเลขหน้าท้ายตาราง ใช้ร่วมกันในหน้า Orders / Inventory
 *
 * props:
 *   page        - หน้าปัจจุบัน (เริ่มที่ 1)
 *   totalPages  - จำนวนหน้าทั้งหมด
 *   totalItems  - จำนวนรายการทั้งหมด (สำหรับข้อความ "Showing x to y of z")
 *   pageSize    - จำนวนรายการต่อหน้า
 *   onPageChange- callback(newPage: number)
 *   itemLabel   - หน่วยนับ เช่น "results" / "SKUs"
 */
export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'รายการ',
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 3);

  return (
    <div className="staff-pagination">
      <p>
        แสดง {start} ถึง {end} จาก {totalItems} {itemLabel}
      </p>
      <div className="staff-pagination__controls">
        <button
          className="staff-page-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="หน้าก่อนหน้า"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {pagesToShow.map((p) => (
          <button
            key={p}
            className={`staff-page-btn${p === page ? ' is-active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        {totalPages > pagesToShow.length && <span>...</span>}

        <button
          className="staff-page-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="หน้าถัดไป"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

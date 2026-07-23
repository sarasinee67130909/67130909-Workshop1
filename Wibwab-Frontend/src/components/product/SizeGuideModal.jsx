// components/product/SizeGuideModal.jsx — modal ตารางเทียบไซซ์ (แหวน + สร้อยคอ)
import React from 'react';

const RING_SIZES = [
  { size: '5', circumference: '49.3 มม.', diameter: '15.7 มม.' },
  { size: '6', circumference: '51.9 มม.', diameter: '16.5 มม.' },
  { size: '7', circumference: '54.4 มม.', diameter: '17.3 มม.' },
];

const NECKLACE_LENGTHS = [
  { length: '16 นิ้ว', cm: '40 ซม.', position: 'พอดีคอ (Choker)' },
  { length: '18 นิ้ว', cm: '45 ซม.', position: 'ระดับไหปลาร้า' },
  { length: '20 นิ้ว', cm: '50 ซม.', position: 'ต่ำกว่าไหปลาร้าเล็กน้อย' },
];

export default function SizeGuideModal({ open, onClose }) {
  if (!open) return null;

  return (
    // คลิกฉากหลังเพื่อปิด — stopPropagation กันคลิกในกล่องแล้วปิดโดยไม่ตั้งใจ
    <div className="pdp-modal-backdrop" onClick={onClose}>
      <div className="pdp-modal" role="dialog" aria-label="ตารางเทียบไซซ์" onClick={(e) => e.stopPropagation()}>
        <div className="pdp-modal__head">
          <h3>ตารางเทียบไซซ์</h3>
          <button type="button" onClick={onClose} aria-label="ปิด">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <h4>ไซซ์แหวน</h4>
        <table>
          <thead>
            <tr>
              <th>ไซซ์</th>
              <th>เส้นรอบวงนิ้ว</th>
              <th>เส้นผ่านศูนย์กลาง</th>
            </tr>
          </thead>
          <tbody>
            {RING_SIZES.map((row) => (
              <tr key={row.size}>
                <td>{row.size}</td>
                <td>{row.circumference}</td>
                <td>{row.diameter}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>ความยาวสร้อยคอ</h4>
        <table>
          <thead>
            <tr>
              <th>ความยาว</th>
              <th>เทียบ ซม.</th>
              <th>ตำแหน่งเมื่อสวมใส่</th>
            </tr>
          </thead>
          <tbody>
            {NECKLACE_LENGTHS.map((row) => (
              <tr key={row.length}>
                <td>{row.length}</td>
                <td>{row.cm}</td>
                <td>{row.position}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="pdp-modal__tip">
          เคล็ดลับ: วัดเส้นรอบวงนิ้วด้วยเชือกหรือกระดาษพันรอบนิ้ว แล้วนำความยาวมาเทียบกับตาราง
        </p>
      </div>
    </div>
  );
}

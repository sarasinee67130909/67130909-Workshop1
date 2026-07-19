// services/stock.service.js — Stock Engine: ตัด, คืน, แจ้งเตือนใกล้หมด
// ใช้ร่วมกันโดย staff.service (หน้า Inventory) และรองรับ order.service (คืนสต็อกตอนยกเลิกออเดอร์)
const pool = require('../config/db');
const { httpError } = require('../utils/validators');

// ตั้งจำนวนสต็อกใหม่แบบตรงๆ (ใช้จากช่อง "แก้ไขด่วน" หน้า Inventory)
async function setStock(variantId, newQty) {
  if (!Number.isInteger(Number(newQty)) || Number(newQty) < 0) {
    throw httpError(400, 'จำนวนสต็อกต้องเป็นจำนวนเต็มไม่ติดลบ');
  }
  const [result] = await pool.execute('UPDATE product_variants SET stock_qty = ? WHERE id = ?', [
    Number(newQty),
    variantId,
  ]);
  if (result.affectedRows === 0) throw httpError(404, 'ไม่พบตัวเลือกสินค้านี้');
  return { variant_id: Number(variantId), stock_qty: Number(newQty) };
}

// ปรับสต็อกแบบบวก/ลบ (delta) — กันสต็อกติดลบด้วย WHERE stock_qty + delta >= 0 ที่ระดับ SQL
async function adjustStock(variantId, delta) {
  if (!Number.isInteger(Number(delta))) throw httpError(400, 'จำนวนที่ปรับต้องเป็นจำนวนเต็ม');
  const [result] = await pool.execute(
    'UPDATE product_variants SET stock_qty = stock_qty + ? WHERE id = ? AND stock_qty + ? >= 0',
    [delta, variantId, delta]
  );
  if (result.affectedRows === 0) {
    throw httpError(400, 'ปรับสต็อกไม่สำเร็จ (จะทำให้สต็อกติดลบ หรือไม่พบตัวเลือกสินค้านี้)');
  }
  const [rows] = await pool.query('SELECT stock_qty FROM product_variants WHERE id = ?', [variantId]);
  return { variant_id: Number(variantId), stock_qty: rows[0].stock_qty };
}

// คืนสต็อกทุกรายการของออเดอร์ (ใช้ตอน staff ยกเลิกออเดอร์) — ต้องเรียกภายใต้ transaction เดียวกับผู้เรียก
async function restoreOrderStock(conn, orderId) {
  const [items] = await conn.execute('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [
    orderId,
  ]);
  for (const it of items) {
    await conn.execute('UPDATE product_variants SET stock_qty = stock_qty + ? WHERE id = ?', [
      it.quantity,
      it.variant_id,
    ]);
  }
}

// จำนวนตัวเลือกสินค้าที่ใกล้หมด (เหลือ > 0 แต่ <= threshold) — ใช้แสดง KPI แจ้งเตือน
async function getLowStockCount() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM product_variants
      WHERE is_active = TRUE AND stock_qty > 0 AND stock_qty <= low_stock_threshold`
  );
  return rows[0].cnt;
}

// จำนวนตัวเลือกสินค้าที่หมดสต็อก (เหลือ 0)
async function getOutOfStockCount() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM product_variants WHERE is_active = TRUE AND stock_qty = 0`
  );
  return rows[0].cnt;
}

module.exports = { setStock, adjustStock, restoreOrderStock, getLowStockCount, getOutOfStockCount };

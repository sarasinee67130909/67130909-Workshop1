// services/stock.service.js — Stock Engine: ตัด, คืน, แจ้งเตือนใกล้หมด
// ใช้ร่วมกันโดย staff.service (หน้า Inventory) และรองรับ order.service (คืนสต็อกตอนยกเลิกออเดอร์)
const pool = require('../config/db');
const { httpError } = require('../utils/validators');
const notificationService = require('./notification.service');

// เช็ค stock_qty ล่าสุดเทียบ low_stock_threshold แล้วยิงแจ้งเตือนถ้าถึงเกณฑ์ (ไม่ throw — พลาดได้โดยไม่กระทบการปรับสต็อก)
async function checkLowStockAlert(variantId) {
  const [rows] = await pool.query(
    `SELECT v.stock_qty, v.low_stock_threshold, v.sku, p.name
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
      WHERE v.id = ?`,
    [variantId]
  );
  if (rows.length === 0) return;
  const v = rows[0];
  if (v.stock_qty > v.low_stock_threshold) return;

  notificationService
    .notifyLowStock({ variantId, productName: v.name, sku: v.sku, stockQty: v.stock_qty })
    .catch((err) => console.error('สร้างการแจ้งเตือนสต็อกใกล้หมดไม่สำเร็จ:', err));
}

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
  checkLowStockAlert(variantId);
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
  if (delta < 0) checkLowStockAlert(variantId); // แจ้งเฉพาะตอนสต็อกลดลง ไม่ใช่ตอนเติมสต็อก
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

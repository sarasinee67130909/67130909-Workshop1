// services/review.service.js — รีวิวได้เฉพาะสินค้าใน order ของตัวเองที่สถานะ delivered
const pool = require('../config/db');
const { ORDER_STATUS } = require('../utils/orderStatus');
const { httpError, isPositiveInt } = require('../utils/validators');
const { NOTIFICATION_TYPE } = require('../utils/notificationType');
const { notifyStaff, formatOrderCode } = require('./order.service');

async function createReview(userId, { product_id, order_id, rating, comment }) {
  if (!isPositiveInt(product_id) || !isPositiveInt(order_id)) {
    throw httpError(400, 'ข้อมูลรีวิวไม่ถูกต้อง');
  }
  const score = Number(rating);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw httpError(400, 'คะแนนรีวิวต้องอยู่ระหว่าง 1-5 ดาว');
  }

  // เงื่อนไขตามกติกา: ต้องเป็นออเดอร์ของตัวเอง สถานะ delivered และมีสินค้าชิ้นนี้อยู่ในออเดอร์จริง
  const [rows] = await pool.execute(
    `SELECT o.id, u.full_name, p.name AS product_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN product_variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
      WHERE o.id = ? AND o.user_id = ? AND o.status = ? AND v.product_id = ?
      LIMIT 1`,
    [order_id, userId, ORDER_STATUS.DELIVERED, product_id]
  );
  if (rows.length === 0) {
    throw httpError(400, 'รีวิวได้เฉพาะสินค้าที่คุณสั่งซื้อและได้รับแล้วเท่านั้น');
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [userId, product_id, order_id, score, comment || null]
    );

    notifyStaff({
      type: NOTIFICATION_TYPE.NEW_REVIEW,
      message: `${rows[0].full_name} รีวิวสินค้า "${rows[0].product_name}" (${score} ดาว) ${formatOrderCode(order_id)}`,
      order_id: Number(order_id),
      product_id: Number(product_id),
      review_id: result.insertId,
    });

    return { id: result.insertId, product_id: Number(product_id), rating: score };
  } catch (err) {
    // UNIQUE (user_id, product_id, order_id) ใน schema กันรีวิวซ้ำ
    if (err.code === 'ER_DUP_ENTRY') throw httpError(400, 'คุณรีวิวสินค้านี้ไปแล้ว');
    throw err;
  }
}

module.exports = { createReview };

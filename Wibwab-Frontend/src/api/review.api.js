// api/review.api.js — ฟังก์ชันเรียก API เกี่ยวกับรีวิวสินค้า
import client from './client';

/**
 * ส่งรีวิวสินค้า (รีวิวได้เฉพาะออเดอร์ของตัวเองที่สถานะ delivered)
 * @param {object} payload - { product_id, order_id, rating, comment }
 * @returns {Promise<{success: boolean, data: {id, product_id, rating}, message?: string}>}
 */
export async function createReview(payload) {
  const res = await client.post('/api/reviews', payload);
  return res.data;
}

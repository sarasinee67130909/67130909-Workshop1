// api/favorite.api.js — ฟังก์ชันเรียก API รายการโปรดของลูกค้า
import client from './client';

/**
 * ดึงรายการสินค้าโปรดของผู้ใช้ที่ล็อกอินอยู่
 * @returns {Promise<{success: boolean, data: Array<{id, name, price, image_url, favorited_at}>}>}
 */
export async function getMyFavorites() {
  const res = await client.get('/api/favorites');
  return res.data;
}

/**
 * เพิ่มสินค้าเข้ารายการโปรด
 * @param {number|string} productId
 */
export async function addFavorite(productId) {
  const res = await client.post(`/api/favorites/${productId}`);
  return res.data;
}

/**
 * นำสินค้าออกจากรายการโปรด
 * @param {number|string} productId
 */
export async function removeFavorite(productId) {
  const res = await client.delete(`/api/favorites/${productId}`);
  return res.data;
}

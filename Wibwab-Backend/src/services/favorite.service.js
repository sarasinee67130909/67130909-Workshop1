// services/favorite.service.js — รายการโปรดของลูกค้า (SQL อยู่ชั้นนี้เท่านั้นตามกติกาข้อ 1)
const pool = require('../config/db');
const { httpError, isPositiveInt } = require('../utils/validators');

// รายการสินค้าโปรด — shape ตรง contract เดียวกับ ProductCard (id, name, price, image_url)
async function listFavorites(userId) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.name,
            MIN(v.price) AS price,
            (SELECT pi.image_path FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image_url,
            f.created_at AS favorited_at
       FROM favorites f
       JOIN products p ON p.id = f.product_id AND p.is_visible = TRUE
       JOIN product_variants v ON v.product_id = p.id AND v.is_active = TRUE
      WHERE f.user_id = ?
      GROUP BY p.id, p.name, f.created_at
      ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows.map((r) => ({ ...r, price: Number(r.price) })); // DECIMAL มาเป็น string → แปลงเป็นตัวเลข
}

// เพิ่มสินค้าเข้ารายการโปรด
async function addFavorite(userId, productId) {
  if (!isPositiveInt(productId)) throw httpError(400, 'รหัสสินค้าไม่ถูกต้อง');

  const [products] = await pool.execute(
    'SELECT id FROM products WHERE id = ? AND is_visible = TRUE',
    [productId]
  );
  if (products.length === 0) throw httpError(404, 'ไม่พบสินค้านี้');

  try {
    await pool.execute('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', [userId, productId]);
  } catch (err) {
    // UNIQUE (user_id, product_id) กันบันทึกซ้ำ — ถ้าซ้ำถือว่าสำเร็จอยู่แล้ว ไม่ต้อง error
    if (err.code !== 'ER_DUP_ENTRY') throw err;
  }
  return { product_id: Number(productId) };
}

// นำสินค้าออกจากรายการโปรด (ลบซ้ำ/ลบรายการที่ไม่มีอยู่ = no-op ไม่ error เพื่อความง่าย)
async function removeFavorite(userId, productId) {
  if (!isPositiveInt(productId)) throw httpError(400, 'รหัสสินค้าไม่ถูกต้อง');
  await pool.execute('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [userId, productId]);
  return { product_id: Number(productId) };
}

module.exports = { listFavorites, addFavorite, removeFavorite };

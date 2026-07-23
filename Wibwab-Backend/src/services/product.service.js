// services/product.service.js — query สินค้า/variant/รูป + ฟิลเตอร์ (SQL อยู่ชั้นนี้เท่านั้นตามกติกาข้อ 1)
const pool = require('../config/db');
const { httpError } = require('../utils/validators');

const PAGE_SIZE = 9;

// รายการสินค้า (เฉพาะที่แสดงอยู่ + variant ที่เปิดขาย) — shape ตรง contract ของ ProductListPage
async function getProducts(filters = {}) {
  const where = ['p.is_visible = TRUE'];
  const params = [];

  if (filters.category) {
    where.push('p.category_id = ?');
    params.push(Number(filters.category));
  }
  if (filters.material) {
    where.push('v.material LIKE ?');
    params.push(`%${filters.material}%`);
  }
  if (filters.size) {
    where.push('v.size LIKE ?');
    params.push(`${filters.size}%`);
  }
  if (filters.minPrice) {
    where.push('v.price >= ?');
    params.push(Number(filters.minPrice));
  }
  if (filters.maxPrice) {
    where.push('v.price <= ?');
    params.push(Number(filters.maxPrice));
  }
  if (filters.keyword) {
    where.push('p.name LIKE ?');
    params.push(`%${filters.keyword}%`);
  }

  const whereSql = where.join(' AND ');

  // นับจำนวนสินค้าทั้งหมดก่อนเพื่อคำนวณจำนวนหน้า (DISTINCT เพราะ join กับ variant แล้วแถวซ้ำ)
  const [countRows] = await pool.execute(
    `SELECT COUNT(DISTINCT p.id) AS total
       FROM products p
       JOIN product_variants v ON v.product_id = p.id AND v.is_active = TRUE
      WHERE ${whereSql}`,
    params
  );
  const total = countRows[0].total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(filters.page) || 1), totalPages);
  const offset = (page - 1) * PAGE_SIZE;

  // LIMIT/OFFSET เป็นตัวเลขที่ server คำนวณเอง จึงต่อ string ได้อย่างปลอดภัย
  // (mysql2.execute มีข้อจำกัดกับ placeholder ในตำแหน่ง LIMIT)
  const [rows] = await pool.execute(
    `SELECT p.id, p.name,
            MIN(v.price) AS price,
            (SELECT pi.image_path FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image_url
       FROM products p
       JOIN product_variants v ON v.product_id = p.id AND v.is_active = TRUE
      WHERE ${whereSql}
      GROUP BY p.id, p.name
      ORDER BY p.id ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    params
  );

  return {
    products: rows.map((r) => ({ ...r, price: Number(r.price) })), // DECIMAL มาเป็น string → แปลงเป็นตัวเลข
    totalPages,
  };
}

// รายละเอียดสินค้ารายตัว — shape ตรง contract ของ ProductDetailPage
async function getProductById(id) {
  const [products] = await pool.execute(
    `SELECT p.id, p.name, p.description, c.id AS category_id, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
      WHERE p.id = ? AND p.is_visible = TRUE`,
    [id]
  );
  if (products.length === 0) throw httpError(404, 'ไม่พบสินค้านี้');
  const p = products[0];

  const [images] = await pool.execute(
    'SELECT image_path FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC',
    [id]
  );

  const [variants] = await pool.execute(
    `SELECT id, sku, size, color, material, price, stock_qty, low_stock_threshold
       FROM product_variants
      WHERE product_id = ? AND is_active = TRUE
      ORDER BY id ASC`,
    [id]
  );

  const [reviews] = await pool.execute(
    `SELECT r.id, u.full_name AS user_name, r.rating, r.comment,
            DATE_FORMAT(r.created_at, '%d/%m/%Y') AS created_at
       FROM reviews r
       JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC`,
    [id]
  );

  const avg = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: { id: p.category_id, name: p.category_name },
    images: images.map((im) => im.image_path),
    variants: variants.map((v) => ({ ...v, price: Number(v.price) })),
    reviews,
    avg_rating: Number(avg.toFixed(1)),
  };
}

module.exports = { getProducts, getProductById };

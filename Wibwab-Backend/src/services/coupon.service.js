// services/coupon.service.js — CRUD โค้ดส่วนลด + push เข้ากระเป๋าคูปองลูกค้า (user_coupons)
const pool = require('../config/db');
const { ALL_PUSH_TRIGGERS, PUSH_TRIGGER } = require('../utils/couponType');
const { httpError, isNonEmptyString } = require('../utils/validators');

const PROMOS_PAGE_SIZE = 10;

// ============================================================
// Staff — จัดการโค้ดส่วนลด
// ============================================================
async function listPromoCodes({ search, page } = {}) {
  const where = [];
  const params = [];
  if (search && search.trim()) {
    where.push('(code LIKE ? OR label LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM promo_codes ${whereSql}`, params);
  const total = countRows[0].total;
  const totalPages = Math.max(1, Math.ceil(total / PROMOS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const offset = (currentPage - 1) * PROMOS_PAGE_SIZE;

  const [rows] = await pool.query(
    `SELECT pc.*,
            (SELECT COUNT(*) FROM user_coupons uc WHERE uc.promo_code_id = pc.id) AS wallet_count,
            (SELECT COUNT(*) FROM user_coupons uc WHERE uc.promo_code_id = pc.id AND uc.is_used = TRUE) AS wallet_used_count
       FROM promo_codes pc
       ${whereSql}
      ORDER BY pc.id DESC
      LIMIT ${PROMOS_PAGE_SIZE} OFFSET ${offset}`,
    params
  );

  return {
    items: rows.map(mapPromo),
    total,
    page: currentPage,
    totalPages,
    pageSize: PROMOS_PAGE_SIZE,
  };
}

async function getPromoCode(id) {
  const [rows] = await pool.execute('SELECT * FROM promo_codes WHERE id = ?', [id]);
  if (rows.length === 0) throw httpError(404, 'ไม่พบโค้ดส่วนลดนี้');
  return mapPromo(rows[0]);
}

function validatePromoPayload({ code, discount_type, discount_value, min_order_total, usage_limit, push_trigger }) {
  if (!isNonEmptyString(code)) throw httpError(400, 'กรุณาระบุโค้ดส่วนลด');
  if (!['percent', 'fixed'].includes(discount_type)) throw httpError(400, 'ประเภทส่วนลดไม่ถูกต้อง');
  if (!(Number(discount_value) > 0)) throw httpError(400, 'มูลค่าส่วนลดต้องมากกว่า 0');
  if (min_order_total !== undefined && Number(min_order_total) < 0) {
    throw httpError(400, 'ยอดสั่งซื้อขั้นต่ำต้องไม่ติดลบ');
  }
  if (usage_limit !== undefined && usage_limit !== null && !(Number(usage_limit) > 0)) {
    throw httpError(400, 'จำนวนครั้งที่ใช้ได้ต้องมากกว่า 0');
  }
  if (push_trigger !== undefined && !ALL_PUSH_TRIGGERS.includes(push_trigger)) {
    throw httpError(400, 'push_trigger ไม่ถูกต้อง');
  }
}

async function createPromoCode(payload) {
  validatePromoPayload(payload);
  const {
    code,
    label,
    discount_type,
    discount_value,
    min_order_total,
    expires_at,
    usage_limit,
    push_trigger,
    is_active,
  } = payload;

  try {
    const [result] = await pool.execute(
      `INSERT INTO promo_codes
         (code, label, discount_type, discount_value, min_order_total, expires_at, usage_limit, push_trigger, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.trim().toUpperCase(),
        label || null,
        discount_type,
        Number(discount_value),
        Number(min_order_total) || 0,
        expires_at || null,
        usage_limit || null,
        push_trigger || PUSH_TRIGGER.MANUAL,
        is_active === undefined ? true : Boolean(is_active),
      ]
    );
    return getPromoCode(result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw httpError(400, 'โค้ดนี้ถูกใช้ไปแล้ว');
    throw err;
  }
}

async function updatePromoCode(id, payload) {
  await getPromoCode(id); // throw 404 ถ้าไม่พบ
  validatePromoPayload(payload);
  const {
    code,
    label,
    discount_type,
    discount_value,
    min_order_total,
    expires_at,
    usage_limit,
    push_trigger,
    is_active,
  } = payload;

  try {
    await pool.execute(
      `UPDATE promo_codes
          SET code = ?, label = ?, discount_type = ?, discount_value = ?, min_order_total = ?,
              expires_at = ?, usage_limit = ?, push_trigger = ?, is_active = ?
        WHERE id = ?`,
      [
        code.trim().toUpperCase(),
        label || null,
        discount_type,
        Number(discount_value),
        Number(min_order_total) || 0,
        expires_at || null,
        usage_limit || null,
        push_trigger || PUSH_TRIGGER.MANUAL,
        is_active === undefined ? true : Boolean(is_active),
        id,
      ]
    );
    return getPromoCode(id);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw httpError(400, 'โค้ดนี้ถูกใช้ไปแล้ว');
    throw err;
  }
}

// ── Push ให้ลูกค้าทุกคนที่ยังไม่มีโค้ดนี้ในกระเป๋า (staff กดเอง เช่น คูปองรายเดือน) ──
async function pushCouponToAllCustomers(promoId) {
  await getPromoCode(promoId); // throw 404 ถ้าไม่พบ

  const [result] = await pool.query(
    `INSERT IGNORE INTO user_coupons (user_id, promo_code_id)
     SELECT id, ? FROM users WHERE role = 'customer'`,
    [promoId]
  );
  return { pushed_count: result.affectedRows };
}

// ============================================================
// Welcome coupon — แจกอัตโนมัติตอนสมัครสมาชิก (เรียกจาก auth.service.js)
// ============================================================
async function grantWelcomeCoupons(userId) {
  const [promos] = await pool.query(
    `SELECT id FROM promo_codes
      WHERE push_trigger = 'on_register' AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())`
  );
  for (const promo of promos) {
    await pool.execute('INSERT IGNORE INTO user_coupons (user_id, promo_code_id) VALUES (?, ?)', [
      userId,
      promo.id,
    ]);
  }
}

// ============================================================
// ลูกค้า — กระเป๋าคูปองของตัวเอง
// ============================================================
async function listMyCoupons(userId) {
  const [rows] = await pool.execute(
    `SELECT uc.id AS user_coupon_id, uc.is_used, uc.assigned_at, uc.used_at,
            pc.code, pc.label, pc.discount_type, pc.discount_value, pc.min_order_total, pc.expires_at
       FROM user_coupons uc
       JOIN promo_codes pc ON pc.id = uc.promo_code_id
      WHERE uc.user_id = ?
      ORDER BY uc.is_used ASC, uc.assigned_at DESC`,
    [userId]
  );

  const now = new Date();
  return rows.map((r) => ({
    user_coupon_id: r.user_coupon_id,
    code: r.code,
    label: r.label,
    discount_type: r.discount_type,
    discount_value: Number(r.discount_value),
    min_order_total: Number(r.min_order_total),
    expires_at: r.expires_at,
    is_used: Boolean(r.is_used),
    is_expired: Boolean(r.expires_at) && new Date(r.expires_at) < now,
    assigned_at: r.assigned_at,
    used_at: r.used_at,
  }));
}

function mapPromo(row) {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    discount_type: row.discount_type,
    discount_value: Number(row.discount_value),
    min_order_total: Number(row.min_order_total),
    expires_at: row.expires_at,
    usage_limit: row.usage_limit,
    used_count: row.used_count,
    is_active: Boolean(row.is_active),
    push_trigger: row.push_trigger,
    wallet_count: row.wallet_count !== undefined ? Number(row.wallet_count) : undefined,
    wallet_used_count: row.wallet_used_count !== undefined ? Number(row.wallet_used_count) : undefined,
  };
}

module.exports = {
  listPromoCodes,
  getPromoCode,
  createPromoCode,
  updatePromoCode,
  pushCouponToAllCustomers,
  grantWelcomeCoupons,
  listMyCoupons,
};

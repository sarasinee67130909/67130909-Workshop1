// services/address.service.js — CRUD ที่อยู่จัดส่งของลูกค้า (ตรงกับ addresses table)
const pool = require('../config/db');
const { isNonEmptyString, httpError } = require('../utils/validators');

const REQUIRED_FIELDS = [
  'recipient_name',
  'phone',
  'address_line',
  'subdistrict',
  'district',
  'province',
  'postal_code',
];

function validateAddressBody(body) {
  for (const field of REQUIRED_FIELDS) {
    if (!isNonEmptyString(body[field])) {
      throw httpError(400, 'กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน');
    }
  }
}

// ยืนยันว่าที่อยู่นี้เป็นของ user จริง — คืน address ถ้าใช่ ไม่งั้น throw
async function assertOwner(userId, addressId) {
  const [rows] = await pool.execute('SELECT * FROM addresses WHERE id = ?', [addressId]);
  if (rows.length === 0) throw httpError(404, 'ไม่พบที่อยู่นี้');
  if (rows[0].user_id !== userId) throw httpError(403, 'ไม่ใช่ที่อยู่ของคุณ');
  return rows[0];
}

async function list(userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return rows;
}

async function create(userId, body) {
  validateAddressBody(body);
  const isDefault = Boolean(body.is_default);

  // ถ้าตั้งเป็นค่าเริ่มต้น ต้องปลดค่าเริ่มต้นของอันอื่นก่อน กันมี default ซ้อนกัน 2 อัน
  if (isDefault) {
    await pool.execute('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
  }

  const [result] = await pool.execute(
    `INSERT INTO addresses (user_id, recipient_name, phone, address_line, subdistrict, district, province, postal_code, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      body.recipient_name,
      body.phone,
      body.address_line,
      body.subdistrict,
      body.district,
      body.province,
      body.postal_code,
      isDefault,
    ]
  );

  return assertOwner(userId, result.insertId);
}

async function update(userId, addressId, body) {
  await assertOwner(userId, addressId);
  validateAddressBody(body);
  const isDefault = Boolean(body.is_default);

  if (isDefault) {
    await pool.execute('UPDATE addresses SET is_default = FALSE WHERE user_id = ? AND id != ?', [
      userId,
      addressId,
    ]);
  }

  await pool.execute(
    `UPDATE addresses SET recipient_name = ?, phone = ?, address_line = ?, subdistrict = ?,
            district = ?, province = ?, postal_code = ?, is_default = ?
      WHERE id = ?`,
    [
      body.recipient_name,
      body.phone,
      body.address_line,
      body.subdistrict,
      body.district,
      body.province,
      body.postal_code,
      isDefault,
      addressId,
    ]
  );

  return assertOwner(userId, addressId);
}

async function remove(userId, addressId) {
  await assertOwner(userId, addressId);
  await pool.execute('DELETE FROM addresses WHERE id = ?', [addressId]);
  return { id: Number(addressId) };
}

async function setDefault(userId, addressId) {
  await assertOwner(userId, addressId);
  await pool.execute('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
  await pool.execute('UPDATE addresses SET is_default = TRUE WHERE id = ?', [addressId]);
  return assertOwner(userId, addressId);
}

module.exports = { list, create, update, remove, setDefault };

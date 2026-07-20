// services/auth.service.js — logic สมัครสมาชิก / เข้าสู่ระบบ / ออก JWT / ลืมรหัสผ่าน / แก้โปรไฟล์
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { isEmail, isNonEmptyString, httpError } = require('../utils/validators');

const RESET_TOKEN_TTL_MINUTES = 30;

// ออก token อายุ 7 วัน — payload เก็บแค่ที่จำเป็น
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register({ email, password, full_name, phone }) {
  if (!isEmail(email)) throw httpError(400, 'รูปแบบอีเมลไม่ถูกต้อง');
  if (!isNonEmptyString(password) || password.length < 8) {
    throw httpError(400, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
  }
  if (!isNonEmptyString(full_name)) throw httpError(400, 'กรุณากรอกชื่อ-นามสกุล');

  const [dup] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (dup.length > 0) throw httpError(400, 'อีเมลนี้ถูกใช้สมัครแล้ว');

  const password_hash = await bcrypt.hash(password, 10);
  // สมัครผ่านหน้าเว็บได้เฉพาะ role customer (บัญชี staff/admin มาจาก seed/แอดมินสร้าง)
  const [result] = await pool.execute(
    "INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, 'customer')",
    [email, password_hash, full_name, phone || null]
  );

  const user = { id: result.insertId, role: 'customer', full_name };
  return {
    token: signToken(user),
    user: { id: user.id, email, full_name, role: 'customer' },
  };
}

async function login({ email, password }) {
  if (!isEmail(email) || !isNonEmptyString(password)) {
    throw httpError(400, 'กรุณากรอกอีเมลและรหัสผ่าน');
  }

  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  // ตอบข้อความเดียวกันทั้งกรณีไม่พบอีเมล/รหัสผิด — ไม่ให้เดาได้ว่าอีเมลไหนมีในระบบ
  if (rows.length === 0) throw httpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw httpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');

  return {
    token: signToken(user),
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
  };
}

async function getMe(userId) {
  const [rows] = await pool.execute(
    'SELECT id, email, full_name, phone, role FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) throw httpError(404, 'ไม่พบข้อมูลผู้ใช้');
  return rows[0];
}

// ระบบใช้ JWT แบบ stateless (ไม่มี session เก็บฝั่ง server) จึง "logout" จริง ๆ
// คือให้ฝั่ง client ทิ้ง token ทิ้งไป — ฟังก์ชันนี้มีไว้เผื่ออนาคตอยากทำ token blacklist
// หรือบันทึกเวลาที่ผู้ใช้ออกจากระบบ ตอนนี้แค่ยืนยันว่าคำขอถูกต้อง (ผ่าน verifyToken แล้ว)
async function logout(userId) {
  return { message: 'ออกจากระบบสำเร็จ' };
}

// ขอลิงก์รีเซ็ตรหัสผ่าน — ตอบ success เหมือนกันไม่ว่าจะพบอีเมลหรือไม่ กันคนสุ่มเดาว่าอีเมลไหนมีในระบบ
async function forgotPassword(email) {
  if (!isEmail(email)) throw httpError(400, 'รูปแบบอีเมลไม่ถูกต้อง');

  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    return { message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  await pool.execute(
    'INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
    [token, rows[0].id, RESET_TOKEN_TTL_MINUTES]
  );

  // จำลองการส่งอีเมล (§5.11): log ลิงก์ไว้ที่ console + ส่งกลับใน response เพื่อให้ทดสอบ/สาธิตได้จริง
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
  console.log(`📧 [จำลองอีเมล] ลิงก์รีเซ็ตรหัสผ่านสำหรับ ${email}: ${resetUrl}`);

  return {
    message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว',
    reset_url: resetUrl, // TODO: เอาออกจาก response ตอน deploy จริง (ตอนนี้ยังไม่ส่งอีเมลจริง เลยส่งกลับมาไว้ทดสอบ)
  };
}

// ตั้งรหัสผ่านใหม่จาก token — field ชื่อ "password" ให้ตรงกับที่ ResetPasswordPage.jsx ส่งมา
async function resetPassword(token, password) {
  if (!isNonEmptyString(token)) throw httpError(400, 'ไม่พบ token');
  if (!isNonEmptyString(password) || password.length < 8) {
    throw httpError(400, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
  }

  const [rows] = await pool.execute(
    'SELECT id, user_id FROM password_resets WHERE token = ? AND used = FALSE AND expires_at > NOW()',
    [token]
  );
  if (rows.length === 0) throw httpError(400, 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');

  const password_hash = await bcrypt.hash(password, 10);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, rows[0].user_id]);
  await pool.execute('UPDATE password_resets SET used = TRUE WHERE id = ?', [rows[0].id]);

  return { message: 'ตั้งรหัสผ่านใหม่สำเร็จ' };
}

// แก้ไขข้อมูลโปรไฟล์ (ชื่อ, เบอร์โทร) — อีเมลเปลี่ยนไม่ได้ตามกติกาหน้า ProfilePage
async function updateProfile(userId, { full_name, phone }) {
  if (!isNonEmptyString(full_name)) throw httpError(400, 'กรุณากรอกชื่อ-นามสกุล');

  await pool.execute('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', [
    full_name,
    phone || null,
    userId,
  ]);
  return getMe(userId);
}

// เปลี่ยนรหัสผ่าน (ต้องยืนยันรหัสเดิมก่อน)
async function changePassword(userId, { current_password, new_password }) {
  if (!isNonEmptyString(current_password)) throw httpError(400, 'กรุณากรอกรหัสผ่านปัจจุบัน');
  if (!isNonEmptyString(new_password) || new_password.length < 8) {
    throw httpError(400, 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร');
  }

  const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) throw httpError(404, 'ไม่พบข้อมูลผู้ใช้');

  const ok = await bcrypt.compare(current_password, rows[0].password_hash);
  if (!ok) throw httpError(400, 'รหัสผ่านปัจจุบันไม่ถูกต้อง');

  const password_hash = await bcrypt.hash(new_password, 10);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, userId]);

  return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
}

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
};
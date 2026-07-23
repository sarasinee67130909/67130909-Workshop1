// services/adminAuth.service.js — ลืมรหัสผ่านฝั่ง Admin ด้วยรหัส OTP 6 หลัก ส่งอีเมลจริง (ไม่จำลอง)
// แยกจาก auth.service.js (ลูกค้าใช้ลิงก์แบบจำลองอีเมลตาม §5.11) เพราะเป็นคนละกลไกและขอบเขตผู้ใช้งาน
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { isEmail, isNonEmptyString, httpError } = require('../utils/validators');
const { sendMail } = require('../utils/mailer');

const OTP_TTL_MINUTES = 10;

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000)); // 6 หลักเสมอ (100000–999999)
}

// ขอรหัส OTP — ต้องเป็นอีเมลที่ตรงกับบัญชี admin ที่มีอยู่จริงเท่านั้น (แจ้ง error ตรง ๆ ตามที่ต้องการ
// ต่างจากฝั่งลูกค้าที่ตอบเหมือนกันทุกกรณีเพื่อกันเดาอีเมล เพราะนี่เป็นเครื่องมือภายในของผู้บริหาร ไม่ใช่หน้าสาธารณะ)
async function requestPasswordResetOtp(email) {
  if (!isEmail(email)) throw httpError(400, 'รูปแบบอีเมลไม่ถูกต้อง');

  const [rows] = await pool.execute("SELECT id, full_name FROM users WHERE email = ? AND role = 'admin'", [email]);
  if (rows.length === 0) throw httpError(404, 'ไม่พบอีเมลนี้ในระบบผู้บริหาร');

  const otpCode = generateOtp();
  await pool.execute(
    'INSERT INTO password_reset_otps (user_id, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
    [rows[0].id, otpCode, OTP_TTL_MINUTES]
  );

  await sendMail({
    to: email,
    subject: 'รหัส OTP สำหรับรีเซ็ตรหัสผ่าน - วิบวับ',
    text: `รหัส OTP ของคุณคือ ${otpCode} (หมดอายุใน ${OTP_TTL_MINUTES} นาที) หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1e293b;">วิบวับ — รีเซ็ตรหัสผ่านผู้บริหาร</h2>
        <p>สวัสดีคุณ ${rows[0].full_name},</p>
        <p>รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ:</p>
        <p style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#b08d57;">${otpCode}</p>
        <p>รหัสนี้จะหมดอายุภายใน ${OTP_TTL_MINUTES} นาที</p>
        <p style="color:#64748b; font-size:12px;">หากคุณไม่ได้เป็นผู้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
      </div>
    `,
  });

  return { message: `ส่งรหัส OTP ไปที่ ${email} แล้ว กรุณาตรวจสอบอีเมล` };
}

// ยืนยัน OTP + ตั้งรหัสผ่านใหม่ในขั้นตอนเดียว
async function resetPasswordWithOtp({ email, otp_code, new_password }) {
  if (!isEmail(email)) throw httpError(400, 'รูปแบบอีเมลไม่ถูกต้อง');
  if (!isNonEmptyString(otp_code)) throw httpError(400, 'กรุณากรอกรหัส OTP');
  if (!isNonEmptyString(new_password) || new_password.length < 8) {
    throw httpError(400, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
  }

  const [users] = await pool.execute("SELECT id FROM users WHERE email = ? AND role = 'admin'", [email]);
  if (users.length === 0) throw httpError(404, 'ไม่พบอีเมลนี้ในระบบผู้บริหาร');
  const userId = users[0].id;

  const [rows] = await pool.execute(
    'SELECT id FROM password_reset_otps WHERE user_id = ? AND otp_code = ? AND used = FALSE AND expires_at > NOW()',
    [userId, otp_code]
  );
  if (rows.length === 0) throw httpError(400, 'รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว');

  const password_hash = await bcrypt.hash(new_password, 10);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, userId]);
  await pool.execute('UPDATE password_reset_otps SET used = TRUE WHERE id = ?', [rows[0].id]);

  return { message: 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' };
}

module.exports = { requestPasswordResetOtp, resetPasswordWithOtp };

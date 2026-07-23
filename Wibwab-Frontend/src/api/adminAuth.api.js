// api/adminAuth.api.js — ลืมรหัสผ่านฝั่ง Admin ด้วย OTP ทางอีเมลจริง (แยกจาก auth.api.js ของลูกค้า)
import client from './client';

export async function requestAdminOtp(email) {
  const res = await client.post('/api/admin-auth/forgot-password', { email });
  return res.data;
}

export async function resetAdminPasswordWithOtp({ email, otp_code, new_password }) {
  const res = await client.post('/api/admin-auth/reset-password', { email, otp_code, new_password });
  return res.data;
}

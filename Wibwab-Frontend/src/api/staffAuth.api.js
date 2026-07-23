// api/staffAuth.api.js — ลืมรหัสผ่านฝั่ง Staff ด้วย OTP ทางอีเมลจริง (แยกจาก auth.api.js ของลูกค้า)
import client from './client';

export async function requestStaffOtp(email) {
  const res = await client.post('/api/staff-auth/forgot-password', { email });
  return res.data;
}

export async function resetStaffPasswordWithOtp({ email, otp_code, new_password }) {
  const res = await client.post('/api/staff-auth/reset-password', { email, otp_code, new_password });
  return res.data;
}

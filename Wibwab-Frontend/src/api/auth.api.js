// api/auth.api.js — ฟังก์ชันเรียก API เกี่ยวกับการยืนยันตัวตน (Login/Register)
import client from './client';

/**
 * ส่งข้อมูลเพื่อเข้าสู่ระบบ
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, data: {token: string, user: object}, message?: string}>}
 */
export const login = async (email, password) => {
  const response = await client.post('/api/auth/login', { email, password });
  return response.data;
};

/**
 * ส่งข้อมูลเพื่อสมัครสมาชิกใหม่
 * @param {object} userData - { full_name, email, password }
 * @returns {Promise<{success: boolean, data: {token: string, user: object}, message?: string}>}
 */
export const register = async (userData) => {
  const response = await client.post('/api/auth/register', userData);
  return response.data;
};

/**
 * ดึงข้อมูลผู้ใช้ปัจจุบันจาก token
 * @returns {Promise<{success: boolean, data: {user: object}, message?: string}>}
 */
export const getMe = async () => {
  const response = await client.get('/api/auth/me');
  return response.data;
};

/**
 * แจ้ง backend ว่าผู้ใช้ออกจากระบบ (ระบบเป็น JWT แบบ stateless
 * จึงไม่มีอะไรให้ลบฝั่ง server แต่เรียกไว้เผื่ออนาคตทำ token blacklist/logging)
 * @returns {Promise<{success: boolean, data: {message: string}}>}
 */
export const logout = async () => {
  const response = await client.post('/api/auth/logout');
  return response.data;
};

/**
 * อัปเดตข้อมูลโปรไฟล์ผู้ใช้ (ชื่อ, เบอร์โทร)
 * @param {object} profileData - { full_name, phone }
 * @returns {Promise<{success: boolean, data: {user: object}, message?: string}>}
 */
export const updateProfile = async (profileData) => {
  // PUT /api/auth/profile (ยังไม่มี endpoint จริงใน backend)
  const response = await client.put('/api/auth/profile', profileData);
  return response.data;
};

/**
 * เปลี่ยนรหัสผ่าน
 * @param {object} passwordData - { current_password, new_password }
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const changePassword = async (passwordData) => {
  // POST /api/auth/change-password (ยังไม่มี endpoint จริงใน backend)
  const response = await client.post('/api/auth/change-password', passwordData);
  return response.data;
};
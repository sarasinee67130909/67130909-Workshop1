// api/address.api.js — ฟังก์ชัน CRUD สำหรับที่อยู่จัดส่ง
import client from './client';

/**
 * ดึงที่อยู่ทั้งหมดของผู้ใช้
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export const getAddresses = async () => {
  const response = await client.get('/api/addresses');
  return response.data;
};

/**
 * สร้างที่อยู่ใหม่
 * @param {object} addressData
 * @returns {Promise<{success: boolean, data: object}>}
 */
export const createAddress = async (addressData) => {
  const response = await client.post('/api/addresses', addressData);
  return response.data;
};

/**
 * อัปเดตที่อยู่
 * @param {number} id
 * @param {object} addressData
 * @returns {Promise<{success: boolean, data: object}>}
 */
export const updateAddress = async (id, addressData) => {
  const response = await client.put(`/api/addresses/${id}`, addressData);
  return response.data;
};

/**
 * ลบที่อยู่
 * @param {number} id
 * @returns {Promise<{success: boolean}>}
 */
export const deleteAddress = async (id) => {
  const response = await client.delete(`/api/addresses/${id}`);
  return response.data;
};

/**
 * ตั้งเป็นที่อยู่หลัก
 * @param {number} id
 * @returns {Promise<{success: boolean}>}
 */
export const setDefaultAddress = async (id) => {
  const response = await client.patch(`/api/addresses/${id}/default`);
  return response.data;
};
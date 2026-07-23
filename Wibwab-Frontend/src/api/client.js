// api/client.js — axios instance กลาง + แนบ JWT อัตโนมัติ (ไฟล์ shared — แก้แล้วแจ้ง Dev2)
import axios from 'axios';

// สร้าง Axios instance สำหรับเรียกใช้ API ในโปรเจกต์
const apiClient = axios.create({
  // ใช้ path แบบ relative (/api/...) — ตอน dev ให้ Vite proxy ส่งต่อไป Backend :3000
  // ตอน deploy จริงค่อยเปลี่ยน baseURL ที่จุดนี้จุดเดียว (กติกาข้อ 7)
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// แต่ละ portal (ลูกค้า/พนักงาน/แอดมิน) เก็บ session แยกกันคนละ localStorage key
// (ดู context/createAuthContext.js) — ตรงนี้จึงต้องเลือก token ให้ตรงกับ portal
// ที่กำลังเปิดอยู่ตาม path ปัจจุบัน ไม่ใช้ key ร่วมกันแบบเดิม เพื่อให้ล็อกอิน
// พร้อมกันได้ทั้ง 3 role โดยไม่ทับ session กัน
const PORTAL_STORAGE_KEYS = {
  staff: 'wibwab_staff_auth',
  admin: 'wibwab_admin_auth',
  customer: 'wibwab_customer_auth',
};

function getActivePortal() {
  const path = window.location.pathname;
  if (path.startsWith('/staff')) return 'staff';
  if (path.startsWith('/admin')) return 'admin';
  return 'customer';
}

function getActiveToken() {
  const key = PORTAL_STORAGE_KEYS[getActivePortal()];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw)?.token ?? null : null;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getActiveToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
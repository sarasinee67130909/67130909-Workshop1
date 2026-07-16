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

// สามารถใส่ Interceptor สำหรับแนบ JWT Token ได้ที่นี่ในอนาคต
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
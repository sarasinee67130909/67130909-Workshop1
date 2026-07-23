// config/db.js — mysql2 connection pool (charset utf8mb4 — ภาษาไทยต้องรอด ตามกติกาข้อ 6)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'wibwab',
  password: process.env.DB_PASSWORD || 'wibwab_pass',
  database: process.env.DB_NAME || 'wibwab_db',
  charset: 'utf8mb4',
  // container MySQL เป็น UTC เสมอ (ไม่ได้ตั้ง TZ ใน docker-compose.yml) — ถ้าไม่ระบุ mysql2 จะ default
  // เป็น 'local' คือตีความค่าที่ได้จาก DB ว่าเป็นเวลาโซนของเครื่อง Node เอง ทำให้ TIMESTAMP เพี้ยนไปตาม
  // ส่วนต่างโซนเวลา (เช่น เครื่อง dev อยู่ ICT/+7 → เวลาที่ได้จะคลาดเคลื่อนไป 7 ชม.) ระบุ 'Z' ให้ตรงกับความจริง
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;

// utils/mailer.js — ส่งอีเมลจริงผ่าน SMTP (nodemailer) ใช้สำหรับ OTP รีเซ็ตรหัสผ่านฝั่ง Admin
// ตั้งค่าที่ต้องมีใน .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (ดู .env.example)
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  ยังไม่ได้ตั้งค่า SMTP_USER/SMTP_PASS ใน .env — ส่งอีเมลจริงไม่ได้จนกว่าจะตั้งค่า');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // ใช้ STARTTLS ที่พอร์ต 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

// ส่งอีเมล — โยน error ออกไปให้ผู้เรียกจัดการเอง (เช่นตอบ 500 ถ้าส่งไม่สำเร็จจริง ๆ)
async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) throw new Error('ระบบยังไม่ได้ตั้งค่าบัญชีสำหรับส่งอีเมล (SMTP_USER/SMTP_PASS)');

  await t.sendMail({
    from: process.env.SMTP_FROM || `"วิบวับ" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };

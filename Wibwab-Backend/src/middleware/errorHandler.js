// middleware/errorHandler.js — error handler กลาง ตอบ JSON format เดียวกันทั้งระบบ
const multer = require('multer');

function errorHandler(err, req, res, next) {
  // MulterError = ปัญหาจากการอัปโหลดไฟล์
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'ไฟล์ใหญ่เกิน 5MB' : `อัปโหลดไฟล์ไม่สำเร็จ (${err.code})`;
    return res.status(400).json({ success: false, message });
  }

  // error ที่ service ตั้งใจโยน (มี statusCode) — แสดงข้อความตรงๆ ได้
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // error ไม่คาดคิด — log ไว้ debug แต่ไม่เปิดเผยรายละเอียดให้ผู้ใช้
  console.error('เกิดข้อผิดพลาดไม่คาดคิด:', err);
  res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
}

module.exports = errorHandler;

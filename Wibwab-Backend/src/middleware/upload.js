// middleware/upload.js — multer: อัปโหลดรูปสินค้า (uploads/products) และสลิปโอนเงิน (uploads/slips)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function makeUploader(subfolder) {
  const dest = path.join(__dirname, '..', '..', 'uploads', subfolder);
  fs.mkdirSync(dest, { recursive: true }); // uploads/ อยู่ใน .gitignore — สร้างโฟลเดอร์เผื่อเครื่องเพื่อนร่วมทีม

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      // ตั้งชื่อไฟล์กันชนกัน: <โฟลเดอร์>-<เวลา>-<เลขสุ่ม>.<นามสกุลเดิม>
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `${subfolder}-${unique}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // จำกัด 5MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) return cb(null, true);
      const err = new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น');
      err.statusCode = 400;
      cb(err);
    },
  });
}

module.exports = {
  uploadProductImage: makeUploader('products'), // ให้ Dev2 ใช้ตอนทำจัดการสินค้า
  uploadSlip: makeUploader('slips'),
};

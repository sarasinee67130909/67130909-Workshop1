// middleware/role.js — requireRole('staff','admin'): ตรวจสิทธิ์ตามบทบาท (ต้องใช้หลัง verifyToken เสมอ)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    }
    next();
  };
}

module.exports = { requireRole };

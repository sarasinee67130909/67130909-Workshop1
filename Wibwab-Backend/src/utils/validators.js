// utils/validators.js — ตรวจ input พื้นฐาน + ตัวช่วยสร้าง error พร้อม status code
const isEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isPositiveInt = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

// สร้าง Error ที่มี statusCode ให้ errorHandler กลางตอบ JSON ได้ถูกต้อง
function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { isEmail, isPositiveInt, isNonEmptyString, httpError };

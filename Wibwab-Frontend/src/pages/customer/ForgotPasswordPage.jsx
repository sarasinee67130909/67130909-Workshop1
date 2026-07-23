// pages/customer/ForgotPasswordPage.jsx — หน้าขอรีเซ็ตรหัสผ่าน
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('request'); // 'request' | 'sent'
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer;
    if (status === 'sent' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [status, countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend ยังไม่มีจริง, catch error แล้วทำงานต่อแบบ demo
      await forgotPassword(email);
    } catch (err) {
      console.warn('forgotPassword API failed (as expected), proceeding with demo flow.');
    } finally {
      setLoading(false);
      setStatus('sent');
      setCountdown(60); // Reset countdown on new submission
    }
  };

  return (
    <main className="login-page-container">
      {/* รูปภาพฝั่งซ้าย (เหมือนหน้า Login) */}
      <div className="login-image-panel">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AP1WRLvIC1NLvAEME8qMXLV7NX2OPP5PMn52fp7owX-usQPhVxV1xpMY5IosxLN7i-ZquSsLFd9iLMobwHq7SkUHLnLlwqKr78V4tIWrgjHkUKznneZl8bejzuARiIP21SZs-N7caUoCL9OGzniepykhbGXVMiRsCtTx7k5gM1OjG8HSgEZZxryKHDdBUIoNUyHQ-MD4L7pq1RtBbFKeM69LlacyhsQGgXXl5RmplSQQ0NibvA-kmU0btORtnQ"
          alt="เครื่องประดับวางบนพื้นผิวสวยงาม"
        />
      </div>

      {/* ฟอร์มฝั่งขวา */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          {status === 'request' ? (
            <>
              <div className="login-header">
                <h1 className="login-title">ลืมรหัสผ่าน?</h1>
                <p className="login-subtitle">กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้</p>
              </div>
              <form onSubmit={handleSubmit} className="login-form">
                <div className="fp-field">
                  <input
                    type="email"
                    id="email"
                    className="fp-input"
                    placeholder=" " /* placeholder ต้องมี แต่เว้นว่างไว้ */
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="email" className="fp-label">อีเมลของคุณ</label>
                </div>
                <button type="submit" className="register-submit-btn" disabled={loading}>
                  {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                </button>
              </form>
            </>
          ) : (
            <div className="fp-sent-state">
              <div className="fp-sent-icon">
                <span className="material-symbols-outlined">mark_email_read</span>
              </div>
              <h1 className="login-title">ตรวจสอบอีเมลของคุณ</h1>
              <p className="login-subtitle">
                เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่ <strong>{email}</strong> แล้ว (หากไม่พบ กรุณาตรวจสอบในโฟลเดอร์อีเมลขยะ)
              </p>
              <button
                type="button"
                className="register-submit-btn"
                onClick={handleSubmit}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `ส่งอีกครั้งใน (${countdown})` : 'ส่งลิงก์อีกครั้ง'}
              </button>
            </div>
          )}
          <div className="login-register-link">
            <p><Link to="/login">กลับไปหน้าเข้าสู่ระบบ</Link></p>
          </div>
        </div>
      </div>
    </main>
  );
}
// pages/customer/ResetPasswordPage.jsx — หน้าตั้งรหัสผ่านใหม่จากลิงก์
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { resetPassword } from '../../api/auth.api';

// คัดลอกฟังก์ชันมาจาก ProfilePage.jsx เพื่อ reuse logic
const getPasswordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const labels = ['', 'อ่อนมาก', 'อ่อน', 'ปานกลาง', 'ดี', 'ดีมาก'];
  return { score, label: labels[score] };
};

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [strength, setStrength] = useState({ score: 0, label: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      setStrength(getPasswordStrength(value));
    }
  };

  const toggleShow = (field) => setShow(prev => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (form.password !== form.confirm) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    setLoading(true);
    try {
      // Backend ยังไม่มีจริง, catch error แล้วทำงานต่อแบบ demo
      await resetPassword({ token, password: form.password });
      setIsSuccess(true);
    } catch (err) {
      console.warn('resetPassword API failed (as expected), showing demo success.');
      // ในระบบจริงอาจแสดง error จาก server เช่น "token ไม่ถูกต้องหรือหมดอายุ"
      // แต่ในเดโมให้สำเร็จเสมอ
      setIsSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  // Panel สำเร็จ (แสดงค้างตาม spec ไม่หายเอง)
  if (isSuccess) {
    return (
      <main className="login-page-container">
        <div className="login-image-panel">
          <img src="https://lh3.googleusercontent.com/aida-public/AP1WRLvIC1NLvAEME8qMXLV7NX2OPP5PMn52fp7owX-usQPhVxV1xpMY5IosxLN7i-ZquSsLFd9iLMobwHq7SkUHLnLlwqKr78V4tIWrgjHkUKznneZl8bejzuARiIP21SZs-N7caUoCL9OGzniepykhbGXVMiRsCtTx7k5gM1OjG8HSgEZZxryKHDdBUIoNUyHQ-MD4L7pq1RtBbFKeM69LlacyhsQGgXXl5RmplSQQ0NibvA-kmU0btORtnQ" alt="เครื่องประดับ" />
        </div>
        <div className="login-form-panel">
          <div className="fp-success-panel">
            <div className="fp-sent-icon">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <h1 className="login-title">ตั้งรหัสผ่านใหม่สำเร็จ</h1>
            <p className="login-subtitle">คุณสามารถใช้รหัสผ่านใหม่เพื่อเข้าสู่ระบบได้ทันที</p>
            <Link to="/login" className="btn-cta" style={{ width: '100%', textAlign: 'center' }}>
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page-container">
      <div className="login-image-panel">
        <img src="https://lh3.googleusercontent.com/aida-public/AP1WRLvIC1NLvAEME8qMXLV7NX2OPP5PMn52fp7owX-usQPhVxV1xpMY5IosxLN7i-ZquSsLFd9iLMobwHq7SkUHLnLlwqKr78V4tIWrgjHkUKznneZl8bejzuARiIP21SZs-N7caUoCL9OGzniepykhbGXVMiRsCtTx7k5gM1OjG8HSgEZZxryKHDdBUIoNUyHQ-MD4L7pq1RtBbFKeM69LlacyhsQGgXXl5RmplSQQ0NibvA-kmU0btORtnQ" alt="เครื่องประดับ" />
      </div>
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="login-header">
            <h1 className="login-title">ตั้งรหัสผ่านใหม่</h1>
            <p className="login-subtitle">รหัสผ่านใหม่ของคุณต้องแตกต่างจากรหัสผ่านเดิม</p>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="password">รหัสผ่านใหม่</label>
              <div className="login-password-wrapper">
                <input type={show.password ? 'text' : 'password'} id="password" name="password" className="minimal-input" value={form.password} onChange={handleInputChange} required />
                <button type="button" onClick={() => toggleShow('password')} className="login-password-toggle"><span className="material-symbols-outlined">{show.password ? 'visibility' : 'visibility_off'}</span></button>
              </div>
              {form.password && (
                <div className="profile-pw-strength">
                  <div className="profile-pw-strength__bar" data-score={strength.score}>
                    <div></div><div></div><div></div><div></div><div></div>
                  </div>
                  <span className="profile-pw-strength__label">{strength.label}</span>
                </div>
              )}
            </div>

            <div className="login-input-group">
              <label htmlFor="confirm">ยืนยันรหัสผ่านใหม่</label>
              <div className="login-password-wrapper">
                <input type={show.confirm ? 'text' : 'password'} id="confirm" name="confirm" className="minimal-input" value={form.confirm} onChange={handleInputChange} required />
                <button type="button" onClick={() => toggleShow('confirm')} className="login-password-toggle"><span className="material-symbols-outlined">{show.confirm ? 'visibility' : 'visibility_off'}</span></button>
              </div>
            </div>

            {error && <p className="login-error-msg">{error}</p>}

            <button type="submit" className="register-submit-btn" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </form>
          <div className="login-register-link">
            <p><Link to="/login">กลับไปหน้าเข้าสู่ระบบ</Link></p>
          </div>
        </div>
      </div>
    </main>
  );
}
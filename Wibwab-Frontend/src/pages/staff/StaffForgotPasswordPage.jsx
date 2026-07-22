// pages/staff/StaffForgotPasswordPage.jsx — ลืมรหัสผ่านพนักงาน ยืนยันตัวตนด้วยรหัส OTP ที่ส่งไปทางอีเมลจริง
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestStaffOtp, resetStaffPasswordWithOtp } from '../../api/staffAuth.api';
import '../../styles/staff.css';

export default function StaffForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' -> 'otp' -> 'done'
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('กรุณากรอกอีเมล');

    setLoading(true);
    try {
      const res = await requestStaffOtp(email.trim());
      setInfo(res.data.message);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'ส่งรหัส OTP ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');

    if (!otpCode.trim()) return setError('กรุณากรอกรหัส OTP');
    if (newPassword.length < 8) return setError('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร');
    if (newPassword !== confirmPassword) return setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');

    setLoading(true);
    try {
      await resetStaffPasswordWithOtp({ email: email.trim(), otp_code: otpCode.trim(), new_password: newPassword });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="staff-app staff-login">
      <div className="staff-login__card">
        <div className="staff-login__brand">
          <div className="staff-login__logo">ว</div>
          <h1>วิบวับ</h1>
          <p>ลืมรหัสผ่านพนักงาน</p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="staff-login__form">
            <p style={{ color: 'var(--staff-text-muted)', fontSize: 14, margin: 0 }}>
              กรอกอีเมลของบัญชีพนักงาน ระบบจะส่งรหัส OTP 6 หลักไปยืนยันตัวตนทางอีเมล
            </p>
            <div className="staff-form-group">
              <label className="staff-form-label" htmlFor="email">อีเมล</label>
              <input
                id="email"
                type="email"
                className="staff-form-control"
                placeholder="staff@wibwab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            {error && <p className="staff-login__error">{error}</p>}

            <button type="submit" className="staff-btn staff-btn--primary staff-login__submit" disabled={loading}>
              {loading ? 'กำลังส่งรหัส OTP...' : 'ส่งรหัส OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleReset} className="staff-login__form">
            {info && <p style={{ color: 'var(--staff-success-text)', fontSize: 14, margin: 0 }}>{info}</p>}

            <div className="staff-form-group">
              <label className="staff-form-label" htmlFor="otp">รหัส OTP</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="staff-form-control"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label" htmlFor="new-password">รหัสผ่านใหม่</label>
              <input
                id="new-password"
                type="password"
                className="staff-form-control"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label" htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</label>
              <input
                id="confirm-password"
                type="password"
                className="staff-form-control"
                placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {error && <p className="staff-login__error">{error}</p>}

            <button type="submit" className="staff-btn staff-btn--primary staff-login__submit" disabled={loading}>
              {loading ? 'กำลังรีเซ็ตรหัสผ่าน...' : 'ยืนยันรีเซ็ตรหัสผ่าน'}
            </button>

            <p className="staff-login__hint" style={{ textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--staff-primary)', fontWeight: 600 }}
                onClick={() => {
                  setStep('email');
                  setOtpCode('');
                  setError('');
                  setInfo('');
                }}
              >
                ยังไม่ได้รับรหัส? ส่งใหม่อีกครั้ง
              </button>
            </p>
          </form>
        )}

        {step === 'done' && (
          <div className="staff-login__form">
            <p style={{ color: 'var(--staff-success-text)' }}>
              ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
            </p>
            <button
              type="button"
              className="staff-btn staff-btn--primary staff-login__submit"
              onClick={() => navigate('/staff/login')}
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        )}

        {step !== 'done' && <Link to="/staff/login" className="staff-login__back">← กลับไปหน้าเข้าสู่ระบบ</Link>}
      </div>
    </div>
  );
}

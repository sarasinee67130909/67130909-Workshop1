// pages/admin/AdminForgotPasswordPage.jsx — ลืมรหัสผ่านผู้บริหาร ยืนยันตัวตนด้วยรหัส OTP ที่ส่งไปทางอีเมลจริง
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestAdminOtp, resetAdminPasswordWithOtp } from '../../api/adminAuth.api';
import '../../styles/admin.css';

export default function AdminForgotPasswordPage() {
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
      const res = await requestAdminOtp(email.trim());
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
      await resetAdminPasswordWithOtp({ email: email.trim(), otp_code: otpCode.trim(), new_password: newPassword });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-app admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>lock_reset</span>
        </div>
        <h1 className="admin-login__title">ลืมรหัสผ่าน</h1>

        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="admin-login__form">
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, marginTop: 0 }}>
              กรอกอีเมลของบัญชีผู้บริหาร ระบบจะส่งรหัส OTP 6 หลักไปยืนยันตัวตนทางอีเมล
            </p>
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="email">อีเมล</label>
              <div className="admin-input-wrap">
                <span className="material-symbols-outlined">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="manager@wibwab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {error && <p className="admin-login__error">{error}</p>}

            <button type="submit" className="admin-btn admin-btn--primary admin-login__submit" disabled={loading}>
              {loading ? 'กำลังส่งรหัส OTP...' : 'ส่งรหัส OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleReset} className="admin-login__form">
            {info && (
              <p style={{ color: 'var(--admin-success-text)', fontSize: 14, marginTop: 0 }}>{info}</p>
            )}
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="otp">รหัส OTP</label>
              <div className="admin-input-wrap">
                <span className="material-symbols-outlined">pin</span>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="new-password">รหัสผ่านใหม่</label>
              <div className="admin-input-wrap">
                <span className="material-symbols-outlined">lock</span>
                <input
                  id="new-password"
                  type="password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</label>
              <div className="admin-input-wrap">
                <span className="material-symbols-outlined">lock</span>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {error && <p className="admin-login__error">{error}</p>}

            <button type="submit" className="admin-btn admin-btn--primary admin-login__submit" disabled={loading}>
              {loading ? 'กำลังรีเซ็ตรหัสผ่าน...' : 'ยืนยันรีเซ็ตรหัสผ่าน'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                type="button"
                className="admin-form-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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
          <div className="admin-login__form">
            <p style={{ color: 'var(--admin-success-text)' }}>
              ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
            </p>
            <button
              type="button"
              className="admin-btn admin-btn--primary admin-login__submit"
              onClick={() => navigate('/admin/login')}
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        )}

        {step !== 'done' && (
          <div className="admin-login__footer">
            <p><Link to="/admin/login">← กลับไปหน้าเข้าสู่ระบบ</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}

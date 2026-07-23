// pages/customer/LoginPage.jsx — หน้าเข้าสู่ระบบ (แปลงจากดีไซน์ + ต่อ API จริง)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth as useAuth } from '../../context/CustomerAuthContext';

export default function LoginPage() {
  const { login, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [staffAttempt, setStaffAttempt] = useState(false); // พนักงานพยายาม login ผิดหน้า
  const [loading, setLoading] = useState(false);

  // ถ้าล็อกอินอยู่แล้ว ให้ redirect ออกจากหน้านี้
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStaffAttempt(false);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        // หน้านี้เป็นประตูของ "ลูกค้า" เท่านั้น — ระบบล็อกอินแยกตาม role
        // พนักงาน/แอดมินต้องใช้หน้า /staff/login ของตัวเอง (ระบบของ Dev2)
        if (res.data.user.role !== 'customer') {
          logout(); // ไม่เก็บ session ที่ล็อกอินผิดประตู
          setStaffAttempt(true);
          setError('บัญชีนี้เป็นบัญชีพนักงาน/ผู้ดูแลระบบ กรุณาเข้าสู่ระบบผ่านหน้าสำหรับพนักงาน');
          return;
        }
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        // แสดง error message จาก server
        setError(res.message || 'เกิดข้อผิดพลาดบางอย่าง');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'การเชื่อมต่อล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page-container">
      {/* ฝั่งซ้าย: รูปภาพ (ซ่อนบนมือถือ) */}
      <div className="login-image-panel">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmnT4JhVtDJWm6uvannaj6feUuYyB-4WzeKurvoVV10Z89fRKIO-_HRTOd1zqFOJx5UBh7FtjeTnq0NTM0DQVjTCLNGr1h3vqIxJKpfwYFL9OKE_rA1qlD3AFvopk_pi75vuzvUclAprAavEiKO01cOQwDe5JCGEY9uMhXzl0yYk5658DSIFtZZ36d0vspV_v0SwGBiP4gHhD4YaZYM8dR3EexVlHn6qXoZSE_2tcmkx6cO-Kob74XBtMM1MOrqw9NH0ISMyTVUT4"
          alt="นางแบบสวมเครื่องประดับ"
        />
      </div>

      {/* ฝั่งขวา: ฟอร์มล็อกอิน */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="login-header">
            <h1 className="login-title">ยินดีต้อนรับกลับมา</h1>
            <p className="login-subtitle">เข้าสู่ระบบเพื่อช้อปปิงต่อ</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="email">อีเมล</label>
              <input
                type="email"
                id="email"
                className="minimal-input"
                placeholder="กรอกอีเมลของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="password">รหัสผ่าน</label>
              <div className="login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="minimal-input"
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="login-password-toggle">
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {error && <p className="login-error-msg">{error}</p>}
            {staffAttempt && (
              <p className="login-staff-link">
                <Link to="/staff/login">ไปหน้าเข้าสู่ระบบพนักงาน →</Link>
              </p>
            )}

            <div className="login-options">
              <label className="login-remember-me">
                <input type="checkbox" />
                <span>จดจำฉัน</span>
              </label>
              <Link to="/forgot-password">ลืมรหัสผ่าน?</Link>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="login-register-link">
            <p>
              ยังไม่มีบัญชี? <Link to="/register">สร้างบัญชีใหม่</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
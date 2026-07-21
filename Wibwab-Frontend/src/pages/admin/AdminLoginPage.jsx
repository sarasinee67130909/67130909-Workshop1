// pages/admin/AdminLoginPage.jsx — หน้าเข้าสู่ระบบแอดมิน (โครงเดียวกับ StaffLoginPage ต่อ API จริงผ่าน AuthContext)
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth as useAuth } from '../../context/AdminAuthContext';
import '../../styles/admin.css';

export default function AdminLoginPage() {
  const { login, logout, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [wrongPortal, setWrongPortal] = useState(''); // ล็อกอินถูก แต่ผิดประตู (role ไม่ใช่ admin)
  const [loading, setLoading] = useState(false);

  // ถ้าล็อกอินเป็น admin อยู่แล้ว ให้ redirect ออกจากหน้านี้ทันที
  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isLoggedIn, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setWrongPortal('');

    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        // หน้านี้เป็นประตูของ "แอดมิน/ผู้บริหาร" เท่านั้น — role อื่นต้องใช้ประตูของตัวเอง
        if (res.data.user.role !== 'admin') {
          const role = res.data.user.role;
          logout(); // ไม่เก็บ session ที่ล็อกอินผิดประตู
          if (role === 'customer') {
            setWrongPortal('customer');
            setError('บัญชีนี้เป็นบัญชีลูกค้า กรุณาเข้าสู่ระบบผ่านหน้าลูกค้า');
          } else {
            setWrongPortal('staff');
            setError('บัญชีนี้เป็นบัญชีพนักงาน กรุณาเข้าสู่ระบบผ่านหน้าสำหรับพนักงาน');
          }
          return;
        }
        const from = location.state?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'เกิดข้อผิดพลาดบางอย่าง');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-app admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>diamond</span>
        </div>
        <h1 className="admin-login__title">เข้าสู่ระบบผู้บริหาร</h1>

        <form onSubmit={handleSubmit} className="admin-login__form">
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

          <div className="admin-form-group">
            <div className="admin-form-label-row">
              <label className="admin-form-label" htmlFor="password">รหัสผ่าน</label>
              <Link to="#" className="admin-form-link">ลืมรหัสผ่าน?</Link>
            </div>
            <div className="admin-input-wrap">
              <span className="material-symbols-outlined">lock</span>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="admin-login__remember">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember">จดจำฉันไว้</label>
          </div>

          {error && <p className="admin-login__error">{error}</p>}

          {wrongPortal === 'customer' && (
            <p className="admin-login__hint">
              <Link to="/login">ไปหน้าเข้าสู่ระบบลูกค้า →</Link>
            </p>
          )}
          {wrongPortal === 'staff' && (
            <p className="admin-login__hint">
              <Link to="/staff/login">ไปหน้าเข้าสู่ระบบพนักงาน →</Link>
            </p>
          )}

          <button type="submit" className="admin-btn admin-btn--primary admin-login__submit" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
          </button>
        </form>

        <div className="admin-login__footer">
          <p>ต้องการสิทธิ์เข้าถึง? <a href="#">ติดต่อฝ่าย IT Support</a></p>
        </div>
      </div>
    </div>
  );
}

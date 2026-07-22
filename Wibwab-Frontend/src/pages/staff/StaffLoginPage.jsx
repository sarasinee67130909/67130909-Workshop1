// pages/staff/StaffLoginPage.jsx — หน้าเข้าสู่ระบบพนักงาน (ต่อ API จริงผ่าน AuthContext)
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStaffAuth as useAuth } from '../../context/StaffAuthContext';
import '../../styles/staff.css';

export default function StaffLoginPage() {
  const { login, logout, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [wrongPortal, setWrongPortal] = useState(''); // ล็อกอินถูก แต่ผิดประตู (role ไม่ใช่ staff)
  const [loading, setLoading] = useState(false);

  // ถ้าล็อกอินเป็น staff อยู่แล้ว ให้ redirect ออกจากหน้านี้ทันที
  useEffect(() => {
    if (isLoggedIn && user?.role === 'staff') {
      navigate('/staff/dashboard', { replace: true });
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
        // หน้านี้เป็นประตูของ "พนักงาน" เท่านั้น — ลูกค้า/แอดมินต้องใช้หน้าประตูของตัวเอง
        if (res.data.user.role !== 'staff') {
          const role = res.data.user.role;
          logout(); // ไม่เก็บ session ที่ล็อกอินผิดประตู
          if (role === 'customer') {
            setWrongPortal('customer');
            setError('บัญชีนี้เป็นบัญชีลูกค้า กรุณาเข้าสู่ระบบผ่านหน้าลูกค้า');
          } else {
            setWrongPortal('admin');
            setError('บัญชีนี้เป็นบัญชีผู้ดูแลระบบ กรุณาเข้าสู่ระบบผ่านหน้าสำหรับแอดมิน');
          }
          return;
        }
        const from = location.state?.from?.pathname || '/staff/dashboard';
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
    <div className="staff-app staff-login">
      <div className="staff-login__card">
        <div className="staff-login__brand">
          <div className="staff-login__logo">ว</div>
          <h1>วิบวับ</h1>
          <p>ระบบพนักงาน</p>
        </div>

        <form onSubmit={handleSubmit} className="staff-login__form">
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

          <div className="staff-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="staff-form-label" htmlFor="password">รหัสผ่าน</label>
              <Link to="/staff/forgot-password" style={{ fontSize: 13, color: 'var(--staff-primary)' }}>
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="staff-form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="staff-login__error">{error}</p>}

          {wrongPortal === 'customer' && (
            <p className="staff-login__hint">
              <Link to="/login">ไปหน้าเข้าสู่ระบบลูกค้า →</Link>
            </p>
          )}
          {wrongPortal === 'admin' && (
            <p className="staff-login__hint">
              <Link to="/admin/login">ไปหน้าเข้าสู่ระบบแอดมิน →</Link>
            </p>
          )}

          <button type="submit" className="staff-btn staff-btn--primary staff-login__submit" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <Link to="/" className="staff-login__back">← กลับหน้าลูกค้า</Link>
      </div>
    </div>
  );
}

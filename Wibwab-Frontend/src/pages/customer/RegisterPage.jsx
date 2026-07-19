// pages/customer/RegisterPage.jsx — หน้าสมัครสมาชิก (แปลงจากดีไซน์ + ต่อ API จริง)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const initialFormState = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const { register, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ถ้าล็อกอินอยู่แล้ว ให้ redirect ออก
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // เก็บไซซ์ที่เลือกเป็น object { ring, bracelet } ใน localStorage — ไม่ส่งไป backend
  // TODO: ยังไม่มีคอลัมน์ใน schema — คุยทีมก่อนถ้าจะเก็บใน DB จริง
  const handleSizeChange = (e) => {
    const { name, value } = e.target;
    let pref = {};
    try {
      pref = JSON.parse(localStorage.getItem('wibwab_size_pref')) || {};
    } catch {
      pref = {};
    }
    pref[name === 'ring_size' ? 'ring' : 'bracelet'] = value;
    localStorage.setItem('wibwab_size_pref', JSON.stringify(pref));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = 'กรุณากรอกชื่อ-นามสกุล';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (form.password.length < 8) newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone: form.phone,
      });

      if (res.success) {
        navigate('/'); // สมัครสำเร็จ = ล็อกอิน + ไปหน้าแรก
      } else {
        setServerError(res.message || 'เกิดข้อผิดพลาดในการสมัคร');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'การเชื่อมต่อล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  const getFieldClass = (fieldName) =>
    `register-field ${errors[fieldName] ? 'register-field--error' : ''}`;

  return (
    <main className="login-page-container">
      {/* ฝั่งซ้าย: รูปภาพ (เหมือนหน้า Login) */}
      <div className="login-image-panel">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmnT4JhVtDJWm6uvannaj6feUuYyB-4WzeKurvoVV10Z89fRKIO-_HRTOd1zqFOJx5UBh7FtjeTnq0NTM0DQVjTCLNGr1h3vqIxJKpfwYFL9OKE_rA1qlD3AFvopk_pi75vuzvUclAprAavEiKO01cOQwDe5JCGEY9uMhXzl0yYk5658DSIFtZZ36d0vspV_v0SwGBiP4gHhD4YaZYM8dR3EexVlHn6qXoZSE_2tcmkx6cO-Kob74XBtMM1MOrqw9NH0ISMyTVUT4"
          alt="นางแบบสวมเครื่องประดับวิบวับ"
        />
      </div>

      {/* ฝั่งขวา: ฟอร์มสมัครสมาชิก */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="login-header">
            <h1 className="login-title">สร้างบัญชีของคุณ</h1>
            <p className="login-subtitle">ร่วมเป็นสมาชิกและเริ่มสะสมเครื่องประดับกับวิบวับ</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className={getFieldClass('full_name')}>
              <label htmlFor="full_name">ชื่อ-นามสกุล</label>
              <input type="text" id="full_name" name="full_name" className="minimal-input" onChange={handleInputChange} />
              {errors.full_name && <span className="register-field__error-msg">{errors.full_name}</span>}
            </div>

            <div className={getFieldClass('email')}>
              <label htmlFor="email">อีเมล</label>
              <input type="email" id="email" name="email" className="minimal-input" onChange={handleInputChange} />
              {errors.email && <span className="register-field__error-msg">{errors.email}</span>}
            </div>

            <div className={getFieldClass('phone')}>
              <label htmlFor="phone">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
              <input type="tel" id="phone" name="phone" className="minimal-input" onChange={handleInputChange} />
            </div>

            <div className={getFieldClass('password')}>
              <label htmlFor="password">รหัสผ่าน</label>
              <div className="login-password-wrapper">
                <input type={showPassword ? 'text' : 'password'} id="password" name="password" className="minimal-input" placeholder="อย่างน้อย 8 ตัวอักษร" onChange={handleInputChange} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="login-password-toggle">
                  <span className="material-symbols-outlined">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
              {errors.password && <span className="register-field__error-msg">{errors.password}</span>}
            </div>

            <div className={getFieldClass('confirmPassword')}>
              <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
              <div className="login-password-wrapper">
                <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" className="minimal-input" onChange={handleInputChange} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="login-password-toggle">
                  <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
              {errors.confirmPassword && <span className="register-field__error-msg">{errors.confirmPassword}</span>}
            </div>

            <div className="register-field">
              <label>ไซซ์ของคุณ (ไม่บังคับ)</label>
              <p className="register-size-hint">เราจะใช้แนะนำไซซ์ที่พอดีสำหรับคุณ</p>
              {/* ดีไซน์กำหนด 2 ช่องคู่กัน: ไซซ์แหวน + ไซซ์กำไล */}
              <div className="register-size-row">
                <div className="register-size-col">
                  <label htmlFor="ring_size">ไซซ์แหวน</label>
                  <div className="register-select-wrapper">
                    <select id="ring_size" name="ring_size" className="minimal-input" onChange={handleSizeChange}>
                      <option value="">เลือก</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  </div>
                </div>
                <div className="register-size-col">
                  <label htmlFor="bracelet_size">ไซซ์กำไล</label>
                  <div className="register-select-wrapper">
                    <select id="bracelet_size" name="bracelet_size" className="minimal-input" onChange={handleSizeChange}>
                      <option value="">เลือก</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {serverError && <p className="login-error-msg">{serverError}</p>}

            <div className="register-terms">
              <label>
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                <span>
                  ฉันยอมรับ<Link to="/terms">ข้อกำหนดการใช้งาน</Link>และ<Link to="/privacy">นโยบายความเป็นส่วนตัว</Link>
                </span>
              </label>
            </div>

            <button type="submit" className="register-submit-btn" disabled={loading || !agreedToTerms}>
              {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
            </button>
          </form>

          <div className="login-register-link">
            <p>
              มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
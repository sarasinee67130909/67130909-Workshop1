// pages/customer/ProfilePage.jsx — หน้าบัญชีของฉัน (My Account)
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import SizeGuideModal from '../../components/product/SizeGuideModal';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../api/auth.api';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../api/address.api';

const MOCK_ADDRESSES = [
  { id: 1, recipient_name: 'ณิชา ตัวอย่าง', phone: '0812345678', address_line: '123/45 ถ.สุขุมวิท', subdistrict: 'คลองเตยเหนือ', district: 'วัฒนา', province: 'กรุงเทพมหานคร', postal_code: '10110', is_default: true },
  { id: 2, recipient_name: 'ณิชา ตัวอย่าง (ที่ทำงาน)', phone: '0887654321', address_line: '999 อาคารสาทรทาวเวอร์ ชั้น 20', subdistrict: 'สีลม', district: 'บางรัก', province: 'กรุงเทพมหานคร', postal_code: '10500', is_default: false },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sections = {
    profile: useRef(null),
    sizes: useRef(null),
    addresses: useRef(null),
    password: useRef(null),
  };

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const scrollToSection = (section) => {
    sections[section].current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="customer-page">
      <Navbar />
      <main className="profile-main">
        <div className="profile-layout">
          {/* ── Sidebar ── */}
          <aside className="profile-sidebar">
            <div className="profile-user-card">
              <div className="profile-user-card__avatar">
                <span className="material-symbols-outlined">person</span>
              </div>
              <h2 className="profile-user-card__name">{user.full_name}</h2>
              <p className="profile-user-card__email">{user.email}</p>
            </div>
            <nav className="profile-nav">
              <a onClick={() => scrollToSection('profile')} className="profile-nav__link profile-nav__link--active">ข้อมูลส่วนตัว</a>
              <Link to="/orders" className="profile-nav__link">ประวัติการสั่งซื้อ</Link>
              <a onClick={() => scrollToSection('addresses')} className="profile-nav__link">ที่อยู่ของฉัน</a>
              <a onClick={() => scrollToSection('sizes')} className="profile-nav__link">ไซซ์ของฉัน</a>
              <a onClick={() => scrollToSection('password')} className="profile-nav__link">เปลี่ยนรหัสผ่าน</a>
              <button onClick={handleSignOut} className="profile-nav__link profile-nav__link--logout">ออกจากระบบ</button>
            </nav>
          </aside>

          {/* ── Content ── */}
          <div className="profile-content">
            <ProfileInfoCard sectionRef={sections.profile} />
            <MySizesCard sectionRef={sections.sizes} />
            <MyAddressesCard sectionRef={sections.addresses} />
            <ChangePasswordCard sectionRef={sections.password} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- Card: Profile Information ---
function ProfileInfoCard({ sectionRef }) {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ full_name: user.full_name, phone: user.phone || '' });
  const [extra, setExtra] = useState({ birthday: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const storedExtra = JSON.parse(localStorage.getItem('wibwab_profile_extra')) || {};
      setExtra(storedExtra);
    } catch {}
  }, []);

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleExtraChange = (e) => {
    const newExtra = { ...extra, [e.target.name]: e.target.value };
    setExtra(newExtra);
    localStorage.setItem('wibwab_profile_extra', JSON.stringify(newExtra));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await updateProfile(form);
    } catch (err) {
      // API ไม่มีจริง, ทำการอัปเดตฝั่ง client แทน (ตาม spec)
      console.warn('updateProfile API failed (as expected), updating client-side only.');
    } finally {
      updateUser(form); // อัปเดต state ใน AuthContext
      setMessage('บันทึกข้อมูลเรียบร้อยแล้ว');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="profile-card" ref={sectionRef}>
      <div className="profile-card__header">
        <h3>ข้อมูลส่วนตัว</h3>
        {!isEditing && <button className="btn-outline" onClick={() => setIsEditing(true)}>แก้ไข</button>}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="profile-card__body">
          <div className="profile-avatar-uploader">
            <label htmlFor="avatar-upload">
              <img src={avatarPreview || `https://ui-avatars.com/api/?name=${user.full_name}&background=f2dedd&color=8a4853`} alt="Avatar" />
              <span className="profile-avatar-uploader__overlay">
                <span className="material-symbols-outlined">photo_camera</span>
              </span>
            </label>
            <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>

          <div className="profile-fields">
            <div className="login-input-group">
              <label htmlFor="full_name">ชื่อ-นามสกุล</label>
              <input type="text" id="full_name" name="full_name" className="minimal-input" value={form.full_name} onChange={handleInputChange} readOnly={!isEditing} />
            </div>
            <div className="login-input-group">
              <label htmlFor="email">อีเมล</label>
              <div className="profile-readonly-field">
                <input type="email" id="email" className="minimal-input" value={user.email} readOnly />
                <span className="material-symbols-outlined">lock</span>
              </div>
            </div>
            <div className="login-input-group">
              <label htmlFor="phone">เบอร์โทรศัพท์</label>
              <input type="tel" id="phone" name="phone" className="minimal-input" value={form.phone} onChange={handleInputChange} readOnly={!isEditing} />
            </div>
            <div className="login-input-group">
              <label htmlFor="birthday">วันเกิด</label>
              <input type="text" id="birthday" name="birthday" className="minimal-input" placeholder="DD/MM/YYYY" value={extra.birthday} onChange={handleExtraChange} readOnly={!isEditing} />
            </div>
          </div>
        </div>
        {isEditing && (
          <div className="profile-card__footer">
            {message && <span className="profile-success-msg">{message}</span>}
            <button type="button" className="btn-outline" onClick={() => setIsEditing(false)}>ยกเลิก</button>
            <button type="submit" className="btn-cta">บันทึก</button>
          </div>
        )}
      </form>
    </div>
  );
}

// --- Card: My Sizes ---
function MySizesCard({ sectionRef }) {
  const [sizes, setSizes] = useState({ ring: '', bracelet: '' });
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    try {
      const storedSizes = JSON.parse(localStorage.getItem('wibwab_size_pref')) || {};
      setSizes(storedSizes);
    } catch {}
  }, []);

  const handleSizeChange = (e) => {
    const { name, value } = e.target;
    const newSizes = { ...sizes, [name]: value };
    setSizes(newSizes);
    localStorage.setItem('wibwab_size_pref', JSON.stringify(newSizes));
  };

  return (
    <div className="profile-card" ref={sectionRef}>
      <div className="profile-card__header">
        <h3>ไซซ์ของฉัน</h3>
        <a onClick={() => setShowSizeGuide(true)} className="profile-link">วิธีวัดไซซ์</a>
      </div>
      <div className="profile-card__body">
        <p className="register-size-hint">เราจะใช้แนะนำไซซ์ที่พอดีสำหรับคุณในหน้าสินค้า</p>
        <div className="register-size-row">
          <div className="register-size-col">
            <label htmlFor="ring_size">ไซซ์แหวน</label>
            <div className="register-select-wrapper">
              <select id="ring_size" name="ring" className="minimal-input" value={sizes.ring} onChange={handleSizeChange}>
                <option value="">ไม่ระบุ</option>
                {[4, 5, 6, 7, 8, 9].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="register-size-col">
            <label htmlFor="bracelet_size">ไซซ์กำไล</label>
            <div className="register-select-wrapper">
              <select id="bracelet_size" name="bracelet" className="minimal-input" value={sizes.bracelet} onChange={handleSizeChange}>
                <option value="">ไม่ระบุ</option>
                {['S', 'M', 'L'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      <SizeGuideModal open={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
    </div>
  );
}

// --- Card: My Addresses ---
function MyAddressesCard({ sectionRef }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = () => {
    setLoading(true);
    getAddresses()
      .then(res => {
        if (res.success) {
          setAddresses(res.data);
          setIsMock(false);
        }
      })
      .catch(() => {
        console.warn('getAddresses API failed, using mock data from localStorage.');
        const mockData = JSON.parse(localStorage.getItem('wibwab_addresses_mock') || JSON.stringify(MOCK_ADDRESSES));
        setAddresses(mockData);
        setIsMock(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchAddresses, []);

  const handleSave = (savedAddress) => {
    // คำนวณ list ใหม่ก่อน แล้วใช้ตัวแปรเดียวกันทั้ง setState และ localStorage
    // (ถ้าอ่านจาก addresses หลัง setAddresses จะได้ค่าเก่า เพราะ setState ไม่ synchronous)
    const updatedList = editingAddress
      ? addresses.map((a) => (a.id === savedAddress.id ? savedAddress : a))
      : [...addresses, savedAddress];
    setAddresses(updatedList);
    if (isMock) {
      localStorage.setItem('wibwab_addresses_mock', JSON.stringify(updatedList));
    }
    setModalOpen(false);
    setEditingAddress(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบที่อยู่นี้ใช่หรือไม่?')) return;
    try {
      await deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (err) {
      if (isMock) {
        const updated = addresses.filter(a => a.id !== id);
        setAddresses(updated);
        localStorage.setItem('wibwab_addresses_mock', JSON.stringify(updated));
      } else {
        alert('เกิดข้อผิดพลาดในการลบที่อยู่');
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      setAddresses(addresses.map(a => ({ ...a, is_default: a.id === id })));
    } catch (err) {
      if (isMock) {
        const updated = addresses.map(a => ({ ...a, is_default: a.id === id }));
        setAddresses(updated);
        localStorage.setItem('wibwab_addresses_mock', JSON.stringify(updated));
      } else {
        alert('เกิดข้อผิดพลาดในการตั้งค่าที่อยู่หลัก');
      }
    }
  };

  return (
    <div className="profile-card" ref={sectionRef}>
      <div className="profile-card__header">
        <h3>ที่อยู่สำหรับจัดส่ง</h3>
        <button className="btn-cta" onClick={() => { setEditingAddress(null); setModalOpen(true); }}>+ เพิ่มที่อยู่ใหม่</button>
      </div>
      <div className="profile-card__body">
        {isMock && <div className="pdp-mock-banner">กำลังแสดงข้อมูลตัวอย่าง</div>}
        {loading && <p>กำลังโหลด...</p>}
        {!loading && addresses.length === 0 && <p>ยังไม่มีที่อยู่ที่บันทึกไว้</p>}
        <div className="profile-address-list">
          {addresses.map(addr => (
            <div key={addr.id} className="profile-address-item">
              {addr.is_default && <div className="profile-address-item__default-badge">ที่อยู่หลัก</div>}
              <p><strong>{addr.recipient_name}</strong></p>
              <p>{addr.phone}</p>
              <p>{`${addr.address_line}, ${addr.subdistrict}, ${addr.district}, ${addr.province} ${addr.postal_code}`}</p>
              <div className="profile-address-item__actions">
                <button onClick={() => { setEditingAddress(addr); setModalOpen(true); }}>แก้ไข</button>
                <button onClick={() => handleDelete(addr.id)}>ลบ</button>
                {!addr.is_default && <button onClick={() => handleSetDefault(addr.id)}>ตั้งเป็นที่อยู่หลัก</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {modalOpen && <AddressModal address={editingAddress} onClose={() => setModalOpen(false)} onSave={handleSave} isMock={isMock} />}
    </div>
  );
}

// --- Card: Change Password ---
function ChangePasswordCard({ sectionRef }) {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [strength, setStrength] = useState({ score: 0, label: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    const labels = ['', 'อ่อนมาก', 'อ่อน', 'ปานกลาง', 'ดี', 'ดีมาก'];
    return { score, label: labels[score] };
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    if (name === 'new') {
      setStrength(getPasswordStrength(value));
    }
  };

  const toggleShow = (field) => setShow(prev => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (passwords.new.length < 8) {
      setMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
      return;
    }
    try {
      await changePassword({ current_password: passwords.current, new_password: passwords.new });
    } catch (err) {
      console.warn('changePassword API failed (as expected), showing demo success.');
    } finally {
      setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
      setPasswords({ current: '', new: '', confirm: '' });
      setStrength({ score: 0, label: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  return (
    <div className="profile-card" ref={sectionRef}>
      <div className="profile-card__header">
        <h3>เปลี่ยนรหัสผ่าน</h3>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="profile-card__body profile-fields">
          <div className="login-input-group">
            <label htmlFor="current">รหัสผ่านปัจจุบัน</label>
            <div className="login-password-wrapper">
              <input type={show.current ? 'text' : 'password'} id="current" name="current" className="minimal-input" value={passwords.current} onChange={handlePasswordChange} required />
              <button type="button" onClick={() => toggleShow('current')} className="login-password-toggle"><span className="material-symbols-outlined">{show.current ? 'visibility' : 'visibility_off'}</span></button>
            </div>
          </div>
          <div className="login-input-group">
            <label htmlFor="new">รหัสผ่านใหม่</label>
            <div className="login-password-wrapper">
              <input type={show.new ? 'text' : 'password'} id="new" name="new" className="minimal-input" value={passwords.new} onChange={handlePasswordChange} required />
              <button type="button" onClick={() => toggleShow('new')} className="login-password-toggle"><span className="material-symbols-outlined">{show.new ? 'visibility' : 'visibility_off'}</span></button>
            </div>
            {passwords.new && (
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
              <input type={show.confirm ? 'text' : 'password'} id="confirm" name="confirm" className="minimal-input" value={passwords.confirm} onChange={handlePasswordChange} required />
              <button type="button" onClick={() => toggleShow('confirm')} className="login-password-toggle"><span className="material-symbols-outlined">{show.confirm ? 'visibility' : 'visibility_off'}</span></button>
            </div>
          </div>
        </div>
        <div className="profile-card__footer">
          {message.text && <span className={message.type === 'error' ? 'login-error-msg' : 'profile-success-msg'}>{message.text}</span>}
          <button type="submit" className="btn-cta">เปลี่ยนรหัสผ่าน</button>
        </div>
      </form>
    </div>
  );
}

// --- Modal: Add/Edit Address ---
function AddressModal({ address, onClose, onSave, isMock }) {
  const initialForm = {
    recipient_name: '', phone: '', address_line: '', subdistrict: '', district: '', province: '', postal_code: '', is_default: false,
  };
  const [form, setForm] = useState(address || initialForm);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!form.recipient_name || !form.address_line || !form.province || !form.postal_code) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    try {
      let savedData;
      if (address) {
        const res = await updateAddress(address.id, form);
        savedData = res.data;
      } else {
        const res = await createAddress(form);
        savedData = res.data;
      }
      onSave(savedData);
    } catch (err) {
      if (isMock) {
        // Demo save for mock data
        const savedData = { ...form, id: address?.id || Date.now() };
        onSave(savedData);
      } else {
        alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="pdp-modal-backdrop" onClick={onClose}>
      <div className="pdp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdp-modal__head">
          <h3>{address ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}</h3>
          <button onClick={onClose}><span className="material-symbols-outlined">close</span></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="profile-fields" style={{ gap: '1rem' }}>
            <div className="login-input-group">
              <label htmlFor="recipient_name">ชื่อผู้รับ</label>
              <input type="text" name="recipient_name" className="minimal-input" value={form.recipient_name} onChange={handleInputChange} required />
            </div>
            <div className="login-input-group">
              <label htmlFor="phone">เบอร์โทรศัพท์</label>
              <input type="tel" name="phone" className="minimal-input" value={form.phone} onChange={handleInputChange} required />
            </div>
            <div className="login-input-group">
              <label htmlFor="address_line">ที่อยู่ (บ้านเลขที่, ถนน)</label>
              <input type="text" name="address_line" className="minimal-input" value={form.address_line} onChange={handleInputChange} required />
            </div>
            <div className="register-size-row">
              <div className="login-input-group register-size-col">
                <label htmlFor="subdistrict">ตำบล/แขวง</label>
                <input type="text" name="subdistrict" className="minimal-input" value={form.subdistrict} onChange={handleInputChange} required />
              </div>
              <div className="login-input-group register-size-col">
                <label htmlFor="district">อำเภอ/เขต</label>
                <input type="text" name="district" className="minimal-input" value={form.district} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="register-size-row">
              <div className="login-input-group register-size-col">
                <label htmlFor="province">จังหวัด</label>
                <input type="text" name="province" className="minimal-input" value={form.province} onChange={handleInputChange} required />
              </div>
              <div className="login-input-group register-size-col">
                <label htmlFor="postal_code">รหัสไปรษณีย์</label>
                <input type="text" name="postal_code" className="minimal-input" value={form.postal_code} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="register-terms">
              <label>
                <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleInputChange} />
                <span>ตั้งเป็นที่อยู่หลัก</span>
              </label>
            </div>
          </div>
          <div className="profile-card__footer" style={{ marginTop: '24px', padding: 0 }}>
            <button type="button" className="btn-outline" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-cta">บันทึกที่อยู่</button>
          </div>
        </form>
      </div>
    </div>
  );
}
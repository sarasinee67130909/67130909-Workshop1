import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth.api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // กู้คืน session จาก localStorage ตอนเปิดแอปครั้งแรก
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsRestoring(false);
  }, []);

  const login = async (email, password) => {
    const response = await apiLogin(email, password);
    if (response.success) {
      const { token: apiToken, user: apiUser } = response.data;
      // Key 'token' และ 'user' ต้องตรงกับที่กำหนดใน spec
      localStorage.setItem('token', apiToken);
      localStorage.setItem('user', JSON.stringify(apiUser));
      setToken(apiToken);
      setUser(apiUser);
    }
    return response; // ส่ง response กลับไปให้ component จัดการ (error/success)
  };

  const register = async (userData) => {
    const response = await apiRegister(userData);
    if (response.success) {
      const { token: apiToken, user: apiUser } = response.data;
      // สมัครสมาชิกสำเร็จ = ล็อกอินให้เลย
      localStorage.setItem('token', apiToken);
      localStorage.setItem('user', JSON.stringify(apiUser));
      setToken(apiToken);
      setUser(apiUser);
    }
    return response;
  };

  const logout = async () => {
    try {
      // แจ้ง backend ด้วย (เผื่ออนาคตทำ token blacklist/logging) — ไม่บล็อกการ logout ถ้า request ล้มเหลว
      await apiLogout();
    } catch (err) {
      // เพิกเฉย: ต่อให้เรียก backend ไม่สำเร็จ (เช่น token หมดอายุ/เน็ตหลุด) ก็ยัง logout ฝั่ง client ได้เสมอ
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  // อัปเดตข้อมูล user ใน state และ localStorage (ใช้หลังแก้โปรไฟล์สำเร็จ)
  const updateUser = (updatedUserData) => {
    setUser((prevUser) => {
      const newUser = { ...prevUser, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  };

  const value = {
    user,
    token,
    isLoggedIn: !!token,
    login,
    register,
    logout,
    updateUser,
  };

  // ยังไม่ render children จนกว่าจะกู้คืน session เสร็จ
  // เพื่อป้องกันการ redirect ผิดพลาดใน ProtectedRoute
  if (isRestoring) {
    return null; // หรือจะแสดงหน้า Loading กลางจอภาพก็ได้
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
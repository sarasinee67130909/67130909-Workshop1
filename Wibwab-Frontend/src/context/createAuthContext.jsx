// context/createAuthContext.js
// โรงงานสร้าง AuthContext แยกอิสระต่อ "ประตู" (portal) — ลูกค้า/พนักงาน/แอดมิน
//
// ปัญหาเดิม: ทั้ง 3 ฝั่งใช้ AuthContext ตัวเดียว เก็บ session ด้วย localStorage key
// คงที่แค่คู่เดียว ('token' / 'user') ทำให้ล็อกอินได้ทีละ 1 คนทั้งเว็บ
// พอสลับไปมาระหว่างฝั่ง หรือรีเฟรชหน้า จะเจอ session ของอีก role ทับอยู่ แล้วโดนเด้งออก
//
// ทางแก้: แต่ละ portal มี "storageKey" ของตัวเอง (เช่น wibwab_customer_auth,
// wibwab_staff_auth, wibwab_admin_auth) จึงล็อกอินพร้อมกันได้ทั้ง 3 role
// ในเบราว์เซอร์เดียว/แท็บเดียวกัน โดยไม่ทับ session กัน
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth.api';

/**
 * @param {string} storageKey - key ที่ใช้เก็บ session ใน localStorage ของ portal นี้โดยเฉพาะ
 * @param {string} expectedRole - role ที่อนุญาตให้ session นี้เก็บไว้ ('customer' | 'staff' | 'admin')
 */
export function createAuthContext(storageKey, expectedRole) {
  const AuthContext = createContext(null);

  function readStored() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { token: null, user: null };
      const parsed = JSON.parse(raw);
      return { token: parsed.token ?? null, user: parsed.user ?? null };
    } catch {
      return { token: null, user: null };
    }
  }

  function writeStored(token, user) {
    localStorage.setItem(storageKey, JSON.stringify({ token, user }));
  }

  function clearStored() {
    localStorage.removeItem(storageKey);
  }

  function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isRestoring, setIsRestoring] = useState(true);

    // กู้คืน session ของ "portal นี้เท่านั้น" ตอนเปิดแอปครั้งแรก
    useEffect(() => {
      const stored = readStored();
      if (stored.token && stored.user) {
        setToken(stored.token);
        setUser(stored.user);
      }
      setIsRestoring(false);
    }, []);

    const login = useCallback(async (email, password) => {
      const response = await apiLogin(email, password);
      if (response.success) {
        const { token: apiToken, user: apiUser } = response.data;
        // เก็บ session เฉพาะถ้า role ตรงกับ portal นี้ — กันบัญชีลูกค้ามาฝังอยู่ใน session ของ staff/admin
        if (apiUser.role === expectedRole) {
          writeStored(apiToken, apiUser);
          setToken(apiToken);
          setUser(apiUser);
        }
      }
      return response; // ส่ง response ทั้งก้อนกลับไป ให้หน้า login เช็ค role/แสดง error เอง
    }, []);

    const register = useCallback(async (userData) => {
      const response = await apiRegister(userData);
      if (response.success) {
        const { token: apiToken, user: apiUser } = response.data;
        if (apiUser.role === expectedRole) {
          writeStored(apiToken, apiUser);
          setToken(apiToken);
          setUser(apiUser);
        }
      }
      return response;
    }, []);

    const logout = useCallback(async () => {
      try {
        await apiLogout();
      } catch {
        // เพิกเฉย: ต่อให้เรียก backend ไม่สำเร็จ ก็ยัง logout ฝั่ง client ของ portal นี้ได้เสมอ
      } finally {
        clearStored();
        setToken(null);
        setUser(null);
      }
    }, []);

    const updateUser = useCallback((updatedUserData) => {
      setUser((prevUser) => {
        const newUser = { ...prevUser, ...updatedUserData };
        writeStored(token, newUser);
        return newUser;
      });
    }, [token]);

    const value = {
      user,
      token,
      isLoggedIn: !!token,
      login,
      register,
      logout,
      updateUser,
    };

    // ยังไม่ render children จนกว่าจะกู้คืน session เสร็จ กัน ProtectedRoute เด้งผิดพลาด
    if (isRestoring) {
      return null;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  function useAuthHook() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error(`useAuth (${expectedRole}) ต้องถูกเรียกภายใน Provider ของ portal นี้`);
    }
    return ctx;
  }

  return { AuthProvider, useAuth: useAuthHook, storageKey, expectedRole };
}

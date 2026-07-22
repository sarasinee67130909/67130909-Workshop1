// context/FavoritesContext.jsx — รายการโปรดของลูกค้า โหลดจาก backend ต่อผู้ใช้ที่ล็อกอิน (ไม่ใช้ localStorage)
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from './CustomerAuthContext';
import {
  getMyFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
} from '../api/favorite.api';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user, isLoggedIn } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [favorites, setFavorites] = useState([]); // [{ id, name, price, image_url, favorited_at }]
  const [loading, setLoading] = useState(false);

  // ผู้ใช้เปลี่ยน (ล็อกอิน/ล็อกเอาท์/สลับบัญชี) — โหลดรายการโปรดของบัญชีนั้นใหม่จาก server เสมอ
  useEffect(() => {
    if (!isLoggedIn) {
      setFavorites([]); // ล็อกเอาท์แล้ว → เคลียร์ในหน่วยความจำ (ไม่มี localStorage ให้ค้าง)
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMyFavorites()
      .then((res) => {
        if (!cancelled && res.success) setFavorites(res.data);
      })
      .catch((err) => console.error('Failed to fetch favorites:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id]);

  const isFavorited = useCallback(
    (productId) => favorites.some((f) => f.id === Number(productId)),
    [favorites]
  );

  // รอ backend ยืนยันก่อนค่อยอัปเดต UI (ไม่ optimistic) — ตรงกับ pattern เดิมของโปรเจกต์
  const toggleFavorite = useCallback(
    async (product) => {
      if (!isLoggedIn) {
        navigate('/login', { state: { from: location } });
        return;
      }
      const productId = Number(product.id);
      const wasFavorited = favorites.some((f) => f.id === productId);
      try {
        if (wasFavorited) {
          await apiRemoveFavorite(productId);
          setFavorites((prev) => prev.filter((f) => f.id !== productId));
        } else {
          await apiAddFavorite(productId);
          setFavorites((prev) => [
            ...prev,
            {
              id: productId,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
              favorited_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        alert(err.response?.data?.message || 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
      }
    },
    [favorites, isLoggedIn, navigate, location]
  );

  const value = useMemo(
    () => ({ favorites, loading, isFavorited, toggleFavorite }),
    [favorites, loading, isFavorited, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites ต้องใช้ภายใน <FavoritesProvider>');
  return ctx;
}

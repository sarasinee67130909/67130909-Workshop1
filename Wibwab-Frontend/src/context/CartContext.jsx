// context/CartContext.jsx — ตะกร้าสินค้าฝั่ง client เก็บใน localStorage (ยังไม่ sync กับ /api/cart)
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { validatePromoCode } from '../api/order.api';
import { useCustomerAuth } from './CustomerAuthContext';

// ตะกร้าแยกคีย์ตามผู้ใช้ที่ล็อกอิน — กันบัญชีลูกค้าคนอื่นเห็นตะกร้าของกันและกัน
function getStorageKey(userId) {
  return userId ? `wibwab_cart_user_${userId}` : 'wibwab_cart_guest';
}

// โหลดตะกร้าที่บันทึกไว้ (กัน JSON พังด้วย try/catch)
function loadSaved(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return {
      items: Array.isArray(saved?.items) ? saved.items : [],
      promo: saved?.promo ?? null,
    };
  } catch {
    return { items: [], promo: null };
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useCustomerAuth();
  const storageKey = getStorageKey(user?.id);

  const [items, setItems] = useState(() => loadSaved(storageKey).items);
  const [promo, setPromo] = useState(() => loadSaved(storageKey).promo);

  // ผู้ใช้เปลี่ยน (ล็อกอิน/ล็อกเอาท์/สลับบัญชี) — โหลดตะกร้าของคีย์ใหม่มาแทนที่ state ปัจจุบัน
  useEffect(() => {
    const saved = loadSaved(storageKey);
    setItems(saved.items);
    setPromo(saved.promo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // บันทึกทุกครั้งที่ตะกร้าเปลี่ยน — refresh หน้าแล้วของไม่หาย
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ items, promo }));
  }, [storageKey, items, promo]);

  // เพิ่มสินค้า (ถ้า variant เดิมมีอยู่แล้วให้บวกจำนวน) — ไม่ให้เกินสต็อก
  const addItem = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.variantId === item.variantId);
      if (existing) {
        return prev.map((it) =>
          it.variantId === item.variantId
            ? { ...it, qty: Math.min(it.qty + qty, it.stockQty) }
            : it
        );
      }
      return [...prev, { ...item, qty: Math.min(qty, item.stockQty) }];
    });
  };

  // ปรับจำนวน — clamp ระหว่าง 1 ถึงสต็อกที่มี
  const updateQty = (variantId, qty) => {
    setItems((prev) =>
      prev.map((it) =>
        it.variantId === variantId
          ? { ...it, qty: Math.max(1, Math.min(qty, it.stockQty)) }
          : it
      )
    );
  };

  const removeItem = (variantId) =>
    setItems((prev) => prev.filter((it) => it.variantId !== variantId));

  const clearCart = () => {
    setItems([]);
    setPromo(null);
  };

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0),
    [items]
  );

  const itemCount = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);

  // ตรวจและใช้โค้ดส่วนลด (เรียก backend จริง) — คืน { success, message } ให้ UI แสดงผล
  const applyPromo = async (code) => {
    const normalized = code.trim().toUpperCase();
    try {
      const res = await validatePromoCode({ code: normalized, subtotal });
      const data = res.data;
      setPromo({
        code: data.code,
        type: data.discount_type,
        value: data.discount_value,
        minTotal: data.min_order_total,
      });
      return { success: true, message: `ใช้โค้ด ${normalized} เรียบร้อย` };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'ตรวจสอบโค้ดไม่สำเร็จ กรุณาลองใหม่' };
    }
  };

  const removePromo = () => setPromo(null);

  // ส่วนลดจริง — ถ้ายอดตกต่ำกว่าขั้นต่ำภายหลัง (เช่น ลบสินค้าออก) ส่วนลดกลายเป็น 0
  const discount = useMemo(() => {
    if (!promo || subtotal < promo.minTotal) return 0;
    const amount = promo.type === 'percent' ? (subtotal * promo.value) / 100 : promo.value;
    return Math.min(amount, subtotal);
  }, [promo, subtotal]);

  const total = subtotal - discount;

  const value = {
    items,
    itemCount,
    subtotal,
    discount,
    total,
    promo,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    applyPromo,
    removePromo,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// hook สำหรับเรียกใช้ตะกร้าจาก component ใดก็ได้
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart ต้องใช้ภายใน <CartProvider>');
  return ctx;
}

// context/CartContext.jsx — ตะกร้าสินค้าฝั่ง client เก็บใน localStorage (ยังไม่ sync กับ /api/cart)
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// โค้ดส่วนลด mock ตาม seed.sql — TODO: เปลี่ยนเป็นเรียก API ตรวจโค้ดจริงเมื่อ Backend เสร็จ
const MOCK_PROMOS = {
  WELCOME10: { type: 'percent', value: 10, minTotal: 500, expired: false },
  SAVE50: { type: 'fixed', value: 50, minTotal: 300, expired: false },
  NEWYEAR25: { type: 'percent', value: 25, minTotal: 1000, expired: true }, // ไว้ทดสอบเคสหมดอายุ
};

const STORAGE_KEY = 'wibwab_cart';

// โหลดตะกร้าที่บันทึกไว้ (กัน JSON พังด้วย try/catch)
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
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
  const [items, setItems] = useState(() => loadSaved().items);
  const [promo, setPromo] = useState(() => loadSaved().promo);

  // บันทึกทุกครั้งที่ตะกร้าเปลี่ยน — refresh หน้าแล้วของไม่หาย
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, promo }));
  }, [items, promo]);

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

  // ตรวจและใช้โค้ดส่วนลด — คืน { success, message } ให้ UI แสดงผล
  const applyPromo = (code) => {
    const normalized = code.trim().toUpperCase();
    const found = MOCK_PROMOS[normalized];
    if (!found) return { success: false, message: 'ไม่พบโค้ดส่วนลดนี้' };
    if (found.expired) return { success: false, message: 'โค้ดนี้หมดอายุแล้ว' };
    if (subtotal < found.minTotal) {
      return {
        success: false,
        message: `ยอดสั่งซื้อขั้นต่ำ ${found.minTotal.toLocaleString('th-TH')} บาทจึงจะใช้โค้ดนี้ได้`,
      };
    }
    setPromo({ code: normalized, type: found.type, value: found.value, minTotal: found.minTotal });
    return { success: true, message: `ใช้โค้ด ${normalized} เรียบร้อย` };
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

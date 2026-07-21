// api/order.api.js — ฟังก์ชันเรียก API เกี่ยวกับคำสั่งซื้อ
import client from './client';

// --- ข้อมูลตัวอย่าง (Mock Data) ---
// จำลองตาม seed.sql และ API contract ที่กำหนด
// TODO: ลบ MOCK_ORDERS เมื่อ Backend GET /api/orders/my พร้อมใช้งาน
const MOCK_ORDERS = [
  {
    id: 3,
    status: 'delivered',
    created_at: '2026-07-10T14:20:00Z',
    total_amount: 1780,
    gift_wrap: true,
    gift_message: 'สุขสันต์วันเกิดนะ ขอให้มีความสุขมากๆ!',
    tracking_number: 'TH1234567890',
    slip_image: '/uploads/slips/mock-slip.jpg',
    items: [
      { product_id: 3, name: 'สร้อยคอจี้หัวใจเงินแท้', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdGcqBKZy5TKCuvCWYzifJATnqo7sldmlv90c31QgQKXY7fqp7PvbV21M3C2D16rkNsz1XaswaTyzH2kTKQ9w8ro5nbUZLy06_cmVhaNfoY8rIVZW0JsZPnxZvD6AVTrLqpIIOaS9qkL1dLi5D2UeWueastvYO7e-of9zj3nL0xCweoUy-ZjkLS-5cmTwdpy_vbn3noxq1sma6SrcaYOk8uGliD6Md_FgtFgE6C_IjbyruX1RQPRIoeZgMqALAQ53kKIBuMGYL03M', variant_label: '16 นิ้ว / เงิน', qty: 2, unit_price: 890 },
    ],
    reviewed_product_ids: [3], // สมมติว่ารีวิวสินค้านี้ไปแล้ว
  },
  {
    id: 2,
    status: 'paid',
    created_at: '2026-07-16T10:30:00Z',
    total_amount: 680,
    gift_wrap: false,
    gift_message: null,
    tracking_number: null,
    slip_image: '/uploads/slips/mock-slip.jpg',
    items: [
      { product_id: 5, name: 'ต่างหูมุก Aura Pearl', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMbYGZ4lAtgBa8yYGV5IJRi_cajKgVKLHPYsG19VBlsgmZhNuwwRksq7B5SE1xfpOfcj9cMxs3WDCtKSpMzn2BpqvU3fNd9xwl0nYd9tb1pE4xE4mN3GLfu7MazVvIZxShdrwyxEYYS3cW-ow9SFx_EICmql-qCnoHAe4ygFnSOAAqzVyTbDuhF7uUER6LZfBboz34jN_Z1EwrRGRoyrKceVQotogDZM8nEKuUlF-EW5bYoBKSJfeLbzicWCI-AtAkETqOAnNNoog', variant_label: 'ทอง 14K', qty: 1, unit_price: 680 },
    ],
    reviewed_product_ids: [],
  },
  {
    id: 1,
    status: 'pending_payment',
    created_at: '2026-07-17T08:00:00Z',
    total_amount: 1250,
    gift_wrap: false,
    gift_message: null,
    tracking_number: null,
    slip_image: null, // ยังไม่ได้แนบสลิป
    items: [
      { product_id: 1, name: 'แหวนเพชร Lumina Rose', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPi5cLMXl3nLKVb1yM3iUuigobMAlXxhIBRvsbWfd0QO13ZsD0MDz646XDYxATlhhDD8iUTKPxOD24f3V_yP6Xt7BgfmGltAr8btWLlMuIK2WTKcEnyqdiXRP-_kERtLhmOeQgpfbtRdXYnWNUWrQ6MzQHJmuF9jGpkmWXt57g8ClHwAeLHufMkJxssD7HEr1wWyr2PkvRSilFwgyInt6I4ej7Vab4vuzNswiX8_uz9pfG2xase4VENZ8opdEa93vZv4_KZpkdqS4', variant_label: 'ไซซ์ 6 / โรสโกลด์', qty: 1, unit_price: 1250 },
    ],
    reviewed_product_ids: [],
  },
];

/**
 * ดึงประวัติการสั่งซื้อทั้งหมดของลูกค้าที่ล็อกอินอยู่
 * @returns {Promise<{success: boolean, data: Array, message?: string}>}
 */
export async function getMyOrders() {
  // TODO: ลบ try...catch และคืนค่าจาก client.get ตรงๆ เมื่อ Backend เสร็จ
  try {
    const response = await client.get('/api/orders/my');
    return response.data;
  } catch (error) {
    console.warn('getMyOrders API failed, using mock data. Error:', error.message);
    return { success: true, data: MOCK_ORDERS, isMock: true };
  }
}

/**
 * ตรวจโค้ดส่วนลดกับ backend จริง (แนบ JWT อัตโนมัติถ้าล็อกอินอยู่ — ใช้เช็คสิทธิ์คูปองในกระเป๋า)
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export async function validatePromoCode({ code, subtotal }) {
  const res = await client.post('/api/orders/validate-promo', { code, subtotal });
  return res.data;
}

/**
 * สร้างคำสั่งซื้อใหม่ (ตัดสต็อกฝั่ง server ใน transaction)
 * @param {object} payload - { items:[{variant_id, quantity}], shipping_name, shipping_phone,
 *   shipping_address, shipping_postal_code, promo_code, gift_wrap, gift_message }
 * @returns {Promise<{success: boolean, data: {order_id, total_amount, status}, message?: string}>}
 */
export async function createOrder(payload) {
  const res = await client.post('/api/orders', payload);
  return res.data;
}

/**
 * แนบสลิปโอนเงินให้คำสั่งซื้อ (เฉพาะสถานะรอชำระเงิน)
 * @param {number} orderId
 * @param {File} file
 * @returns {Promise<{success: boolean, data: {order_id, slip_image}, message?: string}>}
 */
export async function uploadSlip(orderId, file) {
  const formData = new FormData();
  formData.append('slip', file);
  const res = await client.post(`/api/orders/${orderId}/slip`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * ยกเลิกคำสั่งซื้อ (เฉพาะสถานะรอชำระเงิน — คืนสต็อกให้อัตโนมัติ)
 * @param {number} orderId
 * @returns {Promise<{success: boolean, data: {order_id, status}, message?: string}>}
 */
export async function cancelOrder(orderId) {
  const res = await client.put(`/api/orders/${orderId}/cancel`);
  return res.data;
}
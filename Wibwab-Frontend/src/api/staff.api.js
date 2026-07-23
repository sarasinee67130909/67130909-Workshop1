// api/staff.api.js — รวมการเรียก endpoint กลุ่ม staff ไว้ที่เดียว
import client from './client';

// ── Dashboard ──
export async function getStaffDashboard() {
  const res = await client.get('/api/staff/dashboard');
  return res.data;
}

// ── Orders ──
export async function getStaffOrders({ status, search, page } = {}) {
  const res = await client.get('/api/staff/orders', { params: { status, search, page } });
  return res.data;
}

export async function getStaffOrderDetail(orderId) {
  const res = await client.get(`/api/staff/orders/${orderId}`);
  return res.data;
}

export async function verifyOrderPayment(orderId) {
  const res = await client.put(`/api/staff/orders/${orderId}/verify-payment`);
  return res.data;
}

export async function updateOrderStatus(orderId, status, tracking_number) {
  const res = await client.put(`/api/staff/orders/${orderId}/status`, { status, tracking_number });
  return res.data;
}

export async function cancelStaffOrder(orderId) {
  const res = await client.put(`/api/staff/orders/${orderId}/cancel`);
  return res.data;
}

// ── Inventory ──
export async function getInventory({ search, lowStockOnly, page } = {}) {
  const res = await client.get('/api/staff/inventory', { params: { search, lowStockOnly, page } });
  return res.data;
}

export async function updateVariantStock(variantId, { stock_qty, delta }) {
  const res = await client.put(`/api/staff/inventory/variants/${variantId}/stock`, { stock_qty, delta });
  return res.data;
}

// ── Products ──
export async function getStaffCategories() {
  const res = await client.get('/api/staff/categories');
  return res.data;
}

export async function getStaffProducts({ search, category, page } = {}) {
  const res = await client.get('/api/staff/products', { params: { search, category, page } });
  return res.data;
}

export async function getStaffProduct(id) {
  const res = await client.get(`/api/staff/products/${id}`);
  return res.data;
}

export async function getStaffProductReviews(id) {
  const res = await client.get(`/api/staff/products/${id}/reviews`);
  return res.data;
}

export async function getStaffReview(id) {
  const res = await client.get(`/api/staff/reviews/${id}`);
  return res.data;
}

export async function createProduct(payload) {
  const res = await client.post('/api/staff/products', payload);
  return res.data;
}

export async function updateProduct(id, payload) {
  const res = await client.put(`/api/staff/products/${id}`, payload);
  return res.data;
}

export async function uploadProductImage(productId, file, isPrimary = false) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('is_primary', String(isPrimary));
  const res = await client.post(`/api/staff/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// ── Coupons ──
export async function getStaffPromos({ search, page } = {}) {
  const res = await client.get('/api/staff/promos', { params: { search, page } });
  return res.data;
}

export async function getStaffPromo(id) {
  const res = await client.get(`/api/staff/promos/${id}`);
  return res.data;
}

export async function createPromo(payload) {
  const res = await client.post('/api/staff/promos', payload);
  return res.data;
}

export async function updatePromo(id, payload) {
  const res = await client.put(`/api/staff/promos/${id}`, payload);
  return res.data;
}

export async function pushPromo(id) {
  const res = await client.post(`/api/staff/promos/${id}/push`);
  return res.data;
}

// ── Notifications ──
export async function getStaffNotifications() {
  const res = await client.get('/api/staff/notifications');
  return res.data;
}

export async function markNotificationRead(id) {
  const res = await client.put(`/api/staff/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await client.put('/api/staff/notifications/read-all');
  return res.data;
}

export async function deleteNotification(id) {
  const res = await client.delete(`/api/staff/notifications/${id}`);
  return res.data;
}

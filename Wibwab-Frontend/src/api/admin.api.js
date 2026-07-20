// api/admin.api.js — รวมการเรียก endpoint กลุ่ม admin ไว้ที่เดียว
import client from './client';

// ── Dashboard ──
// range: '7d' | '30d'
export async function getAdminDashboard(range = '7d') {
  const res = await client.get('/api/admin/dashboard', { params: { range } });
  return res.data;
}

// ── รายงานยอดขาย ──
// { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', category: categoryId (optional) }
export async function getSalesReport({ from, to, category } = {}) {
  const res = await client.get('/api/admin/reports/sales', { params: { from, to, category } });
  return res.data;
}

// ── รายงานสต็อก ──
export async function getStockReport() {
  const res = await client.get('/api/admin/reports/stock');
  return res.data;
}

// ── รายงานกำไร ──
// { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
export async function getProfitReport({ from, to } = {}) {
  const res = await client.get('/api/admin/reports/profit', { params: { from, to } });
  return res.data;
}
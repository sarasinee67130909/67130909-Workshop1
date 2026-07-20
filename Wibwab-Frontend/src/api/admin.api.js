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

// ── ส่งออกรายงาน (Excel/PDF) ──
// ดึงไฟล์เป็น blob แล้วสั่งดาวน์โหลดผ่าน <a download> ชั่วคราว
// format: 'xlsx' | 'pdf'
async function downloadReport(url, params, format) {
  let res;
  try {
    res = await client.get(url, {
      params: { ...params, format },
      responseType: 'blob',
    });
  } catch (err) {
    // เมื่อ error, backend ตอบ JSON แต่ axios คืนมาเป็น Blob เพราะ responseType: 'blob'
    // แปลงกลับเป็น JSON เพื่อให้หน้าเพจอ่าน err.response.data.message ได้ตามปกติ
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        err.response.data = JSON.parse(text);
      } catch {
        // เก็บ blob เดิมไว้ถ้าแปลงไม่ได้
      }
    }
    throw err;
  }

  // ดึงชื่อไฟล์จาก header ที่ backend ตั้งไว้ (Content-Disposition) ถ้ามี
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? decodeURIComponent(match[1]) : `report.${format}`;

  const blobUrl = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

// { range: '7d' | '30d', format: 'xlsx' | 'pdf' }
export function exportAdminDashboard({ range = '7d', format = 'xlsx' } = {}) {
  return downloadReport('/api/admin/dashboard/export', { range }, format);
}

// { from, to, category, format: 'xlsx' | 'pdf' }
export function exportSalesReport({ from, to, category, format = 'xlsx' } = {}) {
  return downloadReport('/api/admin/reports/sales/export', { from, to, category }, format);
}

// format: 'xlsx' | 'pdf'
export function exportStockReport({ format = 'xlsx' } = {}) {
  return downloadReport('/api/admin/reports/stock/export', {}, format);
}

// { from, to, format: 'xlsx' | 'pdf' }
export function exportProfitReport({ from, to, format = 'xlsx' } = {}) {
  return downloadReport('/api/admin/reports/profit/export', { from, to }, format);
}
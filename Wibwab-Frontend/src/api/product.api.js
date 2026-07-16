// api/product.api.js — รวมการเรียก endpoint กลุ่ม product ไว้ที่เดียว (ยังไม่ implement)
import apiClient from './client.js';

/**
 * ดึงรายการสินค้าพร้อมตัวกรองและแบ่งหน้า
 * @param {Object} filters - object ของตัวกรอง (category, material, minPrice, maxPrice, size, page)
 */
export const getProducts = async (filters = {}) => {
  try {
    // กรองเอาเฉพาะพารามิเตอร์ที่มีค่าเพื่อส่งไปกับ query string
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.material) params.material = filters.material;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.size) params.size = filters.size;
    if (filters.page) params.page = filters.page;

    const response = await apiClient.get('/api/products', { params });
    return response.data; // คาดหวังรูปแบบ { success: true, data: { products: [...], totalPages: n } }
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
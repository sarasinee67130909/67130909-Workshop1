// api/coupon.api.js — กระเป๋าคูปองของลูกค้าที่ล็อกอินอยู่
import client from './client';

export async function getMyCoupons() {
  const res = await client.get('/api/coupons/my');
  return res.data;
}

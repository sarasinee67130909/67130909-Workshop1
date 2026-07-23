import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  createProduct,
  updateProduct,
  getStaffProduct,
  getStaffProductReviews,
  getStaffCategories,
  uploadProductImage,
} from '../../api/staff.api';

let tempIdCounter = 0;
function newVariant() {
  tempIdCounter -= 1;
  return {
    tempId: tempIdCounter, // key ชั่วคราวฝั่ง client เท่านั้น ไม่ส่งไป backend
    id: null,              // id จริงจาก DB (มีก็ต่อเมื่อแก้ไขตัวเลือกเดิม)
    sku: '',
    size: '',
    color: '',
    material: '',
    price: '',
    cost_price: '',
    stock_qty: '',
    low_stock_threshold: 5,
  };
}

/**
 * หน้าเพิ่ม/แก้ไขสินค้า (Product Management)
 * ใช้ทั้งสร้างสินค้าใหม่และแก้ไขสินค้าเดิม — ถ้ามี :id ใน route ให้โหลดข้อมูลเดิมมาแสดง
 */
export default function ProductManagePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // ไม่มี = โหมดสร้างใหม่, มี = โหมดแก้ไข
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    is_visible: true,
  });
  const [variants, setVariants] = useState([newVariant()]);
  const [pendingImage, setPendingImage] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const reviewsRef = useRef(null);

  useEffect(() => {
    getStaffCategories().then((res) => res.success && setCategories(res.data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getStaffProduct(id)
      .then((res) => {
        if (!res.success) return;
        const p = res.data;
        setForm({
          name: p.name,
          description: p.description || '',
          category_id: String(p.category_id),
          is_visible: p.is_visible,
        });
        setVariants(
          p.variants.filter((v) => v.is_active).length
            ? p.variants.filter((v) => v.is_active).map((v) => ({ ...v, tempId: v.id }))
            : [newVariant()]
        );
        setExistingImages(p.images || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'โหลดข้อมูลสินค้าไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    getStaffProductReviews(id)
      .then((res) => res.success && setReviews(res.data))
      .catch(() => {});
  }, [id, isEdit]);

  // มาจากคลิกแจ้งเตือน "ลูกค้ารีวิว" (StaffTopbar ส่ง state.scrollToReviews มาทาง navigate) — เลื่อนไปดูรีวิวให้เลย
  useEffect(() => {
    if (!location.state?.scrollToReviews || loading) return;
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function handleChange(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  function updateVariantField(tempId, field, value) {
    setVariants((prev) => prev.map((v) => (v.tempId === tempId ? { ...v, [field]: value } : v)));
  }

  function addVariantRow() {
    setVariants((prev) => [...prev, newVariant()]);
  }

  function removeVariantRow(tempId) {
    setVariants((prev) => (prev.length > 1 ? prev.filter((v) => v.tempId !== tempId) : prev));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('กรุณากรอกชื่อสินค้า');
    if (!form.category_id) return setError('กรุณาเลือกหมวดหมู่สินค้า');
    if (variants.some((v) => !v.sku.trim())) return setError('กรุณาระบุ SKU ให้ครบทุกตัวเลือกสินค้า');
    if (variants.some((v) => !v.price || Number(v.price) <= 0)) return setError('ราคาของทุกตัวเลือกต้องมากกว่า 0');
    if (variants.some((v) => v.stock_qty === '' || Number(v.stock_qty) < 0)) {
      return setError('จำนวนสต็อกเริ่มต้นต้องไม่ติดลบ');
    }

    const payload = {
      name: form.name.trim(),
      description: form.description,
      category_id: Number(form.category_id),
      is_visible: form.is_visible,
      variants: variants.map((v) => ({
        id: v.id || undefined,
        sku: v.sku.trim(),
        size: v.size || null,
        color: v.color || null,
        material: v.material || null,
        price: Number(v.price),
        cost_price: Number(v.cost_price) || 0,
        stock_qty: Number(v.stock_qty),
        low_stock_threshold: Number(v.low_stock_threshold) || 5,
      })),
    };

    setSaving(true);
    try {
      let productId = id;
      if (isEdit) {
        await updateProduct(id, payload);
      } else {
        const res = await createProduct(payload);
        productId = res.data.id;
      }
      if (pendingImage && productId) {
        await uploadProductImage(productId, pendingImage, existingImages.length === 0);
      }
      navigate('/staff/inventory');
    } catch (err) {
      setError(err.response?.data?.message || 'บันทึกสินค้าไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>กำลังโหลดข้อมูลสินค้า...</p>;

  return (
    <div>
      <div className="staff-breadcrumb">
        <a href="/staff/inventory">คลังสินค้า</a>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
        <span className="staff-breadcrumb__current">{isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</span>
      </div>

      <div className="staff-page-header">
        <h1 style={{ fontSize: 30 }}>{isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h1>
        <div className="staff-page-header__actions">
          <button type="button" className="staff-btn staff-btn--secondary" onClick={() => navigate('/staff/inventory')}>
            ยกเลิก
          </button>
          <button type="submit" form="product-form" className="staff-btn staff-btn--primary" disabled={saving}>
            <span className="material-symbols-outlined">save</span>
            {saving ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
          </button>
        </div>
      </div>

      {error && <p className="staff-login__error">{error}</p>}

      <form id="product-form" onSubmit={handleSubmit} className="product-editor-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="staff-card">
            <div className="staff-card__header">
              <h3><span className="material-symbols-outlined">info</span>ข้อมูลพื้นฐาน</h3>
            </div>
            <div className="staff-card__body">
              <div className="staff-form-group">
                <label className="staff-form-label" htmlFor="product-name">
                  ชื่อสินค้า <span className="required">*</span>
                </label>
                <input
                  id="product-name"
                  className="staff-form-control"
                  placeholder="เช่น แหวนเพชรทองคำ 18K"
                  value={form.name}
                  onChange={handleChange('name')}
                  required
                />
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label" htmlFor="product-description">รายละเอียดสินค้า</label>
                <textarea
                  id="product-description"
                  className="staff-form-control"
                  rows={4}
                  placeholder="รายละเอียดสินค้าอย่างละเอียด..."
                  value={form.description}
                  onChange={handleChange('description')}
                />
              </div>
            </div>
          </div>

          <div className="staff-card">
            <div className="staff-card__header">
              <h3><span className="material-symbols-outlined">image</span>รูปภาพสินค้า</h3>
            </div>
            <div className="staff-card__body">
              {existingImages.length > 0 && (
                <div className="staff-media-grid" style={{ marginBottom: 12 }}>
                  {existingImages.map((im) => (
                    <img key={im.id} src={im.path} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                  ))}
                </div>
              )}
              <div className="staff-form-group">
                <label className="staff-form-label">
                  {existingImages.length > 0 ? 'เพิ่มรูปภาพ' : 'รูปภาพหลัก'}
                </label>
                <div className="staff-dropzone">
                  <div className="staff-dropzone__icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>cloud_upload</span>
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: 14 }}>
                    {pendingImage ? pendingImage.name : 'คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPendingImage(e.target.files?.[0] || null)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="staff-card">
            <div className="staff-card__header">
              <h3><span className="material-symbols-outlined">category</span>การจัดหมวดหมู่</h3>
            </div>
            <div className="staff-card__body">
              <div className="staff-form-group">
                <label className="staff-form-label" htmlFor="category">หมวดหมู่ <span className="required">*</span></label>
                <select id="category" className="staff-form-control" value={form.category_id} onChange={handleChange('category_id')}>
                  <option value="" disabled>เลือกหมวดหมู่</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="staff-form-group" style={{ marginBottom: 0 }}>
                <label className="staff-form-label">สถานะสินค้า</label>
                <div className="staff-radio-group">
                  <label>
                    <input
                      type="radio" name="status"
                      checked={form.is_visible === true}
                      onChange={() => setForm((p) => ({ ...p, is_visible: true }))}
                    />
                    เปิดขาย
                  </label>
                  <label>
                    <input
                      type="radio" name="status"
                      checked={form.is_visible === false}
                      onChange={() => setForm((p) => ({ ...p, is_visible: false }))}
                    />
                    ซ่อนจากหน้าร้าน
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="staff-card">
            <div className="staff-card__header">
              <h3><span className="material-symbols-outlined">layers</span>ตัวเลือกสินค้า (ไซซ์ / สี / วัสดุ)</h3>
              <button type="button" className="staff-card__link" onClick={addVariantRow}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> เพิ่มตัวเลือก
              </button>
            </div>
            <div className="staff-card__body">
              <div className="staff-table-wrap">
                <table className="staff-table" style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th>SKU *</th>
                      <th>ไซซ์</th>
                      <th>สี</th>
                      <th>วัสดุ</th>
                      <th className="align-right">ราคา (฿) *</th>
                      <th className="align-right">ต้นทุน (฿)</th>
                      <th className="align-right">สต็อกเริ่มต้น *</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.tempId} className="is-row">
                        <td>
                          <input
                            className="staff-form-control mono" style={{ padding: '4px 8px', width: 120 }}
                            value={v.sku} onChange={(e) => updateVariantField(v.tempId, 'sku', e.target.value)}
                            placeholder="RNG-001-5-SLV"
                          />
                        </td>
                        <td>
                          <input
                            className="staff-form-control" style={{ padding: '4px 8px', width: 80 }}
                            value={v.size || ''} onChange={(e) => updateVariantField(v.tempId, 'size', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="staff-form-control" style={{ padding: '4px 8px', width: 80 }}
                            value={v.color || ''} onChange={(e) => updateVariantField(v.tempId, 'color', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="staff-form-control" style={{ padding: '4px 8px', width: 100 }}
                            value={v.material || ''} onChange={(e) => updateVariantField(v.tempId, 'material', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number" className="staff-form-control" style={{ padding: '4px 8px', width: 90, textAlign: 'right' }}
                            value={v.price} onChange={(e) => updateVariantField(v.tempId, 'price', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number" className="staff-form-control" style={{ padding: '4px 8px', width: 90, textAlign: 'right' }}
                            value={v.cost_price} onChange={(e) => updateVariantField(v.tempId, 'cost_price', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number" className="staff-form-control" style={{ padding: '4px 8px', width: 80, textAlign: 'right' }}
                            value={v.stock_qty} onChange={(e) => updateVariantField(v.tempId, 'stock_qty', e.target.value)}
                          />
                        </td>
                        <td>
                          <button
                            type="button" className="staff-icon-btn" style={{ width: 24, height: 24 }}
                            aria-label="ลบตัวเลือก" onClick={() => removeVariantRow(v.tempId)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </form>

      {isEdit && (
        <div className="staff-card" ref={reviewsRef} style={{ marginTop: 24 }}>
          <div className="staff-card__header">
            <h3><span className="material-symbols-outlined">rate_review</span>รีวิวจากลูกค้า ({reviews.length})</h3>
          </div>
          <div className="staff-card__body">
            {reviews.length === 0 && (
              <p style={{ color: 'var(--staff-text-muted)', margin: 0 }}>ยังไม่มีรีวิวสำหรับสินค้านี้</p>
            )}
            {reviews.map((r) => (
              <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--staff-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong>{r.user_name}</strong>
                  <span style={{ color: 'var(--staff-text-muted)', fontSize: 12 }}>{r.created_at}</span>
                </div>
                <div style={{ color: '#eab308', marginBottom: 4 }}>
                  {'★'.repeat(r.rating)}
                  <span style={{ color: 'var(--staff-border)' }}>{'★'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p style={{ margin: 0 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .product-editor-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 1280px) { .product-editor-grid { grid-template-columns: 2fr 1fr; } }
        .staff-dropzone { position: relative; }
      `}</style>
    </div>
  );
}

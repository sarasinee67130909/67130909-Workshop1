import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPromo, updatePromo, getStaffPromo } from '../../api/staff.api';

const EMPTY_FORM = {
  code: '',
  label: '',
  discount_type: 'percent',
  discount_value: '',
  min_order_total: '0',
  expires_at: '',
  usage_limit: '',
  push_trigger: 'manual',
  is_active: true,
};

/**
 * หน้าเพิ่ม/แก้ไขโค้ดส่วนลด — ถ้ามี :id ใน route ให้โหลดข้อมูลเดิมมาแสดง
 */
export default function PromoEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getStaffPromo(id)
      .then((res) => {
        if (!res.success) return;
        const p = res.data;
        setForm({
          code: p.code,
          label: p.label || '',
          discount_type: p.discount_type,
          discount_value: String(p.discount_value),
          min_order_total: String(p.min_order_total),
          expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '',
          usage_limit: p.usage_limit ? String(p.usage_limit) : '',
          push_trigger: p.push_trigger,
          is_active: p.is_active,
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'โหลดข้อมูลโค้ดไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.code.trim()) return setError('กรุณากรอกโค้ดส่วนลด');
    if (!form.discount_value || Number(form.discount_value) <= 0) return setError('มูลค่าส่วนลดต้องมากกว่า 0');

    const payload = {
      code: form.code.trim(),
      label: form.label.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_total: Number(form.min_order_total) || 0,
      expires_at: form.expires_at ? `${form.expires_at} 23:59:59` : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      push_trigger: form.push_trigger,
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updatePromo(id, payload);
      } else {
        await createPromo(payload);
      }
      navigate('/staff/promos');
    } catch (err) {
      setError(err.response?.data?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>กำลังโหลด...</p>;

  return (
    <div>
      <div className="staff-breadcrumb">
        <button className="staff-card__link" onClick={() => navigate('/staff/promos')}>โปรโมชั่น &amp; คูปอง</button>
        {' / '}{isEdit ? 'แก้ไขโค้ด' : 'สร้างโค้ดใหม่'}
      </div>

      <div className="staff-page-header">
        <div>
          <h2>{isEdit ? 'แก้ไขโค้ดส่วนลด' : 'สร้างโค้ดส่วนลดใหม่'}</h2>
        </div>
        <div className="staff-page-header__actions">
          <button type="submit" form="promo-form" className="staff-btn staff-btn--primary" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {error && <p className="staff-login__error">{error}</p>}

      <form id="promo-form" onSubmit={handleSubmit}>
        <div className="staff-card">
          <div className="staff-card__body">
            <div className="staff-form-group">
              <label className="staff-form-label">โค้ดส่วนลด</label>
              <input
                className="staff-form-control"
                value={form.code}
                onChange={handleChange('code')}
                placeholder="เช่น WELCOME10"
              />
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label">ชื่อที่แสดงในกระเป๋าคูปองลูกค้า</label>
              <input
                className="staff-form-control"
                value={form.label}
                onChange={handleChange('label')}
                placeholder="เช่น ต้อนรับสมาชิกใหม่ 10%"
              />
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label">รูปแบบส่วนลด</label>
              <select className="staff-form-control" value={form.discount_type} onChange={handleChange('discount_type')}>
                <option value="percent">ลดเป็นเปอร์เซ็นต์ (%)</option>
                <option value="fixed">ลดเป็นจำนวนเงิน (บาท)</option>
              </select>
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label">
                มูลค่าส่วนลด {form.discount_type === 'percent' ? '(%)' : '(บาท)'}
              </label>
              <input
                type="number"
                className="staff-form-control"
                value={form.discount_value}
                onChange={handleChange('discount_value')}
                min="0"
              />
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label">ยอดสั่งซื้อขั้นต่ำ (บาท)</label>
              <input
                type="number"
                className="staff-form-control"
                value={form.min_order_total}
                onChange={handleChange('min_order_total')}
                min="0"
              />
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label">วันหมดอายุ (เว้นว่าง = ไม่มีวันหมดอายุ)</label>
              <input
                type="date"
                className="staff-form-control"
                value={form.expires_at}
                onChange={handleChange('expires_at')}
              />
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label">จำนวนครั้งที่ใช้ได้รวม (เว้นว่าง = ไม่จำกัด)</label>
              <input
                type="number"
                className="staff-form-control"
                value={form.usage_limit}
                onChange={handleChange('usage_limit')}
                min="1"
              />
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label">รูปแบบการแจก</label>
              <div className="staff-radio-group">
                <label>
                  <input
                    type="radio"
                    name="push_trigger"
                    checked={form.push_trigger === 'manual'}
                    onChange={() => setForm((prev) => ({ ...prev, push_trigger: 'manual' }))}
                  />
                  กด Push เอง (เช่น คูปองรายเดือน)
                </label>
                <label>
                  <input
                    type="radio"
                    name="push_trigger"
                    checked={form.push_trigger === 'on_register'}
                    onChange={() => setForm((prev) => ({ ...prev, push_trigger: 'on_register' }))}
                  />
                  แจกอัตโนมัติตอนสมัครสมาชิก (Welcome Coupon)
                </label>
              </div>
            </div>

            <div className="staff-form-group">
              <label>
                <input type="checkbox" checked={form.is_active} onChange={handleChange('is_active')} />
                {' '}เปิดใช้งานโค้ดนี้
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// pages/customer/ProductDetailPage.jsx — หน้ารายละเอียดสินค้า (ธีม Rose Gold, แปลงจากดีไซน์ Stitch)
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import VariantSelector, { variantLabel } from '../../components/product/VariantSelector';
import SizeGuideModal from '../../components/product/SizeGuideModal';
import { getProductById } from '../../api/product.api';
import { useCart } from '../../context/CartContext';
import '../../styles/customer.css';

// ── ข้อมูลตัวอย่างไว้พรีวิวหน้า ระหว่าง Backend ยังไม่เสร็จ ──
// จำลองตามสินค้า id 3 (สร้อยคอจี้หัวใจเงินแท้) ใน seed.sql
// TODO: ลบ MOCK_PRODUCT และ fallback ใน useEffect เมื่อเชื่อม Backend แล้ว
const MOCK_PRODUCT = {
  id: 3,
  name: 'สร้อยคอจี้หัวใจเงินแท้',
  description:
    'สร้อยคอเงินแท้ 925 พร้อมจี้รูปหัวใจขัดเงา ดีไซน์เรียบหรูใส่ได้ทุกโอกาส มาพร้อมกล่องกำมะหยี่พร้อมมอบเป็นของขวัญ',
  category: { id: 2, name: 'สร้อยคอ' },
  images: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCdGcqBKZy5TKCuvCWYzifJATnqo7sldmlv90c31QgQKXY7fqp7PvbV21M3C2D16rkNsz1XaswaTyzH2kTKQ9w8ro5nbUZLy06_cmVhaNfoY8rIVZW0JsZPnxZvD6AVTrLqpIIOaS9qkL1dLi5D2UeWueastvYO7e-of9zj3nL0xCweoUy-ZjkLS-5cmTwdpy_vbn3noxq1sma6SrcaYOk8uGliD6Md_FgtFgE6C_IjbyruX1RQPRIoeZgMqALAQ53kKIBuMGYL03M',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDj0CLQRB6ugYYjBFrlzy7Zk9X4oWP_uR8DTVpeeb7vXowjtcmbI_jaMx0RHcOhgxmh-UQqtkRkgsB4_IsmUYHf93w40NqWNEyT2_NrnLeoejqNzw0nfk8z2ZhLtzWgNOycdh0CFBj2Ve6S4VoFH8zf3SLI84flsxkSkccO7a5eOl28fl8bx0X7GVnQp-io0HJZ-INqIWPt8NBzLLcmPlH1bYRsRfJdurwqRKJyoHQ5TCtVSvsnkNA0ObkFD62oTqyIrR49I5sDgtY',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBLGt7la7x864CEhDohfd0S9xdYcOpSOZdlJnJ3sDvFMbKgh2bmEt6LMNSXmVc41HWq4SgvdxwAiaONOPL3LVRQMcqDyrazhUVnHLiMRNnuqzMnlQJiOzYHaPQo51rSfIQizDbsdlicjIgY4mbxri9la9A-27kEACS8ZxD5ZDWLZhMxz4LGJwP4qKedqz1fbo25_ZPHITL_Wq3jCeapf7DP_0fY-9ojEfcHHYMl2PJkCs6re9pVbXLqXLA_nuP-a7fkeKGN-0pXnoY',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDvX6dTrbTnz7FQ-B34wdTnMqVRvK4fzAZ_5bzEBfuj0-r-ulQLwDkCQZGp-b34DgcHn2hOxYMPpexYxOcHBMty_8DcXQ_yItOFq07PO9zAgnImVTO8cDbmTCGOOpKvTa3faiRTwj469tI1qa-bZA1DO3ruwGMWZg1DpU0Vecv64ssBp5QiOyM4nplmvlO9rARk0dwxyPBwt57gWW1mmz90DppF_GAKro2s7FEXersPDOvB6NK9s1UC_J0T84673wIT6qwsObXFl6A',
  ],
  variants: [
    { id: 7, sku: 'NCK-001-16-SLV', size: '16 นิ้ว', color: 'เงิน', material: 'เงินแท้ 925', price: 890, stock_qty: 8, low_stock_threshold: 5 },
    { id: 8, sku: 'NCK-001-18-SLV', size: '18 นิ้ว', color: 'เงิน', material: 'เงินแท้ 925', price: 890, stock_qty: 4, low_stock_threshold: 5 },
    { id: 99, sku: 'NCK-001-20-SLV', size: '20 นิ้ว', color: 'เงิน', material: 'เงินแท้ 925', price: 990, stock_qty: 0, low_stock_threshold: 5 },
  ],
  reviews: [
    { id: 1, user_name: 'ณิชา ว.', rating: 5, comment: 'สร้อยสวยมาก งานเงินเงาเรียบร้อย จี้หัวใจน่ารักกว่าในรูปอีกค่ะ', created_at: '25 มิ.ย. 2569' },
  ],
  avg_rating: 5,
};

const SHIPPING_TEXT =
  'หลังแนบสลิปโอนเงิน ทีมงานจะตรวจสอบและยืนยันภายใน 24 ชั่วโมง จากนั้นจัดส่งภายใน 1-3 วันทำการ พร้อมแจ้งเลขพัสดุให้ติดตามสถานะได้ในหน้าประวัติการสั่งซื้อ';

const CARE_TEXT =
  'เช็ดทำความสะอาดเบาๆ ด้วยผ้าไมโครไฟเบอร์หลังการสวมใส่ เก็บแยกชิ้นในถุงหรือกล่องที่ให้ไปเพื่อกันรอยขีดข่วน หลีกเลี่ยงการสัมผัสน้ำหอม โลชั่น และสารเคมี ไม่ควรใส่อาบน้ำหรือว่ายน้ำ (ยกเว้นสินค้าสแตนเลสกันน้ำ)';

// ฟอร์แมตราคาเป็นเงินบาท
const formatTHB = (value) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(value);

// Accordion แบบ CSS-only (checkbox toggle)
const AccordionItem = ({ id, title, children }) => (
  <div className="pdp-accordion-item">
    <input className="pdp-accordion-toggle" id={id} type="checkbox" />
    <label htmlFor={id} className="pdp-accordion-label">
      <span>{title}</span>
      <span className="material-symbols-outlined pdp-accordion-icon">expand_more</span>
    </label>
    <div className="pdp-accordion-content">
      <div className="pdp-accordion-content-inner">{children}</div>
    </div>
  </div>
);

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false); // true = กำลังแสดงข้อมูลตัวอย่าง
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [added, setAdded] = useState(false); // เพิ่งกดเพิ่มลงตะกร้าสำเร็จ

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveImage(0);
    setSelectedVariant(null);
    setAdded(false);

    getProductById(id)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setProduct(result.data);
          setIsMock(false);
        } else {
          setProduct(null);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        // Backend ยังไม่พร้อม — ใช้ข้อมูลตัวอย่างเพื่อพรีวิวหน้า (TODO: ลบเมื่อ Backend เสร็จ)
        console.warn('เรียก API ไม่สำเร็จ ใช้ข้อมูลตัวอย่างแทน:', error.message);
        setProduct(MOCK_PRODUCT);
        setIsMock(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAddToBag = () => {
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      name: product.name,
      image: product.images[0],
      variantLabel: variantLabel(selectedVariant),
      unitPrice: selectedVariant.price,
      stockQty: selectedVariant.stock_qty,
    });
    setAdded(true);
  };

  // ── สถานะกำลังโหลด / ไม่พบสินค้า ──
  if (loading) {
    return (
      <div className="pdp-page-container">
        <Navbar />
        <main className="pdp-main">
          <div className="pdp-loading">กำลังโหลดข้อมูลสินค้า...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-page-container">
        <Navbar />
        <main className="pdp-main">
          <div className="pdp-notfound">
            <p>ไม่พบสินค้าที่คุณกำลังมองหา</p>
            <Link to="/products">← กลับไปหน้ารายการสินค้า</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const reviews = product.reviews || [];
  const prices = product.variants.map((v) => v.price);
  const displayPrice = selectedVariant ? selectedVariant.price : Math.min(...prices);
  const canAddToBag = selectedVariant && selectedVariant.stock_qty > 0;

  return (
    <div className="pdp-page-container">
      <Navbar />

      <main className="pdp-main">
        {isMock && (
          <div className="pdp-mock-banner">
            <span className="material-symbols-outlined">info</span>
            กำลังแสดงข้อมูลตัวอย่าง — ยังไม่ได้เชื่อมต่อ Backend
          </div>
        )}

        <nav aria-label="Breadcrumb" className="pdp-breadcrumb">
          <ol>
            <li><Link to="/">หน้าแรก</Link></li>
            <li><span>/</span></li>
            <li><Link to={`/products?category=${product.category?.id ?? ''}`}>{product.category?.name ?? 'สินค้า'}</Link></li>
            <li><span>/</span></li>
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="pdp-layout">
          {/* ── ซ้าย: แกลเลอรีรูปสินค้า ── */}
          <div className="pdp-gallery">
            <div className="pdp-gallery__main-image-wrapper">
              <img
                alt={`${product.name} — รูปที่ ${activeImage + 1}`}
                className="pdp-gallery__main-image"
                src={product.images[activeImage]}
              />
            </div>
            <div className="pdp-gallery__thumbnails">
              {product.images.map((img, index) => (
                <button
                  type="button"
                  key={index}
                  className={`pdp-gallery__thumb ${index === activeImage ? 'pdp-gallery__thumb--active' : ''}`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`ดูรูปที่ ${index + 1}`}
                >
                  <img alt={`${product.name} มุมมองที่ ${index + 1}`} src={img} />
                </button>
              ))}
            </div>
          </div>

          {/* ── ขวา: ข้อมูลสินค้า ── */}
          <div className="pdp-info">
            <span className="pdp-info__collection">{product.category?.name}</span>
            <h2 className="pdp-info__name">{product.name}</h2>
            <p className="pdp-info__description">{product.description}</p>
            <div className="pdp-info__price">
              {!selectedVariant && <span className="pdp-info__price-prefix">เริ่มต้น</span>}
              {formatTHB(displayPrice)}
            </div>
            <hr className="pdp-info__divider" />

            <VariantSelector
              variants={product.variants}
              selected={selectedVariant}
              onSelect={(variant) => {
                setSelectedVariant(variant);
                setAdded(false);
              }}
              onOpenSizeGuide={() => setShowSizeGuide(true)}
            />

            <button className="btn-cta pdp-add-to-bag" disabled={!canAddToBag} onClick={handleAddToBag}>
              เพิ่มลงตะกร้า
              <span className="material-symbols-outlined">shopping_bag</span>
            </button>
            {!selectedVariant && (
              <p className="pdp-add-hint">กรุณาเลือกตัวเลือกสินค้าก่อนเพิ่มลงตะกร้า</p>
            )}
            {added && (
              <p className="pdp-added-note">
                เพิ่มลงตะกร้าแล้ว — <Link to="/cart">ดูตะกร้าสินค้า</Link>
              </p>
            )}

            <p className="pdp-shipping-info">
              <span className="material-symbols-outlined">local_shipping</span>
              จัดส่งทั่วประเทศ พร้อมเลขพัสดุติดตามสถานะ
            </p>

            <div className="pdp-accordion-group">
              <AccordionItem id="acc-shipping" title="การจัดส่งและการชำระเงิน">
                {SHIPPING_TEXT}
              </AccordionItem>
              <AccordionItem id="acc-care" title="การดูแลรักษา">
                {CARE_TEXT}
              </AccordionItem>
            </div>

            <div className="pdp-assistance-box">
              <span className="material-symbols-outlined">chat_bubble</span>
              <div>
                <h4>ต้องการความช่วยเหลือ?</h4>
                <p>ทีมงานวิบวับยินดีให้คำแนะนำในการเลือกเครื่องประดับและไซซ์ที่เหมาะกับคุณ</p>
                <Link to="/contact">ติดต่อเรา</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── รีวิวจากลูกค้า (รีวิวได้เฉพาะผู้ที่ซื้อจริงและได้รับสินค้าแล้ว) ── */}
        <section className="pdp-reviews">
          <div className="pdp-reviews__head">
            <h3>รีวิวจากลูกค้า</h3>
            {reviews.length > 0 && (
              <span className="pdp-reviews__avg">
                ★ {Number(product.avg_rating).toFixed(1)} ({reviews.length} รีวิว)
              </span>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="pdp-reviews__empty">ยังไม่มีรีวิวสำหรับสินค้านี้ — สั่งซื้อและเป็นคนแรกที่รีวิวเลย</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="pdp-review-card">
                <div className="pdp-review-card__stars">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </div>
                <p>{review.comment}</p>
                <div className="pdp-review-card__meta">
                  {review.user_name} · {review.created_at}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <SizeGuideModal open={showSizeGuide} onClose={() => setShowSizeGuide(false)} />

      <Footer />
    </div>
  );
}

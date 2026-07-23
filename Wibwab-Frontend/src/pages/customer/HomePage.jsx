// pages/customer/HomePage.jsx — หน้าแรกฝั่งลูกค้า ธีม Rose Gold (แปลงจากดีไซน์ Google Stitch)
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import '../../styles/customer.css';

// รูปประกอบจากไฟล์ดีไซน์ Stitch — ภายหลังเปลี่ยนเป็นรูปจริงของร้าน (/uploads/products/...)
const IMG = {
  hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5qxX8vD5ZljvIddC_OdVPlCKK3w4IaNl6THSc_WBWGw-i3X0qgA5kOj7tpiFsUcsOxpk7WZrqZm2vyYK2--ijJZtvhYVVr_HBGfGRPQNmJz2ITjtn7bcNDSe5_ARaxWornd2paOiqhfCSTLc9A9qD-OOZ20rCvOP4Zaqx9jAui6gp6D5xwBO5IGbTYbezkNOw7oB7Ck7BPX7rFsv9vhzd7GPwaFMOGfcctHwvEgVYLmb2fMv-Tqjmhg5OAxih2JDcDyns4Ps3N9k',
  rings: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6BZ6bb9HmA_3NRjl0qw0To_8rdQ6ax7Fj8jM-4dz__rwA-Pd0q93eTq_RzNLK6Z5EvG38Okbr2lha-Tmkf9soSocbMP8cd5s1dz8r4ZrjsbHuVwRrkCMfutrXIaCcrZKND3c06T_Q4v-8AKTB788YIpties8g9LpaAJTcqdHSdasJxFbBedLP4gu8fgdaszjifO4y58NgU_kG2UX1tuOKPBC6CF1nElsN1yloe6Ufm_GcfUG1F2W4WgzGeVdeGYuoAtPK6Gte-8Y',
  earrings: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHdLFj3u-OR1sXRTMd9GZcMPfqgW83Li22xkJUPxGIdWc4396x_amVvWapEjygAujZpWLC0IncclOjxLCDDqbcWH6EbkVWSMjKBmvew1oW17ui4iXa-caZMYIffpa_SC9G89l5Ic6_XXjNL_AQuytvHOFlZZOoXs7gmKWTeYh8jzU8WCkHhF6RYwqfHiA2tNsJpxwXB0Q5EL4kU87dIZ8UQ-SwaYZNxK1141XE_Z9UOdeCVARLwdejj0tKPghFGW1V5yQI5gw9a6Y',
  necklaces: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7C4XL4o4YE4wYKJgVQvg4mJ2VeaNpHkYBASAFID-6MI_cvULlMrFQFDhqwcsfKKa6ddwi86Xt10bVkUZevrhH3-00hiUv8olugWe1MNSXJ8upxG_TEqV9onYYcUdebcmdu3L0qTvT_bHsOdVtPV1rXfoLNEy9YizR83qcxFHBefi8MtYvHbSNH4eXnDH53Z4KGNWBslBCGiJSqapF-XLonnW122rjiUpc71MRwAy_fqdBt9DhxlDnnbv-VnqzlyPL8yNuNEbt5LA',
  gift: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA65EI9xVDwdGOLv9QB9QiCie55VpXukdl7dQIZjNI6ILXYLh36GBGYwWQ5dForPC-k54OtX_sUzZxhWKSMmOyueZqwWCMtYk5yCPL00I95Of1cI-6EAiDuUUONPYIxmBYve5VgLjQqdkvKprCwPiSFpSqxIiSjgmawZrXZmT6lwPaLT5AQYJgevitn3a4om34bxIaGvdfIAQWMvdtg8C_S-0yLPjfHqn79j3a763xoWz7id0pqIspwGgJ823Ykpc1W7TpENTLyJpg',
};

function HomePage() {
  return (
    <div className="customer-page">
      <Navbar />

      <main>
        {/* ── Hero: รูปใหญ่ + การ์ดกระจกฝ้า ── */}
        <section className="hero">
          <div className="hero-bg">
            <img src={IMG.hero} alt="เครื่องประดับโรสโกลด์คอลเลกชันใหม่ของวิบวับ" />
          </div>
          <div className="hero-content">
            <div className="glass-card">
              <span className="eyebrow">คอลเลกชันใหม่</span>
              <h1 className="hero-title">เปล่งประกายในแบบของคุณ</h1>
              <p className="hero-text">
                คัดสรรเครื่องประดับโรสโกลด์ดีไซน์ละมุน จับแสงสวยทุกมุมมอง
                ยกระดับลุคประจำวันของคุณให้พิเศษยิ่งขึ้น
              </p>
              <Link to="/products" className="btn-cta">
                ช้อปคอลเลกชัน
              </Link>
            </div>
          </div>
        </section>

        {/* ── หมวดหมู่แนะนำ (bento grid: ใหญ่ 1 + เล็ก 2) ── */}
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">หมวดหมู่แนะนำ</h2>
            <div className="section-divider" />
          </div>

          <div className="bento-grid">
            <Link to="/products?category=1" className="bento-card bento-large">
              <img src={IMG.rings} alt="แหวนโรสโกลด์ซ้อนหลายวง" />
              <div className="bento-card-label">
                <h3>แหวน</h3>
                <span className="bento-card-link">
                  สำรวจคอลเลกชัน
                  <span className="material-symbols-outlined">arrow_right_alt</span>
                </span>
              </div>
            </Link>

            <div className="bento-side">
              <Link to="/products?category=3" className="bento-card">
                <img src={IMG.earrings} alt="ต่างหูเพชรและโรสโกลด์บนผ้าไหม" />
                <div className="bento-card-label">
                  <h3>ต่างหู</h3>
                  <span className="bento-card-link">
                    เลือกซื้อ
                    <span className="material-symbols-outlined">arrow_right_alt</span>
                  </span>
                </div>
              </Link>

              <Link to="/products?category=2" className="bento-card">
                <img src={IMG.necklaces} alt="สร้อยคอจี้โรสโกลด์บนแท่นหินอ่อน" />
                <div className="bento-card-label">
                  <h3>สร้อยคอ</h3>
                  <span className="bento-card-link">
                    เลือกซื้อ
                    <span className="material-symbols-outlined">arrow_right_alt</span>
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ── บริการห่อของขวัญ + การ์ดข้อความ (ฟีเจอร์เด่นของวิบวับ) ── */}
        <section className="gift-section">
          <div className="gift-inner">
            <div className="gift-text">
              <span className="eyebrow">บริการพิเศษ</span>
              <h2 className="gift-title">ห่อของขวัญพร้อมการ์ดข้อความ</h2>
              <p className="gift-desc">
                ทุกคำสั่งซื้อเลือกบริการห่อของขวัญในกล่องพรีเมียมของวิบวับได้ทันที
                พร้อมเขียนการ์ดข้อความในแบบของคุณ ส่งตรงถึงคนพิเศษโดยไม่ต้องห่อเอง
                เหมาะทั้งวันเกิด วันครบรอบ และทุกโอกาสสำคัญ
              </p>
              <Link to="/products" className="btn-outline">
                เริ่มเลือกของขวัญ
              </Link>
            </div>
            <div className="gift-image">
              <img src={IMG.gift} alt="ช่างฝีมือกำลังประกอบแหวนโรสโกลด์อย่างประณีต" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;

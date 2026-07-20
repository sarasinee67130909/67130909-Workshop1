-- =====================================================================
-- Wibwab (วิบวับ) — โครงสร้างฐานข้อมูล (schema.sql)
-- ระบบซื้อขายเครื่องประดับแฟชั่นออนไลน์
-- ไฟล์นี้รันอัตโนมัติรอบแรกโดย Docker (/docker-entrypoint-initdb.d)
-- และรันก่อน seed.sql ตามลำดับตัวอักษร
-- =====================================================================

USE wibwab_db;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- users — ผู้ใช้ทุกคน แยกบทบาทด้วยคอลัมน์ role
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(20)  NULL,
  role          ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- addresses — ที่อยู่จัดส่งของลูกค้า (1 user มีได้หลายที่อยู่)
-- ---------------------------------------------------------------------
CREATE TABLE addresses (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  recipient_name VARCHAR(150) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  address_line   VARCHAR(255) NOT NULL,  -- บ้านเลขที่ หมู่ ถนน
  subdistrict    VARCHAR(100) NOT NULL,  -- ตำบล/แขวง
  district       VARCHAR(100) NOT NULL,  -- อำเภอ/เขต
  province       VARCHAR(100) NOT NULL,
  postal_code    VARCHAR(10)  NOT NULL,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- categories — หมวดหมู่สินค้า (แหวน สร้อยคอ ต่างหู กำไล)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- products — ข้อมูลสินค้าหลัก (ราคา/สต็อกอยู่ที่ product_variants)
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT NULL,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = ซ่อนจากหน้าร้าน (staff จัดการ)
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_products_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- product_images — รูปสินค้า (1 สินค้าหลายรูป)
-- ---------------------------------------------------------------------
CREATE TABLE product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,  -- รูปหลักที่แสดงใน ProductCard
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- product_variants — ตัวเลือกสินค้า ไซซ์ × สี × วัสดุ
-- ** สต็อกและราคาอยู่ที่ตารางนี้เสมอ — การตัดสต็อกทำที่ระดับ variant **
-- cost_price = ต้นทุนต่อชิ้น ใช้คำนวณกำไรขั้นต้นในรายงานของ admin
-- ---------------------------------------------------------------------
CREATE TABLE product_variants (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  product_id          INT NOT NULL,
  sku                 VARCHAR(50) NOT NULL UNIQUE,
  size                VARCHAR(50)  NULL,
  color               VARCHAR(50)  NULL,
  material            VARCHAR(100) NULL,
  price               DECIMAL(10,2) NOT NULL,
  cost_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_qty           INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,  -- แจ้งเตือนใกล้หมดเมื่อ stock_qty <= ค่านี้
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CHECK (stock_qty >= 0)  -- กันสต็อกติดลบที่ระดับฐานข้อมูลอีกชั้น
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- promo_codes — โค้ดส่วนลด (percent = ลด % / fixed = ลดเป็นบาท)
-- ---------------------------------------------------------------------
CREATE TABLE promo_codes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(50) NOT NULL UNIQUE,
  discount_type   ENUM('percent','fixed') NOT NULL,
  discount_value  DECIMAL(10,2) NOT NULL,
  min_order_total DECIMAL(10,2) NOT NULL DEFAULT 0,  -- ยอดสั่งซื้อขั้นต่ำที่ใช้โค้ดได้
  expires_at      DATETIME NULL,                     -- NULL = ไม่มีวันหมดอายุ
  usage_limit     INT NULL,                          -- NULL = ไม่จำกัดจำนวนครั้ง
  used_count      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- orders — คำสั่งซื้อ
-- ที่อยู่จัดส่งเก็บเป็น snapshot ณ วันสั่งซื้อ (ไม่ผูก FK ไป addresses)
-- เพื่อให้ออเดอร์เก่าไม่เพี้ยนเมื่อลูกค้าแก้ไข/ลบที่อยู่ภายหลัง
-- สถานะ: pending_payment → paid → preparing → shipped → delivered | cancelled
-- ---------------------------------------------------------------------
CREATE TABLE orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  user_id              INT NOT NULL,
  status               ENUM('pending_payment','paid','preparing','shipped','delivered','cancelled')
                       NOT NULL DEFAULT 'pending_payment',
  shipping_name        VARCHAR(150) NOT NULL,
  shipping_phone       VARCHAR(20)  NOT NULL,
  shipping_address     TEXT NOT NULL,           -- ที่อยู่เต็ม (บรรทัดเดียวรวมตำบล/อำเภอ/จังหวัด)
  shipping_postal_code VARCHAR(10)  NOT NULL,
  subtotal             DECIMAL(10,2) NOT NULL,  -- ยอดรวมก่อนหักส่วนลด
  discount_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  promo_code_id        INT NULL,
  gift_wrap            BOOLEAN NOT NULL DEFAULT FALSE,
  gift_message         TEXT NULL,               -- ข้อความการ์ดของขวัญ
  total_amount         DECIMAL(10,2) NOT NULL,  -- ยอดสุทธิที่ต้องชำระ
  slip_image           VARCHAR(255) NULL,       -- path สลิปโอนเงินที่ลูกค้าแนบ
  tracking_number      VARCHAR(100) NULL,       -- เลขพัสดุ (staff กรอกตอนจัดส่ง)
  paid_at              DATETIME NULL,           -- เวลาที่ staff ยืนยันการชำระเงิน
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL,
  INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- order_items — รายการสินค้าในออเดอร์
-- unit_price/unit_cost = ราคาและต้นทุน ณ วันซื้อ (snapshot)
-- เพื่อให้ประวัติออเดอร์และรายงานกำไรถูกต้อง แม้ราคา/ต้นทุนใน variant เปลี่ยนภายหลัง
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  variant_id INT NOT NULL,
  quantity   INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_cost  DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  -- RESTRICT: ห้ามลบ variant ที่มีประวัติการขายแล้ว (ให้ปิด is_active แทน)
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
  CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- reviews — รีวิวสินค้า (รีวิวได้เฉพาะออเดอร์ที่สถานะ delivered)
-- UNIQUE กันรีวิวสินค้าเดิมซ้ำในออเดอร์เดียวกัน
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  order_id   INT NOT NULL,
  rating     TINYINT NOT NULL,
  comment    TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_once (user_id, product_id, order_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- password_resets — token สำหรับลืมรหัสผ่าน (§5.11)
-- จำลองการส่งอีเมล: backend log ลิงก์ + ส่งกลับใน response แทนการส่งอีเมลจริง
-- ---------------------------------------------------------------------
CREATE TABLE password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  token      VARCHAR(255) NOT NULL UNIQUE,
  user_id    INT NOT NULL,
  expires_at DATETIME NOT NULL,  -- หมดอายุ 30 นาทีหลังสร้าง
  used       BOOLEAN NOT NULL DEFAULT FALSE,  -- ใช้ได้ครั้งเดียว
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

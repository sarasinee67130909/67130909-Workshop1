# โครงสร้างโปรเจกต์ — Wibwab (วิบวับ)

ระบบซื้อขายเครื่องประดับแฟชั่นออนไลน์ | Online Fashion Jewelry E-Commerce System

> **เอกสารนี้เป็นแนวทางหลักสำหรับผู้พัฒนาและ AI Agent (เช่น Claude Code)**
> ก่อนสร้างหรือแก้ไขไฟล์ใดๆ ให้ยึดโครงสร้างและกติกาในเอกสารนี้เป็นหลัก

---

## 1. ภาพรวมโปรเจกต์ (Context สำหรับ AI)

- เว็บแอป E-Commerce ขายเครื่องประดับแฟชั่น (แหวน สร้อยคอ ต่างหู กำไล)
- ผู้ใช้ 3 บทบาท: **Customer** (ลูกค้า), **Staff** (พนักงาน), **Admin** (แอดมิน/ผู้บริหาร)
- สินค้ามีตัวเลือกย่อย (Variant): ไซซ์ × สี × วัสดุ — สต็อกตัดที่ระดับ Variant เสมอ
- การชำระเงินเป็นแบบ**จำลอง**: ลูกค้าแนบสลิปโอนเงิน แล้วพนักงานตรวจสอบยืนยัน
- ฟีเจอร์เด่น: ห่อของขวัญ + ข้อความการ์ด, โค้ดส่วนลด, รายงานสำหรับแอดมิน
- เป็นโปรเจกต์ระดับมหาวิทยาลัย — เน้นความถูกต้อง ครบถ้วน อ่านง่าย มากกว่า optimization ขั้นสูง

## 2. Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React (Vite) + CSS ธรรมดา, เรียก API ด้วย fetch/axios |
| Backend | Node.js + Express (JavaScript, CommonJS) |
| Database | MySQL 8 (รันบน Docker) + phpMyAdmin |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Testing | Postman (functional), JMeter (load) |
| เครื่องมือ | VS Code, Docker Compose |

## 3. โครงสร้างโฟลเดอร์ทั้งหมด

```
โปรเจค Wibwab-วิบวับ/
├── README.md                     # เอกสารเสนอโครงงาน
├── PROJECT_STRUCTURE.md          # ไฟล์นี้
│
├── Wibwab-Backend/
│   ├── package.json
│   ├── .env.example              # ตัวอย่างค่า env (ห้าม commit .env จริง)
│   ├── .gitignore                # node_modules, .env, uploads/
│   ├── docker-compose.yml        # MySQL + phpMyAdmin
│   ├── server.js                 # จุดเริ่มต้น: โหลด env, start express
│   │
│   ├── database/
│   │   ├── schema.sql            # สร้างตารางทั้งหมด (utf8mb4)
│   │   └── seed.sql              # ข้อมูลตัวอย่าง: users 3 role, สินค้า, variant, โค้ดส่วนลด
│   │
│   ├── src/
│   │   ├── app.js                # สร้าง express app, ติดตั้ง middleware กลาง, ผูก routes
│   │   ├── config/
│   │   │   └── db.js             # mysql2 connection pool (charset utf8mb4)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js           # verifyToken — ตรวจ JWT
│   │   │   ├── role.js           # requireRole('staff'|'admin') — ตรวจสิทธิ์
│   │   │   ├── upload.js         # multer — อัปโหลดรูปสินค้า/สลิป
│   │   │   └── errorHandler.js   # error handler กลาง (ตอบ JSON format เดียวกัน)
│   │   │
│   │   ├── routes/               # ประกาศ endpoint เท่านั้น — logic อยู่ใน controllers
│   │   │   ├── auth.routes.js        # POST /api/auth/register, /login
│   │   │   ├── product.routes.js     # GET /api/products, /api/products/:id
│   │   │   ├── cart.routes.js        # GET/POST/PUT/DELETE /api/cart
│   │   │   ├── order.routes.js       # POST /api/orders, GET /api/orders/my, แนบสลิป
│   │   │   ├── review.routes.js      # POST /api/reviews (เฉพาะคนที่ซื้อจริง)
│   │   │   ├── staff.routes.js       # /api/staff/* — จัดการออเดอร์ สต็อก สินค้า
│   │   │   └── admin.routes.js       # /api/admin/* — dashboard และรายงาน
│   │   │
│   │   ├── controllers/          # รับ req → เรียก service → ส่ง response
│   │   │   ├── auth.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── cart.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── review.controller.js
│   │   │   ├── staff.controller.js
│   │   │   └── admin.controller.js
│   │   │
│   │   ├── services/             # business logic + SQL query
│   │   │   ├── auth.service.js
│   │   │   ├── product.service.js
│   │   │   ├── cart.service.js
│   │   │   ├── order.service.js  # สำคัญ: ใช้ transaction ตัด/คืนสต็อกระดับ variant
│   │   │   ├── review.service.js
│   │   │   ├── stock.service.js  # Stock Engine: ตัด, คืน, แจ้งเตือนใกล้หมด
│   │   │   └── report.service.js # ยอดขาย, สต็อก, กำไร สำหรับ admin
│   │   │
│   │   └── utils/
│   │       ├── validators.js     # ตรวจ input (email, จำนวน > 0 ฯลฯ)
│   │       └── orderStatus.js    # ค่าคงที่สถานะออเดอร์ (single source of truth)
│   │
│   └── uploads/                  # รูปสินค้า + สลิปโอนเงิน (อยู่ใน .gitignore)
│       ├── products/
│       └── slips/
│
└── Wibwab-Frontend/
    ├── package.json
    ├── .gitignore                # node_modules, dist/
    ├── vite.config.js            # ตั้ง proxy /api → http://localhost:3000
    ├── index.html
    │
    └── src/
        ├── main.jsx              # entry point + react-router
        ├── App.jsx               # กำหนด routes ทั้งหมด แยกตาม role
        │
        ├── api/                  # รวมการเรียก backend ไว้ที่เดียว — ห้าม fetch ตรงใน component
        │   ├── client.js         # axios instance + base URL + แนบ JWT อัตโนมัติ
        │   ├── auth.api.js
        │   ├── product.api.js
        │   ├── cart.api.js
        │   ├── order.api.js
        │   ├── staff.api.js
        │   └── admin.api.js
        │
        ├── context/
        │   ├── AuthContext.jsx   # เก็บ user + token + role ปัจจุบัน
        │   └── CartContext.jsx   # ตะกร้าฝั่ง client
        │
        ├── components/           # ชิ้นส่วน UI ใช้ซ้ำ
        │   ├── common/           # Navbar, Footer, Button, Modal, Loading, ProtectedRoute
        │   ├── product/          # ProductCard, ProductGrid, FilterSidebar, VariantSelector, SizeGuideModal
        │   ├── cart/             # CartItem, GiftWrapOption, PromoCodeInput, OrderSummary
        │   └── dashboard/        # StatCard, DataTable, StatusBadge, SimpleChart
        │
        ├── pages/
        │   ├── customer/         # ธีม: Rose Gold (#B76E79) / CTA ทอง (#C9A227) / พื้น #FAF6F1
        │   │   ├── HomePage.jsx
        │   │   ├── ProductListPage.jsx
        │   │   ├── ProductDetailPage.jsx
        │   │   ├── CartPage.jsx
        │   │   ├── CheckoutPage.jsx
        │   │   ├── OrderHistoryPage.jsx
        │   │   ├── LoginPage.jsx
        │   │   └── RegisterPage.jsx
        │   │
        │   ├── staff/            # ธีม: Teal (#0F766E) / sidebar #134E4A / พื้น #F6F8F8
        │   │   ├── StaffLoginPage.jsx
        │   │   ├── StaffDashboardPage.jsx
        │   │   ├── OrderManagePage.jsx
        │   │   ├── InventoryPage.jsx
        │   │   └── ProductManagePage.jsx
        │   │
        │   └── admin/            # ธีม: Slate (#1E293B) / ไฮไลต์ทอง (#B08D57) / พื้น #F8F9FB
        │       ├── AdminLoginPage.jsx
        │       ├── AdminDashboardPage.jsx
        │       ├── SalesReportPage.jsx
        │       ├── StockReportPage.jsx
        │       └── ProfitReportPage.jsx
        │
        └── styles/
            ├── global.css        # reset + ฟอนต์ + ตัวแปรสีกลาง
            ├── customer.css
            ├── staff.css
            └── admin.css
```

## 4. ตารางหลักในฐานข้อมูล (ให้ schema.sql สร้างตามนี้)

| ตาราง | เก็บอะไร | หมายเหตุ |
|---|---|---|
| `users` | ผู้ใช้ทุกคน | คอลัมน์ `role` ENUM('customer','staff','admin') |
| `addresses` | ที่อยู่จัดส่งของลูกค้า | 1 user มีได้หลายที่อยู่ |
| `categories` | หมวดหมู่ (แหวน สร้อย ต่างหู กำไล) | |
| `products` | ข้อมูลสินค้าหลัก | ชื่อ, คำอธิบาย, หมวด, สถานะแสดง/ซ่อน |
| `product_images` | รูปสินค้า | 1 สินค้าหลายรูป |
| `product_variants` | **ตัวเลือกสินค้า: ไซซ์/สี/วัสดุ** | มี `sku`, `price`, `stock_qty`, `low_stock_threshold` — **สต็อกอยู่ตารางนี้** |
| `promo_codes` | โค้ดส่วนลด | ประเภทลด (%, บาท), วันหมดอายุ |
| `orders` | คำสั่งซื้อ | สถานะ, ยอดรวม, ห่อของขวัญ (boolean), ข้อความการ์ด, slip_image |
| `order_items` | รายการสินค้าในออเดอร์ | FK → `product_variants`, เก็บราคา ณ วันซื้อ |
| `reviews` | รีวิว | รีวิวได้เฉพาะ order ที่สถานะ delivered |

**สถานะออเดอร์ (ใช้ค่าเดียวกันทั้ง backend/frontend):**
`pending_payment` → `paid` (พนักงานยืนยันสลิป) → `preparing` → `shipped` → `delivered` | `cancelled`

## 5. กติกาการพัฒนา (Conventions — AI ต้องปฏิบัติตาม)

1. **แยกชั้นให้ชัด**: routes ประกาศ endpoint / controllers รับ-ส่ง / services มี logic + SQL — ห้ามเขียน SQL ใน controller
2. **SQL ใช้ prepared statement เสมอ** (`pool.execute('... WHERE id = ?', [id])`) — ห้ามต่อ string กัน SQL injection
3. **การตัดสต็อก**: การสร้างออเดอร์ต้องอยู่ใน MySQL transaction — insert order + insert order_items + update stock ทั้งหมดสำเร็จหรือ rollback ทั้งหมด และเช็ค `stock_qty >= จำนวนที่ซื้อ` ก่อนตัดทุกครั้ง
4. **รูปแบบ response เดียวกันทั้งระบบ**: สำเร็จ `{ success: true, data: ... }` / ผิดพลาด `{ success: false, message: '...' }`
5. **การป้องกัน route**: ทุก route ของ staff ต้องผ่าน `verifyToken + requireRole('staff','admin')` และของ admin ผ่าน `requireRole('admin')`
6. **ภาษาไทยต้องรอด**: connection MySQL และตารางทั้งหมดใช้ `utf8mb4`
7. **Frontend เรียก API ผ่านไฟล์ใน `Wibwab-Frontend/src/api/` เท่านั้น** เพื่อให้เปลี่ยน base URL ที่เดียวได้ตอน deploy
8. **สีของแต่ละ role** ใช้ตามที่ระบุใน comment ของโฟลเดอร์ pages (ธีม Rose Gold / Teal / Slate+Gold)
9. คอมเมนต์ในโค้ดเขียนเป็นภาษาไทยได้ เพื่อให้ผู้จัดทำอ่านทบทวนและอธิบายต่ออาจารย์ได้
10. ยังไม่ต้องทำ: payment gateway จริง, ส่งอีเมล/SMS จริง, ระบบคืนสินค้า, สะสมแต้ม (อยู่นอกขอบเขต)

## 6. Environment Variables (.env.example)

```env
# Backend
PORT=3000
JWT_SECRET=change-this-secret

# Database (ตรงกับ docker-compose.yml)
DB_HOST=localhost
DB_PORT=3306
DB_USER=wibwab
DB_PASSWORD=wibwab_pass
DB_NAME=wibwab_db
```

## 7. docker-compose.yml (บริการที่ต้องมี)

ไฟล์อยู่ที่ `Wibwab-Backend/docker-compose.yml`

- `mysql` — image mysql:8, พอร์ต 3306, volume `mysql_data` (ข้อมูลไม่หายเมื่อ restart), mount `./database` เข้า `/docker-entrypoint-initdb.d` เพื่อรัน schema.sql + seed.sql อัตโนมัติรอบแรก, command กำหนด `--character-set-server=utf8mb4`
- `phpmyadmin` — พอร์ต 8081 ชี้ไปที่ mysql (เดิมตั้งใจใช้ 8080 แต่ชนกับ phpMyAdmin ของโปรเจค Easy-Check ที่รันค้างไว้ในเครื่อง)

## 8. คำสั่งรันโปรเจกต์

```bash
# 1) ฐานข้อมูล (รันจากในโฟลเดอร์ Backend)
cd Wibwab-Backend
docker compose up -d          # MySQL: localhost:3306, phpMyAdmin: localhost:8081

# 2) Backend (terminal เดิม)
npm install && npm run dev    # http://localhost:3000

# 3) Frontend (เปิด terminal ใหม่)
cd Wibwab-Frontend
npm install && npm run dev    # http://localhost:5173
```

## 9. ลำดับการพัฒนาที่แนะนำ (สำหรับ AI Agent)

1. `docker-compose.yml` + `database/schema.sql` + `seed.sql`
2. Backend: config/db → middleware → auth → products → cart → orders (พร้อม transaction สต็อก)
3. Backend: staff routes → admin reports
4. Frontend: api client + AuthContext → หน้า customer → หน้า staff → หน้า admin
5. ทดสอบด้วย Postman collection ตาม endpoint ในข้อ 3 ของเอกสารนี้

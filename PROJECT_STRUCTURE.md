# โครงสร้างโปรเจกต์ — Wibwab (วิบวับ)

ระบบซื้อขายเครื่องประดับแฟชั่นออนไลน์ | Online Fashion Jewelry E-Commerce System

> **เอกสารนี้เป็นแนวทางหลักสำหรับผู้พัฒนาและ AI Agent (เช่น Claude Code)**
> ก่อนสร้างหรือแก้ไขไฟล์ใดๆ ให้ยึดโครงสร้างและกติกาในเอกสารนี้เป็นหลัก
>
> **สถานะล่าสุด: ระบบทำงานครบทุกฟีเจอร์หลักตามขอบเขตแล้ว** เอกสารนี้อัปเดตให้ตรงกับโค้ดจริง ไม่ใช่แผนตั้งต้นอีกต่อไป

---

## 1. ภาพรวมโปรเจกต์ (Context สำหรับ AI)

- เว็บแอป E-Commerce ขายเครื่องประดับแฟชั่น (แหวน สร้อยคอ ต่างหู กำไล)
- ผู้ใช้ 3 บทบาท: **Customer** (ลูกค้า), **Staff** (พนักงาน), **Admin** (แอดมิน/ผู้บริหาร) — แยกประตูล็อกอิน/session กันคนละชุดโดยสิ้นเชิง
- สินค้ามีตัวเลือกย่อย (Variant): ไซซ์ × สี × วัสดุ — สต็อกตัดที่ระดับ Variant เสมอ
- การชำระเงินเป็นแบบ**จำลอง**: ลูกค้าแนบสลิปโอนเงิน แล้วพนักงานตรวจสอบยืนยัน (ตามดีไซน์เดิม ไม่ใช่ของค้าง)
- ฟีเจอร์เด่น: ห่อของขวัญ + ข้อความการ์ด, โค้ดส่วนลด + กระเป๋าคูปองลูกค้า (auto-push), รายการโปรด, ระบบแจ้งเตือนแบบ real-time bell, รายงาน+export สำหรับแอดมิน, รีเซ็ตรหัสผ่านด้วย OTP อีเมลจริงฝั่ง staff/admin
- เป็นโปรเจกต์ระดับมหาวิทยาลัย — เน้นความถูกต้อง ครบถ้วน อ่านง่าย มากกว่า optimization ขั้นสูง

## 2. Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React (Vite) + CSS ธรรมดา, เรียก API ด้วย axios |
| Backend | Node.js + Express (JavaScript, CommonJS) |
| Database | MySQL 8 (รันบน Docker) + phpMyAdmin |
| Auth | JWT (jsonwebtoken) + bcryptjs, แยก context ต่อ role |
| อีเมล | nodemailer (SMTP จริงผ่าน Gmail App Password) — ใช้เฉพาะ OTP รีเซ็ตรหัสผ่านฝั่ง staff/admin |
| Testing | Postman (functional), JMeter (load) |
| เครื่องมือ | VS Code, Docker Compose |

## 3. โครงสร้างโฟลเดอร์ทั้งหมด (ตรงกับโค้ดปัจจุบัน)

```
โปรเจค Wibwab-วิบวับ/
├── README (1).md                  # เอกสารเสนอโครงงาน (ข้อเสนอ/ขอบเขต/แผนดำเนินงานฉบับส่ง)
├── PROJECT_STRUCTURE.md           # ไฟล์นี้ — แนวทางทางเทคนิคสำหรับ dev/AI
│
├── Wibwab-Backend/
│   ├── package.json               # deps หลัก: express, mysql2, bcryptjs, jsonwebtoken, multer, nodemailer, exceljs/pdfkit ฯลฯ
│   ├── .env.example                # ตัวอย่างค่า env (ห้าม commit .env จริง)
│   ├── .gitignore                  # node_modules, .env, uploads/
│   ├── docker-compose.yml          # MySQL (3306) + phpMyAdmin (8081)
│   ├── server.js                   # จุดเริ่มต้น: โหลด env, start express
│   │
│   ├── database/
│   │   ├── schema.sql              # สร้างตารางทั้งหมด (utf8mb4) — รันอัตโนมัติเฉพาะ volume ใหม่
│   │   └── seed.sql                # ข้อมูลตัวอย่าง: users 3 role (อีเมล generic เช่น staff@wibwab.com), สินค้า, variant, โค้ดส่วนลด
│   │
│   ├── src/
│   │   ├── app.js                  # สร้าง express app, ติดตั้ง middleware กลาง, mount routes ทั้งหมด
│   │   ├── config/
│   │   │   └── db.js               # mysql2 connection pool (charset utf8mb4)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js             # verifyToken — ตรวจ JWT
│   │   │   ├── role.js             # requireRole('staff'|'admin') — ตรวจสิทธิ์
│   │   │   ├── upload.js           # multer — อัปโหลดรูปสินค้า/สลิป
│   │   │   └── errorHandler.js     # error handler กลาง (ตอบ JSON format เดียวกัน)
│   │   │
│   │   ├── routes/                 # ประกาศ endpoint เท่านั้น — logic อยู่ใน controllers
│   │   │   ├── auth.routes.js          # /api/auth — register, login, me, logout, forgot/reset-password (ลูกค้า), profile, change-password
│   │   │   ├── product.routes.js       # /api/products
│   │   │   ├── cart.routes.js          # ไม่ได้ mount ใน app.js โดยดีไซน์ — ตะกร้าเก็บฝั่ง client (localStorage) เท่านั้น
│   │   │   ├── order.routes.js         # /api/orders — สร้างออเดอร์, ประวัติ, แนบสลิป, validate-promo
│   │   │   ├── review.routes.js        # /api/reviews
│   │   │   ├── address.routes.js       # /api/addresses — CRUD ที่อยู่จัดส่ง (backend จริง ไม่ใช่ mock)
│   │   │   ├── favorite.routes.js      # /api/favorites — รายการโปรดลูกค้า
│   │   │   ├── coupon.routes.js        # /api/coupons/my — กระเป๋าคูปองของลูกค้าที่ล็อกอินอยู่
│   │   │   ├── staff.routes.js         # /api/staff/* — dashboard, orders, inventory, products, promos (CRUD+push), notifications
│   │   │   ├── admin.routes.js         # /api/admin/* — dashboard, รายงาน 3 แบบ + export, notifications
│   │   │   ├── staffAuth.routes.js     # /api/staff-auth — ลืมรหัสผ่านพนักงานด้วย OTP อีเมลจริง (public, แยกจาก /api/staff)
│   │   │   └── adminAuth.routes.js     # /api/admin-auth — ลืมรหัสผ่านแอดมินด้วย OTP อีเมลจริง (public, แยกจาก /api/admin)
│   │   │
│   │   ├── controllers/            # รับ req → เรียก service → ส่ง response {success, data|message}
│   │   │   ├── auth.controller.js, product.controller.js, cart.controller.js (ยังไม่ได้ mount),
│   │   │   ├── order.controller.js, review.controller.js, address.controller.js, favorite.controller.js, coupon.controller.js,
│   │   │   ├── staff.controller.js, admin.controller.js, staffAuth.controller.js, adminAuth.controller.js
│   │   │
│   │   ├── services/               # business logic + SQL query ทั้งหมดอยู่ที่นี่
│   │   │   ├── auth.service.js       # เรียก couponService.grantWelcomeCoupons() แบบ fire-and-forget ตอน register()
│   │   │   ├── product.service.js, cart.service.js (ยังไม่ได้ใช้งานจริง)
│   │   │   ├── order.service.js      # transaction ตัด/คืนสต็อก + checkPromo/validatePromo ตรวจกระเป๋าคูปอง (user_coupons)
│   │   │   ├── review.service.js, address.service.js, favorite.service.js
│   │   │   ├── coupon.service.js     # listPromoCodes/create/update, pushCouponToAllCustomers, grantWelcomeCoupons, listMyCoupons
│   │   │   ├── stock.service.js      # Stock Engine: ตัด/คืนสต็อก, แจ้งเตือนใกล้หมด
│   │   │   ├── notification.service.js  # สร้าง/อ่าน/ลบ แจ้งเตือน staff+admin (ใช้ร่วมกันเป็น inbox กลาง)
│   │   │   ├── report.service.js     # ยอดขาย/สต็อก/กำไร สำหรับ admin
│   │   │   ├── export.service.js     # export Excel/PDF สำหรับรายงาน admin
│   │   │   ├── staffAuth.service.js  # ขอ/ยืนยัน OTP รีเซ็ตรหัสผ่าน role='staff' (SMTP จริง)
│   │   │   └── adminAuth.service.js  # ขอ/ยืนยัน OTP รีเซ็ตรหัสผ่าน role='admin' (SMTP จริง)
│   │   │
│   │   └── utils/
│   │       ├── validators.js         # ตรวจ input (email, จำนวน > 0 ฯลฯ)
│   │       ├── orderStatus.js        # ค่าคงที่สถานะออเดอร์ (single source of truth)
│   │       ├── couponType.js         # PUSH_TRIGGER = { MANUAL, ON_REGISTER }
│   │       ├── notificationType.js   # ค่าคงที่ประเภทการแจ้งเตือน
│   │       └── mailer.js             # nodemailer wrapper (sendMail) — ใช้ SMTP_* จาก .env, ใช้ร่วมกันทั้ง staffAuth/adminAuth
│   │
│   └── uploads/                    # รูปสินค้า + สลิปโอนเงิน (อยู่ใน .gitignore)
│       ├── products/
│       └── slips/
│
└── Wibwab-Frontend/
    ├── package.json
    ├── .gitignore                  # node_modules, dist/
    ├── vite.config.js              # ตั้ง proxy /api → http://localhost:8080
    ├── index.html
    │
    └── src/
        ├── main.jsx                # entry point + react-router
        ├── App.jsx                 # กำหนด routes ทั้งหมด แยกตาม role
        │
        ├── api/                    # รวมการเรียก backend ไว้ที่เดียว — ห้าม fetch/axios ตรงใน component
        │   ├── client.js            # axios instance + base URL + แนบ JWT อัตโนมัติ
        │   ├── auth.api.js, product.api.js, cart.api.js, order.api.js, review.api.js
        │   ├── address.api.js       # backend จริงแล้ว (ไม่ใช่ mock อีกต่อไป)
        │   ├── favorite.api.js, coupon.api.js
        │   ├── staff.api.js, admin.api.js
        │   ├── staffAuth.api.js     # ลืมรหัสผ่านพนักงาน (OTP)
        │   └── adminAuth.api.js     # ลืมรหัสผ่านแอดมิน (OTP)
        │
        ├── context/
        │   ├── createAuthContext.jsx    # factory สร้าง auth context ใช้ซ้ำ 3 role
        │   ├── CustomerAuthContext.jsx, StaffAuthContext.jsx, AdminAuthContext.jsx  # session แยกกันเด็ดขาดต่อ role (คนละ localStorage key)
        │   ├── CartContext.jsx          # ตะกร้าฝั่ง client (localStorage) + เรียก validate-promo จริงกับ backend
        │   └── FavoritesContext.jsx
        │
        ├── components/              # ชิ้นส่วน UI ใช้ซ้ำ
        │   ├── common/     # Navbar, Footer, Button, Modal, Loading, ProtectedRoute, StaffLayout/Sidebar/Topbar, AdminLayout/Sidebar/Topbar, ExportMenu
        │   ├── product/    # ProductCard, ProductGrid, FilterSidebar, VariantSelector, SizeGuideModal
        │   ├── cart/       # CartItem, GiftWrapOption, PromoCodeInput, OrderSummary
        │   └── dashboard/  # StatCard, DataTable, StatusBadge, SimpleChart, Pagination, NotificationBell (พร้อม popup รีวิว/แจ้งเตือน)
        │
        ├── pages/
        │   ├── customer/           # ธีม: Rose Gold (#B76E79) / CTA ทอง (#C9A227) / พื้น #FAF6F1
        │   │   ├── HomePage, ProductListPage, ProductDetailPage, CartPage, CheckoutPage, OrderHistoryPage
        │   │   ├── LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
        │   │   ├── ProfilePage           # @ /account — โปรไฟล์, ที่อยู่ (CRUD), เปลี่ยนรหัสผ่าน, ลิงก์ไปคูปอง/รายการโปรด
        │   │   ├── MyCouponsPage        # @ /coupons — กระเป๋าคูปอง (รวมคูปองต้อนรับสมาชิกใหม่)
        │   │   └── FavoritesPage        # @ /favorites
        │   │
        │   ├── staff/              # ธีม: Teal (#0F766E) / sidebar #134E4A / พื้น #F6F8F8
        │   │   ├── StaffLoginPage, StaffForgotPasswordPage (OTP อีเมลจริง)
        │   │   ├── StaffDashboardPage, OrderManagePage, InventoryPage, ProductManagePage
        │   │   └── PromoManagePage, PromoEditPage    # จัดการโค้ดส่วนลด + ปุ่ม push เข้ากระเป๋าลูกค้าทุกคน
        │   │
        │   └── admin/              # ธีม: Slate (#1E293B) / ไฮไลต์ทอง (#B08D57) / พื้น #F8F9FB — เขตงาน Dev2 ทั้งโฟลเดอร์
        │       ├── AdminLoginPage, AdminForgotPasswordPage (OTP อีเมลจริง)
        │       ├── AdminDashboardPage    # KPI + กราฟยอดขาย + export
        │       ├── SalesReportPage, StockReportPage, ProfitReportPage   # แต่ละหน้ามี export Excel/PDF และตัวเลือกช่วงเวลา
        │
        └── styles/
            ├── global.css, customer.css, staff.css, admin.css
```

## 4. ตารางในฐานข้อมูล (ตรงกับ `database/schema.sql` ปัจจุบัน)

| ตาราง | เก็บอะไร | หมายเหตุ |
|---|---|---|
| `users` | ผู้ใช้ทุกคน | คอลัมน์ `role` ENUM('customer','staff','admin') |
| `addresses` | ที่อยู่จัดส่งของลูกค้า | 1 user มีได้หลายที่อยู่ |
| `categories` | หมวดหมู่ (แหวน สร้อย ต่างหู กำไล) | |
| `products` | ข้อมูลสินค้าหลัก | ชื่อ, คำอธิบาย, หมวด, สถานะแสดง/ซ่อน |
| `product_images` | รูปสินค้า | 1 สินค้าหลายรูป |
| `product_variants` | ตัวเลือกสินค้า: ไซซ์/สี/วัสดุ | มี `sku`, `price`, `cost_price`, `stock_qty`, `low_stock_threshold` — **สต็อกอยู่ตารางนี้** |
| `promo_codes` | โค้ดส่วนลด | ประเภทลด (%, บาท), วันหมดอายุ, `push_trigger` ('manual'/'on_register'), `label` สำหรับแสดงในกระเป๋าคูปอง |
| `user_coupons` | กระเป๋าคูปองลูกค้า | โค้ดที่ถูก push ให้ user คนใดคนหนึ่งโดยเฉพาะ — `UNIQUE(user_id, promo_code_id)` กันแจกซ้ำ |
| `orders` | คำสั่งซื้อ | สถานะ, ยอดรวม, ห่อของขวัญ, ข้อความการ์ด, slip_image, tracking_number |
| `order_items` | รายการสินค้าในออเดอร์ | FK → `product_variants`, เก็บราคา+ต้นทุน ณ วันซื้อ (snapshot) |
| `reviews` | รีวิว | รีวิวได้เฉพาะ order ที่สถานะ delivered |
| `favorites` | รายการโปรดของลูกค้า | `UNIQUE(user_id, product_id)` |
| `password_resets` | token ลืมรหัสผ่านลูกค้า | แบบลิงก์ + จำลองการส่งอีเมล (ตามดีไซน์เดิม §5.11) |
| `password_reset_otps` | OTP 6 หลักลืมรหัสผ่าน staff/admin | ส่งอีเมลจริงผ่าน `utils/mailer.js`, หมดอายุ 10 นาที, ใช้ได้ครั้งเดียว, ใช้ร่วมกันทั้งสอง role (แยกด้วย `users.role` ตอน query) |
| `notifications` | แจ้งเตือน staff/admin | inbox กลางที่ทุกคนเห็นร่วมกัน — ประเภท new_order, slip_uploaded, order_cancelled, new_review, low_stock, order_overdue |

**สถานะออเดอร์ (ใช้ค่าเดียวกันทั้ง backend/frontend):**
`pending_payment` → `paid` (พนักงานยืนยันสลิป) → `preparing` → `shipped` → `delivered` | `cancelled`

## 5. กติกาการพัฒนา (Conventions)

1. **แยกชั้นให้ชัด**: routes ประกาศ endpoint / controllers รับ-ส่ง / services มี logic + SQL — ห้ามเขียน SQL ใน controller
2. **SQL ใช้ prepared statement เสมอ** (`pool.execute('... WHERE id = ?', [id])`) — ห้ามต่อ string กัน SQL injection
3. **การตัดสต็อก**: การสร้างออเดอร์ต้องอยู่ใน MySQL transaction — insert order + insert order_items + update stock ทั้งหมดสำเร็จหรือ rollback ทั้งหมด และเช็ค `stock_qty >= จำนวนที่ซื้อ` ก่อนตัดทุกครั้ง
4. **รูปแบบ response เดียวกันทั้งระบบ**: สำเร็จ `{ success: true, data: ... }` / ผิดพลาด `{ success: false, message: '...' }`
5. **การป้องกัน route**: ทุก route ของ staff ต้องผ่าน `verifyToken + requireRole('staff','admin')` และของ admin ผ่าน `requireRole('admin')` — ยกเว้น route OTP (`/api/staff-auth`, `/api/admin-auth`) ที่ต้องเป็น public โดยดีไซน์ (ผู้ใช้ยังไม่มี token ตอนลืมรหัสผ่าน) จึง mount แยก prefix ไม่ให้โดน middleware กลางของ `/api/staff`/`/api/admin` บล็อก
6. **ภาษาไทยต้องรอด**: connection MySQL และตารางทั้งหมดใช้ `utf8mb4`
7. **Frontend เรียก API ผ่านไฟล์ใน `Wibwab-Frontend/src/api/` เท่านั้น** เพื่อให้เปลี่ยน base URL ที่เดียวได้ตอน deploy
8. **สีของแต่ละ role** ใช้ตามที่ระบุใน comment ของโฟลเดอร์ pages (ธีม Rose Gold / Teal / Slate+Gold)
9. คอมเมนต์ในโค้ดเขียนเป็นภาษาไทยได้ เพื่อให้ผู้จัดทำอ่านทบทวนและอธิบายต่ออาจารย์ได้
10. **ตะกร้าสินค้าเป็น client-only โดยดีไซน์**: ไม่มี cart backend จริง (`cart.routes.js` มีอยู่แต่ไม่ได้ mount ใน `app.js`) — เก็บใน localStorage ผ่าน `CartContext.jsx` ทั้งหมด นี่ไม่ใช่งานค้าง
11. **ลืมรหัสผ่านลูกค้า**: ใช้ token จริง (ตาราง `password_resets` — สุ่ม, หมดอายุ 30 นาที, ใช้ได้ครั้งเดียว) แต่**จำลองการส่งอีเมล**: response ของ `/api/auth/forgot-password` ส่งลิงก์รีเซ็ตกลับมาให้แสดงบนหน้าจอ/console แทนการส่งอีเมลจริง (คงดีไซน์เดิมไว้โดยตั้งใจ — ไม่แก้ตาม flow ของ staff/admin)
12. **ลืมรหัสผ่าน staff/admin**: ใช้ OTP 6 หลัก + **ส่งอีเมลจริง** ผ่าน `utils/mailer.js` (nodemailer + Gmail SMTP App Password) — เป็นกลไกคนละแบบกับข้อ 11 โดยตั้งใจ (แยกตารางกัน ไม่ใช้ `password_resets` ร่วม) เพื่อลดความเสี่ยงชนกันของ UNIQUE constraint และแยกความรับผิดชอบให้ชัด
13. **คูปอง**: โค้ดที่เคยถูก push เข้า `user_coupons` ให้ user คนใดคนหนึ่งแล้ว จะใช้ได้เฉพาะเจ้าของแถวเท่านั้น (ตรวจใน `order.service.js:checkPromo`) ส่วนโค้ด public ที่ไม่เคยถูก push ให้ใคร ยังพิมพ์ใช้ได้ทุกคนตามเดิม
14. **Payment gateway จริง, ส่ง SMS จริง, ระบบคืนสินค้า, สะสมแต้ม** — ยังคงอยู่นอกขอบเขตของโครงงาน (ตาม §5.4 ของ README)

## 6. Environment Variables (`.env.example`)

```env
# Backend
PORT=8080
JWT_SECRET=change-this-secret
FRONTEND_URL=http://localhost:5173

# Database (ตรงกับ docker-compose.yml)
DB_HOST=localhost
DB_PORT=3306
DB_USER=wibwab
DB_PASSWORD=wibwab_pass
DB_NAME=wibwab_db

# SMTP — ใช้ส่งอีเมล OTP รีเซ็ตรหัสผ่านฝั่ง staff/admin (ของจริง ไม่จำลอง)
# Gmail: ต้องเปิด 2-Step Verification ในบัญชีที่จะใช้ "ส่ง" ก่อน แล้วสร้าง App Password
# ที่ https://myaccount.google.com/apppasswords (ห้ามใช้รหัสผ่าน Gmail จริงตรงๆ ใช้ไม่ได้)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-sending-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="วิบวับ <your-sending-email@gmail.com>"
```

> `.env` จริง (มีเครดิตจริง) ต้องอยู่นอก git เสมอ — `.env.example` เป็นแค่ template ห้ามใส่ค่าจริงลงไป

## 7. docker-compose.yml (บริการที่มีอยู่จริง)

ไฟล์อยู่ที่ `Wibwab-Backend/docker-compose.yml`

- `mysql` — image mysql:8, พอร์ต 3306, volume `mysql_data` (ข้อมูลไม่หายเมื่อ restart), mount `./database` เข้า `/docker-entrypoint-initdb.d` เพื่อรัน schema.sql + seed.sql อัตโนมัติ**เฉพาะตอน volume ว่าง**, command กำหนด `--character-set-server=utf8mb4`
- `phpmyadmin` — พอร์ต **8081** (ไม่ใช่ 8080 — พอร์ตนั้นชนกับโปรเจคอื่นในเครื่อง dev) ชี้ไปที่ mysql

> ถ้าแก้ `schema.sql` หลังจากที่ container เคยรันไปแล้ว (volume ไม่ว่าง) **ต้อง migrate มือ** ด้วย `docker exec wibwab-mysql mysql -uwibwab -pwibwab_pass wibwab_db -e "ALTER TABLE..."` หรือ `docker compose down -v && up` เพื่อรีเซ็ตใหม่ทั้งหมด (จะเสียข้อมูลที่ใส่ไปมือ เช่น อีเมลจริงที่ตั้งไว้)

## 8. คำสั่งรันโปรเจกต์

```bash
# 1) ฐานข้อมูล (รันจากในโฟลเดอร์ Backend)
cd Wibwab-Backend
docker compose up -d          # MySQL: localhost:3306, phpMyAdmin: localhost:8081

# 2) Backend (terminal เดิม)
npm install && npm run dev    # http://localhost:8080 — ใช้ nodemon เพื่อ auto-reload ตอนแก้ route/controller/service
                               # (ถ้ารันด้วย `node server.js` เฉยๆ ต้อง restart มือทุกครั้งที่แก้ route)

# 3) Frontend (เปิด terminal ใหม่)
cd Wibwab-Frontend
npm install && npm run dev    # http://localhost:5173
```

## 9. การแบ่งงานระหว่างผู้พัฒนา (Work Division)

โปรเจกต์นี้พัฒนาโดย 2 คน — **AI Agent ต้องตรวจสอบก่อนว่ากำลังทำงานให้ใคร แล้วแก้ไขเฉพาะไฟล์ในเขตงานของคนนั้น** ห้ามแก้ไฟล์ในเขตงานของอีกคนโดยไม่ได้รับการร้องขอ

| | **Dev1 (เจ้าของ repo)** | **Dev2 (เพื่อนร่วมทีม)** |
|---|---|---|
| **Role หลัก** | ลูกค้า (Customer) ทั้ง Frontend + Backend | พนักงาน (Staff) + แอดมิน (Admin) ทั้ง Frontend + Backend |
| **Backend** | `auth.routes/controller/service.js` (สมัคร/ล็อกอิน/ลืมรหัสผ่านลูกค้า/โปรไฟล์), products, order, review, address, favorite | `staff.*`, `admin.*` ทั้งหมด, `staffAuth.*`/`adminAuth.*` (OTP), `coupon.*`, `utils/mailer.js`, `stock.service.js`, `notification.service.js`, `report.service.js`, `export.service.js` |
| **Frontend** | `pages/customer/*` ทั้งหมด, `components/product/`, `components/cart/`, `CustomerAuthContext.jsx` | `pages/staff/*`, `pages/admin/*` ทั้งหมด, `components/dashboard/`, `StaffAuthContext.jsx`, `AdminAuthContext.jsx` |
| **ร่วมกัน (เพิ่มเติมนอกเขตเดิม)** | Dev2 เคยแก้ `auth.service.js` (hook `grantWelcomeCoupons` ตอน register) และ `order.service.js`/`order.controller.js` (ตรวจกระเป๋าคูปอง) — เป็นการแก้ข้ามเขตที่ตกลงกันแล้วสำหรับฟีเจอร์คูปอง | — |

**ส่วนกลางที่ใช้ร่วมกัน (Shared):** `config/db.js`, `middleware/*`, `utils/orderStatus.js`/`validators.js`, `api/client.js`, `createAuthContext.jsx`, `components/common/*`, `database/schema.sql` — ใครจำเป็นต้องแก้ส่วนกลาง ให้แจ้งอีกคนก่อนทุกครั้ง และ **pull ก่อนเริ่มงานเสมอ** เพื่อเลี่ยง conflict

**หมายเหตุเรื่องข้อมูลจริงในเครื่อง dev:** อีเมลของบัญชี staff/admin ในเครื่อง dev ปัจจุบันถูกเปลี่ยนเป็นอีเมลจริง (ไม่ใช่ `staff@wibwab.com`/`admin@wibwab.com` ที่อยู่ใน `seed.sql`) เพื่อทดสอบส่ง OTP จริง — **`seed.sql` ตั้งใจไม่แก้ตาม** เพื่อไม่ให้อีเมลส่วนตัวหลุดเข้า git ถ้า reset DB ด้วย `docker compose down -v && up` อีเมลจะกลับไปเป็นค่า generic ใน seed.sql เหมือนเดิม ต้อง `UPDATE users SET email=... WHERE role=...` ซ้ำเองถ้าต้องการทดสอบอีเมลจริงอีกครั้ง

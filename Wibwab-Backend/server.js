// server.js — จุดเริ่มต้น: โหลดค่า .env แล้วสตาร์ท express
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`✅ Wibwab Backend รันอยู่ที่ http://localhost:${PORT}`);
});

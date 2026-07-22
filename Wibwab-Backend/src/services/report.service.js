// services/report.service.js — รายงานยอดขาย สต็อก กำไร สำหรับ admin
// (SQL อยู่ชั้นนี้เท่านั้นตามกติกาข้อ 1 ของ PROJECT_STRUCTURE.md)
const pool = require('../config/db');
const { httpError, isPositiveInt } = require('../utils/validators');
const stockService = require('./stock.service');

const DASHBOARD_RANGE_DAYS = { '1d': 1, '7d': 7, '30d': 30 };

// ── Helpers วันที่/เดือน ──
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function isValidDateStr(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// ช่วงวันที่ default เมื่อไม่ได้ระบุ from/to: ตั้งแต่วันที่ 1 ของเดือนนี้ ถึงวันนี้
function defaultMonthRange() {
  const now = new Date();
  const from = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  return { from, to: toDateStr(now) };
}

// ตรวจ + สรุปช่วงวันที่จาก query (from, to) — ถ้าไม่ส่งมาหรือไม่ถูกต้อง ใช้ default (เดือนนี้)
function resolveDateRange(from, to) {
  const range = isValidDateStr(from) && isValidDateStr(to) ? { from, to } : defaultMonthRange();
  if (range.from > range.to) throw httpError(400, 'ช่วงวันที่ไม่ถูกต้อง (from ต้องมาก่อนหรือเท่ากับ to)');
  return range;
}

// สร้าง array ของทุกวันที่ตั้งแต่ from ถึง to (รวมทั้งสองด้าน) — ใช้เติม 0 ให้วันที่ไม่มีออเดอร์ในกราฟ
function buildDateRange(fromStr, toStr) {
  const dates = [];
  const cur = new Date(`${fromStr}T00:00:00Z`);
  const end = new Date(`${toStr}T00:00:00Z`);
  while (cur <= end) {
    dates.push(toDateStr(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

// สร้าง array เดือนย้อนหลัง (รูปแบบ 'YYYY-MM') รวมเดือนปัจจุบัน เรียงจากเก่า → ใหม่
function buildMonthRange(monthsBack) {
  const months = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

const pctChange = (curr, prev) => (prev > 0 ? Number((((curr - prev) / prev) * 100).toFixed(1)) : null);

// ============================================================
// GET /api/admin/dashboard — ภาพรวม (KPI + ยอดขายรายวัน + สินค้าขายดี)
// หมายเหตุ: "ยอดขายตามช่องทาง" (เว็บไซต์/Shopee/Lazada/IG) ในหน้ามัค-อัพ
// ยังไม่ implement เพราะ schema ปัจจุบันไม่มีคอลัมน์ระบุช่องทางการขาย
// ============================================================
async function getDashboard({ range } = {}) {
  const rangeKey = DASHBOARD_RANGE_DAYS[range] ? range : '7d';
  const days = DASHBOARD_RANGE_DAYS[rangeKey];

  const today = toDateStr(new Date());
  const fromDate = toDateStr(new Date(Date.now() - (days - 1) * 86400000));

  const [[todayRow]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders
      WHERE status != 'cancelled' AND DATE(created_at) = CURDATE()`
  );
  const [[monthRow]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders
      WHERE status != 'cancelled' AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`
  );
  const [[prevMonthRow]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders
      WHERE status != 'cancelled'
        AND YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)
        AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)`
  );
  const [[ordersRow]] = await pool.query(`SELECT COUNT(*) AS cnt FROM orders WHERE status != 'cancelled'`);
  const [[newCustomersRow]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM users WHERE role = 'customer' AND created_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const [[prevNewCustomersRow]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM users WHERE role = 'customer'
       AND created_at >= (NOW() - INTERVAL 60 DAY) AND created_at < (NOW() - INTERVAL 30 DAY)`
  );

  // ยอดขายรายวันในช่วงที่เลือก — เติม 0 ให้วันที่ไม่มีออเดอร์ เพื่อให้กราฟไม่ขาดช่วง
  const [salesRows] = await pool.query(
    `SELECT DATE(created_at) AS d, SUM(total_amount) AS total
       FROM orders
      WHERE status != 'cancelled' AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY d`,
    [fromDate, today]
  );
  const salesMap = new Map(salesRows.map((r) => [toDateStr(new Date(r.d)), Number(r.total)]));
  const dailySales = buildDateRange(fromDate, today).map((d) => ({ date: d, total: salesMap.get(d) || 0 }));

  // สินค้าขายดี 5 อันดับแรก (นับจากออเดอร์ที่ไม่ถูกยกเลิก ทั้งหมด ไม่จำกัดช่วงวันที่)
  const [topProducts] = await pool.query(
    `SELECT p.id AS product_id, p.name, c.name AS category,
            SUM(oi.quantity) AS sold, SUM(oi.quantity * oi.unit_price) AS revenue
       FROM order_items oi
       JOIN product_variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
       JOIN categories c ON c.id = p.category_id
       JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
      GROUP BY p.id, p.name, c.name
      ORDER BY sold DESC
      LIMIT 5`
  );

  return {
    range: rangeKey,
    kpis: {
      sales_today: Number(todayRow.total),
      revenue_this_month: Number(monthRow.total),
      revenue_this_month_change_pct: pctChange(Number(monthRow.total), Number(prevMonthRow.total)),
      total_orders: ordersRow.cnt,
      new_customers_30d: newCustomersRow.cnt,
      new_customers_change_pct: pctChange(newCustomersRow.cnt, prevNewCustomersRow.cnt),
    },
    dailySales,
    topProducts: topProducts.map((p) => ({
      product_id: p.product_id,
      name: p.name,
      category: p.category,
      sold: Number(p.sold),
      revenue: Number(p.revenue),
    })),
  };
}

// ============================================================
// GET /api/admin/reports/sales — รายงานยอดขาย (?from, ?to, ?category)
// คำนวณจาก order_items เพื่อให้กรองตามหมวดหมู่สินค้าได้ทุกตัวเลข
// หมายเหตุ: "อัตราการเปลี่ยนเป็นลูกค้า (conversion rate)" ในหน้ามัค-อัพ ยังไม่ implement
// เพราะ schema ไม่มีข้อมูลผู้เข้าชมเว็บไซต์/เซสชัน จึงคำนวณค่านี้ไม่ได้
// ============================================================
async function getSalesReport({ from, to, category } = {}) {
  const range = resolveDateRange(from, to);

  const where = ["o.status != 'cancelled'", 'DATE(o.created_at) BETWEEN ? AND ?'];
  const params = [range.from, range.to];
  if (category) {
    if (!isPositiveInt(category)) throw httpError(400, 'หมวดหมู่สินค้าไม่ถูกต้อง');
    where.push('p.category_id = ?');
    params.push(Number(category));
  }
  const whereSql = where.join(' AND ');
  const fromSql = `
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN product_variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
       JOIN categories c ON c.id = p.category_id
      WHERE ${whereSql}`;

  const [[totals]] = await pool.query(
    `SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
            COALESCE(SUM(oi.quantity * oi.unit_cost), 0) AS cost,
            COUNT(DISTINCT o.id) AS order_count
     ${fromSql}`,
    params
  );
  const revenue = Number(totals.revenue);
  const cost = Number(totals.cost);
  const orderCount = totals.order_count;

  const [dailyRows] = await pool.query(
    `SELECT DATE(o.created_at) AS d, SUM(oi.quantity * oi.unit_price) AS total ${fromSql} GROUP BY d`,
    params
  );
  const dailyMap = new Map(dailyRows.map((r) => [toDateStr(new Date(r.d)), Number(r.total)]));
  const dailySales = buildDateRange(range.from, range.to).map((d) => ({ date: d, total: dailyMap.get(d) || 0 }));

  const [bestSellers] = await pool.query(
    `SELECT c.id AS category_id, c.name AS category, SUM(oi.quantity) AS sold,
            SUM(oi.quantity * oi.unit_price) AS revenue,
            SUM(oi.quantity * (oi.unit_price - oi.unit_cost)) AS profit
     ${fromSql}
     GROUP BY c.id, c.name
     ORDER BY revenue DESC`,
    params
  );

  return {
    range,
    category_id: category ? Number(category) : null,
    kpis: {
      total_revenue: revenue,
      gross_profit: revenue - cost,
      avg_order_value: orderCount > 0 ? Number((revenue / orderCount).toFixed(2)) : 0,
      order_count: orderCount,
    },
    dailySales,
    bestSellersByCategory: bestSellers.map((r) => ({
      category_id: r.category_id,
      category: r.category,
      sold: Number(r.sold),
      revenue: Number(r.revenue),
      profit: Number(r.profit),
    })),
  };
}

// ============================================================
// GET /api/admin/reports/stock — รายงานสต็อก (ใกล้หมด/หมด/ขายช้า)
// ============================================================
async function getStockReport() {
  const [[totalRow]] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM product_variants WHERE is_active = TRUE'
  );
  const [[inStockRow]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM product_variants
      WHERE is_active = TRUE AND stock_qty > low_stock_threshold`
  );
  const lowStock = await stockService.getLowStockCount();
  const outOfStock = await stockService.getOutOfStockCount();

  const [lowStockItems] = await pool.query(
    `SELECT v.id AS variant_id, p.name, v.sku, v.size, v.color, v.material,
            v.stock_qty, v.low_stock_threshold
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
      WHERE v.is_active = TRUE AND v.stock_qty > 0 AND v.stock_qty <= v.low_stock_threshold
      ORDER BY v.stock_qty ASC
      LIMIT 20`
  );

  // สินค้าขายช้า: ยังไม่เคยขายเลย หรือขายครั้งล่าสุดนานเกิน 90 วัน
  const [slowMoving] = await pool.query(
    `SELECT p.id, p.name, c.name AS category,
            SUM(v.stock_qty * v.price) AS stock_value,
            DATEDIFF(NOW(), COALESCE(MAX(o.created_at), p.created_at)) AS days_in_stock
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN product_variants v ON v.product_id = p.id AND v.is_active = TRUE
       LEFT JOIN order_items oi ON oi.variant_id = v.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
      GROUP BY p.id, p.name, c.name, p.created_at
     HAVING days_in_stock >= 90
      ORDER BY days_in_stock DESC
      LIMIT 20`
  );

  return {
    kpis: {
      total_skus: totalRow.cnt,
      in_stock: inStockRow.cnt,
      low_stock: lowStock,
      out_of_stock: outOfStock,
    },
    lowStockItems: lowStockItems.map((v) => ({
      variant_id: v.variant_id,
      name: v.name,
      sku: v.sku,
      variant_label: [v.size, v.color, v.material].filter(Boolean).join(' · '),
      stock_qty: v.stock_qty,
      low_stock_threshold: v.low_stock_threshold,
    })),
    slowMoving: slowMoving.map((p) => ({
      product_id: p.id,
      name: p.name,
      category: p.category,
      stock_value: Number(p.stock_value),
      days_in_stock: p.days_in_stock,
    })),
  };
}

// ============================================================
// GET /api/admin/reports/profit — รายงานกำไร (?from, ?to)
// ============================================================
async function getProfitReport({ from, to } = {}) {
  const range = resolveDateRange(from, to);
  const fromSql = `
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN product_variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
       JOIN categories c ON c.id = p.category_id
      WHERE o.status != 'cancelled' AND DATE(o.created_at) BETWEEN ? AND ?`;
  const params = [range.from, range.to];

  const [[totals]] = await pool.query(
    `SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
            COALESCE(SUM(oi.quantity * oi.unit_cost), 0) AS cost
     ${fromSql}`,
    params
  );
  const revenue = Number(totals.revenue);
  const cost = Number(totals.cost);
  const grossProfit = revenue - cost;
  const marginPct = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0;

  // เทียบกับช่วงก่อนหน้าที่มีความยาวเท่ากัน (สำหรับป้าย % เปลี่ยนแปลง)
  const daySpanMs = new Date(`${range.to}T00:00:00Z`) - new Date(`${range.from}T00:00:00Z`) + 86400000;
  const prevTo = toDateStr(new Date(new Date(`${range.from}T00:00:00Z`).getTime() - 86400000));
  const prevFrom = toDateStr(new Date(new Date(`${range.from}T00:00:00Z`).getTime() - daySpanMs));
  const [[prevTotals]] = await pool.query(
    `SELECT COALESCE(SUM(oi.quantity * (oi.unit_price - oi.unit_cost)), 0) AS profit
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled' AND DATE(o.created_at) BETWEEN ? AND ?`,
    [prevFrom, prevTo]
  );
  const grossProfitChangePct = pctChange(grossProfit, Number(prevTotals.profit));

  // แนวโน้มกำไรรายเดือน (12 เดือนล่าสุด รวมเดือนปัจจุบัน)
  const [monthlyRows] = await pool.query(
    `SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS ym,
            SUM(oi.quantity * oi.unit_price) AS revenue,
            SUM(oi.quantity * oi.unit_cost) AS cost
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled' AND o.created_at >= (CURDATE() - INTERVAL 12 MONTH)
      GROUP BY ym`
  );
  const monthlyMap = new Map(
    monthlyRows.map((r) => [r.ym, { revenue: Number(r.revenue), cost: Number(r.cost) }])
  );
  const monthlyTrend = buildMonthRange(12).map((ym) => {
    const m = monthlyMap.get(ym) || { revenue: 0, cost: 0 };
    const profit = m.revenue - m.cost;
    return {
      month: ym,
      revenue: m.revenue,
      cost: m.cost,
      profit,
      margin_pct: m.revenue > 0 ? Number(((profit / m.revenue) * 100).toFixed(1)) : 0,
    };
  });

  // กำไรตามหมวดหมู่ (เฉพาะช่วงวันที่ที่เลือก)
  const [byCategory] = await pool.query(
    `SELECT c.id AS category_id, c.name AS category,
            SUM(oi.quantity * (oi.unit_price - oi.unit_cost)) AS profit
     ${fromSql}
     GROUP BY c.id, c.name
     ORDER BY profit DESC`,
    params
  );

  return {
    range,
    kpis: {
      total_revenue: revenue,
      total_cost: cost,
      gross_profit: grossProfit,
      margin_pct: marginPct,
      gross_profit_change_pct: grossProfitChangePct,
    },
    monthlyTrend,
    profitByCategory: byCategory.map((r) => ({
      category_id: r.category_id,
      category: r.category,
      profit: Number(r.profit),
    })),
  };
}

module.exports = { getDashboard, getSalesReport, getStockReport, getProfitReport };
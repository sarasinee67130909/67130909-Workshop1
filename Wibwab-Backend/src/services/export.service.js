// services/export.service.js — สร้างไฟล์ Excel (.xlsx) และ PDF จากข้อมูลรายงาน (admin)
// ใช้ exceljs สำหรับ Excel และ pdfkit สำหรับ PDF (ฝัง font ไทย Noto Sans Thai)
const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const BRAND_NAME = 'วิบวับ';
const COLOR_PRIMARY = '1E293B'; // slate (admin-primary)
const COLOR_GOLD = 'B08D57'; // admin-gold
const COLOR_MUTED = '64748B';
const COLOR_LIGHT = 'F1F5F9';

const FONT_REGULAR = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSansThai-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSansThai-Bold.ttf');

function formatCurrency(n) {
  return `฿ ${Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
}

function formatDateThai(d) {
  return new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

// ป้ายช่วงเวลาของหน้าภาพรวม — เพิ่ม '1d' (รายวัน) นอกเหนือจาก 7d/30d เดิม
function dashboardRangeLabel(range) {
  if (range === '30d') return '30 วันล่าสุด';
  if (range === '1d') return 'วันนี้';
  return '7 วันล่าสุด';
}

// ============================================================
// Excel helpers
// ============================================================
function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLOR_PRIMARY}` } };
    cell.alignment = { vertical: 'middle', horizontal: cell.alignment?.horizontal || 'left' };
    cell.border = { bottom: { style: 'thin', color: { argb: `FF${COLOR_PRIMARY}` } } };
  });
  row.height = 22;
}

function addTitleBlock(sheet, title, subtitle, colSpan) {
  sheet.mergeCells(1, 1, 1, colSpan);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${BRAND_NAME} — ${title}`;
  titleCell.font = { bold: true, size: 16, color: { argb: `FF${COLOR_PRIMARY}` } };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, colSpan);
  const subCell = sheet.getCell(2, 1);
  subCell.value = subtitle;
  subCell.font = { size: 10, color: { argb: `FF${COLOR_MUTED}` }, italic: true };
  sheet.getRow(2).height = 18;

  sheet.addRow([]); // spacer row 3
}

function addKpiSheet(workbook, kpis, subtitle = `ส่งออกเมื่อ ${formatDateThai()}`) {
  const sheet = workbook.addWorksheet('สรุปภาพรวม');
  sheet.columns = [{ width: 34 }, { width: 24 }];
  addTitleBlock(sheet, 'สรุปภาพรวม (KPI)', subtitle, 2);
  const headerRow = sheet.addRow(['รายการ', 'ค่า']);
  styleHeaderRow(headerRow);
  kpis.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    row.getCell(2).alignment = { horizontal: 'right' };
    row.eachCell((c) => {
      c.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
    });
  });
  return sheet;
}

function addTableSheet(workbook, sheetName, title, subtitle, columns, rows) {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ width: c.width || 18 }));
  addTitleBlock(sheet, title, subtitle, columns.length);
  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.eachCell((cell, i) => {
    cell.alignment = { horizontal: columns[i - 1].align || 'left', vertical: 'middle' };
  });
  styleHeaderRow(headerRow);

  rows.forEach((r, idx) => {
    const values = columns.map((c) => r[c.key]);
    const row = sheet.addRow(values);
    row.eachCell((cell, i) => {
      cell.alignment = { horizontal: columns[i - 1].align || 'left' };
      if (columns[i - 1].numFmt) cell.numFmt = columns[i - 1].numFmt;
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${COLOR_LIGHT}` } };
      }
    });
  });

  if (rows.length === 0) {
    sheet.addRow(['ไม่มีข้อมูลในช่วงที่เลือก']);
  }
  return sheet;
}

async function buildDashboardExcel(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND_NAME;
  workbook.created = new Date();

  addKpiSheet(workbook, [
    ['ช่วงเวลา', dashboardRangeLabel(data.range)],
    ['ยอดขายวันนี้', formatCurrency(data.kpis.sales_today)],
    ['รายได้เดือนนี้', formatCurrency(data.kpis.revenue_this_month)],
    ['คำสั่งซื้อทั้งหมด', data.kpis.total_orders],
    ['ลูกค้าใหม่ (30 วัน)', data.kpis.new_customers_30d],
  ]);

  addTableSheet(
    workbook,
    'ยอดขายรายวัน',
    'ยอดขายรายวัน',
    dashboardRangeLabel(data.range),
    [
      { key: 'date', header: 'วันที่', width: 16 },
      { key: 'total', header: 'ยอดขาย (บาท)', width: 20, align: 'right', numFmt: '#,##0' },
    ],
    data.dailySales
  );

  addTableSheet(
    workbook,
    'สินค้าขายดี',
    'สินค้าขายดี (5 อันดับแรก)',
    formatDateThai(),
    [
      { key: 'name', header: 'สินค้า', width: 26 },
      { key: 'category', header: 'หมวดหมู่', width: 20 },
      { key: 'sold', header: 'จำนวนที่ขาย', width: 16, align: 'right', numFmt: '#,##0' },
      { key: 'revenue', header: 'รายได้ (บาท)', width: 18, align: 'right', numFmt: '#,##0' },
    ],
    data.topProducts
  );

  return workbook.xlsx.writeBuffer();
}

async function buildSalesExcel(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND_NAME;
  workbook.created = new Date();

  addKpiSheet(workbook, [
    ['ช่วงวันที่', `${data.range.from} ถึง ${data.range.to}`],
    ['รายได้รวม', formatCurrency(data.kpis.total_revenue)],
    ['กำไรขั้นต้น', formatCurrency(data.kpis.gross_profit)],
    ['มูลค่าเฉลี่ยต่อออเดอร์', formatCurrency(data.kpis.avg_order_value)],
    ['จำนวนออเดอร์', data.kpis.order_count],
  ]);

  addTableSheet(
    workbook,
    'ยอดขายรายวัน',
    'ยอดขายรายวัน',
    `${data.range.from} ถึง ${data.range.to}`,
    [
      { key: 'date', header: 'วันที่', width: 16 },
      { key: 'total', header: 'ยอดขาย (บาท)', width: 20, align: 'right', numFmt: '#,##0' },
    ],
    data.dailySales
  );

  addTableSheet(
    workbook,
    'สินค้าขายดีตามหมวดหมู่',
    'สินค้าขายดีตามหมวดหมู่',
    `${data.range.from} ถึง ${data.range.to}`,
    [
      { key: 'category', header: 'หมวดหมู่', width: 26 },
      { key: 'sold', header: 'จำนวนที่ขาย', width: 16, align: 'right', numFmt: '#,##0' },
      { key: 'revenue', header: 'รายได้ (บาท)', width: 18, align: 'right', numFmt: '#,##0' },
      { key: 'profit', header: 'กำไร (บาท)', width: 18, align: 'right', numFmt: '#,##0' },
    ],
    data.bestSellersByCategory
  );

  return workbook.xlsx.writeBuffer();
}

async function buildStockExcel(data, periodLabel) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND_NAME;
  workbook.created = new Date();
  const subtitle = `${periodLabel} · ส่งออกเมื่อ ${formatDateThai()}`;

  addKpiSheet(
    workbook,
    [
      ['SKU ทั้งหมด', data.kpis.total_skus],
      ['มีสต็อก', data.kpis.in_stock],
      ['สต็อกต่ำ', data.kpis.low_stock],
      ['หมดสต็อก', data.kpis.out_of_stock],
    ],
    subtitle
  );

  addTableSheet(
    workbook,
    'สินค้าใกล้หมดสต็อก',
    'สินค้าใกล้หมดสต็อก',
    subtitle,
    [
      { key: 'name', header: 'สินค้า', width: 26 },
      { key: 'sku', header: 'SKU', width: 16 },
      { key: 'variant_label', header: 'ตัวเลือก', width: 20 },
      { key: 'stock_qty', header: 'คงเหลือ', width: 12, align: 'right', numFmt: '#,##0' },
      { key: 'low_stock_threshold', header: 'เกณฑ์แจ้งเตือน', width: 16, align: 'right', numFmt: '#,##0' },
    ],
    data.lowStockItems
  );

  addTableSheet(
    workbook,
    'สินค้าที่ขายช้า',
    'สินค้าที่ขายช้า (ไม่มีการขายมากกว่า 90 วัน)',
    subtitle,
    [
      { key: 'name', header: 'สินค้า', width: 28 },
      { key: 'category', header: 'หมวดหมู่', width: 20 },
      { key: 'stock_value', header: 'มูลค่ารวม (บาท)', width: 18, align: 'right', numFmt: '#,##0' },
      { key: 'days_in_stock', header: 'จำนวนวันในสต็อก', width: 18, align: 'right', numFmt: '#,##0' },
    ],
    data.slowMoving
  );

  return workbook.xlsx.writeBuffer();
}

async function buildProfitExcel(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND_NAME;
  workbook.created = new Date();

  addKpiSheet(workbook, [
    ['ช่วงวันที่', `${data.range.from} ถึง ${data.range.to}`],
    ['รายได้รวม', formatCurrency(data.kpis.total_revenue)],
    ['ต้นทุนรวม', formatCurrency(data.kpis.total_cost)],
    ['กำไรขั้นต้น', formatCurrency(data.kpis.gross_profit)],
    ['อัตรากำไรขั้นต้น', `${data.kpis.margin_pct}%`],
  ]);

  addTableSheet(
    workbook,
    'สรุปรายเดือน',
    'สรุปรายเดือน (แนวโน้มกำไร)',
    `${data.range.from} ถึง ${data.range.to}`,
    [
      { key: 'month', header: 'เดือน', width: 14 },
      { key: 'revenue', header: 'รายได้ (บาท)', width: 18, align: 'right', numFmt: '#,##0' },
      { key: 'cost', header: 'ต้นทุน (บาท)', width: 18, align: 'right', numFmt: '#,##0' },
      { key: 'profit', header: 'กำไร (บาท)', width: 18, align: 'right', numFmt: '#,##0' },
      { key: 'margin_pct', header: 'อัตรากำไร (%)', width: 16, align: 'right' },
    ],
    [...data.monthlyTrend].reverse()
  );

  addTableSheet(
    workbook,
    'กำไรตามหมวดหมู่',
    'กำไรตามหมวดหมู่',
    `${data.range.from} ถึง ${data.range.to}`,
    [
      { key: 'category', header: 'หมวดหมู่', width: 26 },
      { key: 'profit', header: 'กำไร (บาท)', width: 18, align: 'right', numFmt: '#,##0' },
    ],
    data.profitByCategory
  );

  return workbook.xlsx.writeBuffer();
}

// ============================================================
// PDF helpers
// ============================================================
function newPdfDoc() {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  doc.registerFont('Thai', FONT_REGULAR);
  doc.registerFont('Thai-Bold', FONT_BOLD);
  doc.font('Thai');
  return doc;
}

function pdfHeader(doc, title, subtitle) {
  doc.font('Thai-Bold').fontSize(18).fillColor(`#${COLOR_PRIMARY}`).text(`${BRAND_NAME} — ${title}`);
  doc.font('Thai').fontSize(10).fillColor(`#${COLOR_MUTED}`).text(subtitle);
  doc.moveDown(0.6);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor(`#${COLOR_GOLD}`)
    .lineWidth(1.5)
    .stroke();
  doc.moveDown(0.8);
}

function pdfKpiGrid(doc, kpis) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = 2;
  const gap = 12;
  const cardW = (usableWidth - gap * (cols - 1)) / cols;
  const cardH = 46;
  let x = startX;
  let y = doc.y;

  kpis.forEach(([label, value], i) => {
    if (i > 0 && i % cols === 0) {
      y += cardH + gap;
      x = startX;
    }
    doc.roundedRect(x, y, cardW, cardH, 4).fillAndStroke(`#${COLOR_LIGHT}`, `#${COLOR_LIGHT}`);
    doc.font('Thai').fontSize(9).fillColor(`#${COLOR_MUTED}`).text(label, x + 10, y + 8, { width: cardW - 20 });
    doc.font('Thai-Bold').fontSize(13).fillColor(`#${COLOR_PRIMARY}`).text(String(value), x + 10, y + 22, { width: cardW - 20 });
    x += cardW + gap;
  });

  doc.y = y + cardH + 18;
  doc.x = startX;
}

function pdfTable(doc, title, columns, rows) {
  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const totalWeight = columns.reduce((s, c) => s + c.weight, 0);
  const colWidths = columns.map((c) => (c.weight / totalWeight) * usableWidth);
  const rowH = 20;
  const headerH = 22;

  function ensureSpace(h) {
    if (doc.y + h > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      doc.y = doc.page.margins.top;
    }
  }

  ensureSpace(headerH + rowH + 30);
  doc.font('Thai-Bold').fontSize(12).fillColor(`#${COLOR_PRIMARY}`).text(title, startX, doc.y);
  doc.moveDown(0.4);

  function drawHeader() {
    const y = doc.y;
    doc.rect(startX, y, usableWidth, headerH).fill(`#${COLOR_PRIMARY}`);
    let cx = startX;
    columns.forEach((c, i) => {
      doc
        .font('Thai-Bold')
        .fontSize(9)
        .fillColor('#FFFFFF')
        .text(c.header, cx + 6, y + 6, { width: colWidths[i] - 12, align: c.align || 'left' });
      cx += colWidths[i];
    });
    doc.y = y + headerH;
  }

  drawHeader();

  if (rows.length === 0) {
    ensureSpace(rowH);
    doc.font('Thai').fontSize(9).fillColor(`#${COLOR_MUTED}`).text('ไม่มีข้อมูลในช่วงที่เลือก', startX + 6, doc.y + 6);
    doc.y += rowH;
  }

  rows.forEach((r, idx) => {
    ensureSpace(rowH);
    const y = doc.y;
    if (idx % 2 === 1) {
      doc.rect(startX, y, usableWidth, rowH).fill(`#${COLOR_LIGHT}`);
    }
    let cx = startX;
    columns.forEach((c, i) => {
      const val = r[c.key];
      doc
        .font('Thai')
        .fontSize(9)
        .fillColor(`#${COLOR_PRIMARY}`)
        .text(c.format ? c.format(val) : String(val ?? ''), cx + 6, y + 5, {
          width: colWidths[i] - 12,
          align: c.align || 'left',
        });
      cx += colWidths[i];
    });
    doc.y = y + rowH;
  });

  doc.moveDown(1);
}

function pdfBufferFromDoc(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

async function buildDashboardPdf(data) {
  const doc = newPdfDoc();
  const rangeLabel = dashboardRangeLabel(data.range);
  pdfHeader(doc, 'ภาพรวม', `ช่วงเวลา ${rangeLabel} · ส่งออกเมื่อ ${formatDateThai()}`);

  pdfKpiGrid(doc, [
    ['ยอดขายวันนี้', formatCurrency(data.kpis.sales_today)],
    ['รายได้เดือนนี้', formatCurrency(data.kpis.revenue_this_month)],
    ['คำสั่งซื้อทั้งหมด', data.kpis.total_orders.toLocaleString('th-TH')],
    ['ลูกค้าใหม่ (30 วัน)', data.kpis.new_customers_30d.toLocaleString('th-TH')],
  ]);

  pdfTable(
    doc,
    'สินค้าขายดี',
    [
      { key: 'name', header: 'สินค้า', weight: 3 },
      { key: 'category', header: 'หมวดหมู่', weight: 2 },
      { key: 'sold', header: 'จำนวนที่ขาย', weight: 2, align: 'right' },
      { key: 'revenue', header: 'รายได้', weight: 2, align: 'right', format: formatCurrency },
    ],
    data.topProducts
  );

  pdfTable(
    doc,
    `ยอดขายรายวัน (${rangeLabel})`,
    [
      { key: 'date', header: 'วันที่', weight: 2 },
      { key: 'total', header: 'ยอดขาย', weight: 2, align: 'right', format: formatCurrency },
    ],
    data.dailySales
  );

  return pdfBufferFromDoc(doc);
}

async function buildSalesPdf(data) {
  const doc = newPdfDoc();
  pdfHeader(doc, 'รายงานยอดขาย', `ช่วงวันที่ ${data.range.from} ถึง ${data.range.to} · ส่งออกเมื่อ ${formatDateThai()}`);

  pdfKpiGrid(doc, [
    ['รายได้รวม', formatCurrency(data.kpis.total_revenue)],
    ['กำไรขั้นต้น', formatCurrency(data.kpis.gross_profit)],
    ['มูลค่าเฉลี่ยต่อออเดอร์', formatCurrency(data.kpis.avg_order_value)],
    ['จำนวนออเดอร์', data.kpis.order_count.toLocaleString('th-TH')],
  ]);

  pdfTable(
    doc,
    'สินค้าขายดีตามหมวดหมู่',
    [
      { key: 'category', header: 'หมวดหมู่', weight: 3 },
      { key: 'sold', header: 'จำนวนที่ขาย', weight: 2, align: 'right' },
      { key: 'revenue', header: 'รายได้', weight: 2, align: 'right', format: formatCurrency },
      { key: 'profit', header: 'กำไร', weight: 2, align: 'right', format: formatCurrency },
    ],
    data.bestSellersByCategory
  );

  pdfTable(
    doc,
    'ยอดขายรายวัน',
    [
      { key: 'date', header: 'วันที่', weight: 2 },
      { key: 'total', header: 'ยอดขาย', weight: 2, align: 'right', format: formatCurrency },
    ],
    data.dailySales
  );

  return pdfBufferFromDoc(doc);
}

async function buildStockPdf(data, periodLabel) {
  const doc = newPdfDoc();
  pdfHeader(doc, 'รายงานสต็อก', `${periodLabel} · ส่งออกเมื่อ ${formatDateThai()}`);

  pdfKpiGrid(doc, [
    ['SKU ทั้งหมด', data.kpis.total_skus.toLocaleString('th-TH')],
    ['มีสต็อก', data.kpis.in_stock.toLocaleString('th-TH')],
    ['สต็อกต่ำ', data.kpis.low_stock.toLocaleString('th-TH')],
    ['หมดสต็อก', data.kpis.out_of_stock.toLocaleString('th-TH')],
  ]);

  pdfTable(
    doc,
    'สินค้าใกล้หมดสต็อก',
    [
      { key: 'name', header: 'สินค้า', weight: 3 },
      { key: 'sku', header: 'SKU', weight: 2 },
      { key: 'variant_label', header: 'ตัวเลือก', weight: 2 },
      { key: 'stock_qty', header: 'คงเหลือ', weight: 1, align: 'right' },
      { key: 'low_stock_threshold', header: 'เกณฑ์', weight: 1, align: 'right' },
    ],
    data.lowStockItems
  );

  pdfTable(
    doc,
    'สินค้าที่ขายช้า (ไม่มีการขายมากกว่า 90 วัน)',
    [
      { key: 'name', header: 'สินค้า', weight: 3 },
      { key: 'category', header: 'หมวดหมู่', weight: 2 },
      { key: 'stock_value', header: 'มูลค่ารวม', weight: 2, align: 'right', format: formatCurrency },
      { key: 'days_in_stock', header: 'วันในสต็อก', weight: 2, align: 'right' },
    ],
    data.slowMoving
  );

  return pdfBufferFromDoc(doc);
}

async function buildProfitPdf(data) {
  const doc = newPdfDoc();
  pdfHeader(doc, 'รายงานกำไร', `ช่วงวันที่ ${data.range.from} ถึง ${data.range.to} · ส่งออกเมื่อ ${formatDateThai()}`);

  pdfKpiGrid(doc, [
    ['รายได้รวม', formatCurrency(data.kpis.total_revenue)],
    ['ต้นทุนรวม', formatCurrency(data.kpis.total_cost)],
    ['กำไรขั้นต้น', formatCurrency(data.kpis.gross_profit)],
    ['อัตรากำไรขั้นต้น', `${data.kpis.margin_pct}%`],
  ]);

  pdfTable(
    doc,
    'สรุปรายเดือน',
    [
      { key: 'month', header: 'เดือน', weight: 2 },
      { key: 'revenue', header: 'รายได้', weight: 2, align: 'right', format: formatCurrency },
      { key: 'cost', header: 'ต้นทุน', weight: 2, align: 'right', format: formatCurrency },
      { key: 'profit', header: 'กำไร', weight: 2, align: 'right', format: formatCurrency },
      { key: 'margin_pct', header: 'อัตรากำไร', weight: 1, align: 'right', format: (v) => `${v}%` },
    ],
    [...data.monthlyTrend].reverse()
  );

  pdfTable(
    doc,
    'กำไรตามหมวดหมู่',
    [
      { key: 'category', header: 'หมวดหมู่', weight: 3 },
      { key: 'profit', header: 'กำไร', weight: 2, align: 'right', format: formatCurrency },
    ],
    data.profitByCategory
  );

  return pdfBufferFromDoc(doc);
}

module.exports = {
  buildDashboardExcel,
  buildDashboardPdf,
  buildSalesExcel,
  buildStockExcel,
  buildProfitExcel,
  buildSalesPdf,
  buildStockPdf,
  buildProfitPdf,
};

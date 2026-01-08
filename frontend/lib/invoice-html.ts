export function formatCurrency(
  value: number,
  locale = "en-US",
  currency = "USD"
) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    value
  );
}

function getSaleAmount(sale: any) {
  // Support multiple field names returned by different endpoints: grand_total is canonical
  return (
    (sale &&
      (sale.grand_total ??
        sale.total ??
        sale.total_amount ??
        sale.amount ??
        0)) ||
    0
  );
}

export function buildInvoiceHtml(invoice: any) {
  const date =
    invoice.sale_date || invoice.created_at || new Date().toISOString();
  const invoiceNumber =
    invoice.invoice_number || `invoice-${invoice.id || "unknown"}`;
  const customerName = invoice.customer?.name || "Walk-in";
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const total = items.reduce(
    (sum: number, item: any) =>
      sum + (item.quantity * (item.unit_price || 0) - (item.discount || 0)),
    0
  );

  const rows = items
    .map(
      (it: any) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">${escapeHtml(
        it.product?.name || `Product #${it.product?.id ?? "-"}`
      )}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${
        it.quantity
      }</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(
        it.unit_price || 0
      )}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(
        it.quantity * (it.unit_price || 0) - (it.discount || 0)
      )}</td>
    </tr>`
    )
    .join("\n");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${escapeHtml(invoiceNumber)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; }
    .invoice { max-width: 800px; margin: 24px auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 6px }
    .header { display:flex; justify-content:space-between; align-items:center }
    .company { font-weight:700; font-size:18px }
    .muted { color:#6b7280 }
    table { width:100%; border-collapse:collapse; margin-top:16px }
    th { text-align:left; padding:8px; border:1px solid #ddd; background:#f9fafb }
    td { vertical-align:top }
    .totals { margin-top:16px; display:flex; justify-content:flex-end }
    .totals .box { width:300px }
    @media print { .no-print { display:none } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="company">Your Company</div>
        <div class="muted">123 Main St, City, Country</div>
        <div class="muted">Phone: (000) 000-0000</div>
      </div>
      <div style="text-align:right">
        <div><strong>Invoice</strong></div>
        <div>${escapeHtml(invoiceNumber)}</div>
        <div class="muted">${new Date(date).toLocaleString()}</div>
      </div>
    </div>

    <div style="margin-top:16px">
      <div><strong>Bill To:</strong></div>
      <div>${escapeHtml(customerName)}</div>
      <div class="muted">${escapeHtml(invoice.customer?.address || "")}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals">
      <div class="box">
        <div style="display:flex;justify-content:space-between;padding:8px 0"><span>Subtotal</span><span>${formatCurrency(
          total
        )}</span></div>
        ${
          invoice.tax
            ? `<div style="display:flex;justify-content:space-between;padding:8px 0"><span>Tax</span><span>${formatCurrency(
                invoice.tax
              )}</span></div>`
            : ""
        }
        ${
          invoice.discount
            ? `<div style="display:flex;justify-content:space-between;padding:8px 0"><span>Discount</span><span>${formatCurrency(
                invoice.discount
              )}</span></div>`
            : ""
        }
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #e5e7eb;font-weight:700"><span>Total</span><span>${formatCurrency(
          invoice.grand_total ?? invoice.total ?? total
        )}</span></div>
      </div>
    </div>

    <div style="margin-top:24px" class="muted">Thank you for your business.</div>

    <div style="margin-top:12px" class="no-print"><button onclick="window.print()">Print</button></div>
  </div>
</body>
</html>`;

  return html;
}

function escapeHtml(str: any) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function downloadHtmlFile(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function buildInventoryHtml({
  batches,
  generatedAt,
}: {
  batches?: any[];
  generatedAt?: string;
}) {
  const date = generatedAt || new Date().toISOString();
  const rows = (batches || [])
    .map(
      (b: any) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">${escapeHtml(
        b.product_name || b.product?.name || "Unknown"
      )}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${
        b.current_quantity ?? "-"
      }</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(
        b.price || 0
      )}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(
        (b.current_quantity || 0) * (b.price || 0)
      )}</td>
    </tr>
  `
    )
    .join("\n");

  const totalValue = (batches || []).reduce(
    (sum: number, b: any) => sum + (b.current_quantity || 0) * (b.price || 0),
    0
  );

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Inventory Valuation</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; }
      .report { max-width: 900px; margin: 24px auto; padding: 24px }
      table { width:100%; border-collapse:collapse; margin-top:16px }
      th { text-align:left; padding:8px; border:1px solid #ddd; background:#f9fafb }
    </style>
  </head>
  <body>
    <div class="report">
      <h1>Inventory Valuation</h1>
      <div class="muted">Generated: ${new Date(date).toLocaleString()}</div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Unit Price</th>
            <th style="text-align:right">Value</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="margin-top:12px;text-align:right;font-weight:700">Total Value: ${formatCurrency(
        totalValue
      )}</div>
    </div>
  </body>
  </html>`;
}

export function buildSalesSummaryHtml({
  sales,
  generatedAt,
}: {
  sales?: any[];
  generatedAt?: string;
}) {
  const date = generatedAt || new Date().toISOString();
  const totalRevenue = (sales || []).reduce(
    (sum: number, s: any) => sum + getSaleAmount(s),
    0
  );
  const totalCount = (sales || []).length;

  const rows = (sales || [])
    .slice(0, 100)
    .map(
      (s: any) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">${escapeHtml(
        s.invoice_number || `Sale ${s.id}`
      )}</td>
      <td style="padding:8px;border:1px solid #ddd">${escapeHtml(
        new Date(s.sale_date || s.created_at || Date.now()).toLocaleString()
      )}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(
        getSaleAmount(s)
      )}</td>
    </tr>`
    )
    .join("\n");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sales Summary</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; }
    .report { max-width: 900px; margin: 24px auto; padding: 24px }
    table { width:100%; border-collapse:collapse; margin-top:16px }
    th { text-align:left; padding:8px; border:1px solid #ddd; background:#f9fafb }
    .muted { color:#6b7280 }
    @media print { .no-print { display:none } }
  </style>
</head>
<body>
  <div class="report">
    <h1>Sales Summary</h1>
    <div class="muted">Generated: ${new Date(date).toLocaleString()}</div>
    <div style="margin-top:12px">
      <div><strong>Total Sales:</strong> ${formatCurrency(totalRevenue)}</div>
      <div><strong>Transactions:</strong> ${totalCount}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Date</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div style="margin-top:12px" class="no-print"><button onclick="window.print()">Print / Save as PDF</button></div>
  </div>
</body>
</html>`;
}

export function buildCustomerReportHtml({
  sales,
  generatedAt,
}: {
  sales?: any[];
  generatedAt?: string;
}) {
  const date = generatedAt || new Date().toISOString();
  // aggregate by customer name
  const map: Record<string, { count: number; total: number }> = {};
  (sales || []).forEach((s: any) => {
    const name = s.customer?.name || "Walk-in";
    if (!map[name]) map[name] = { count: 0, total: 0 };
    map[name].count += 1;
    map[name].total += getSaleAmount(s);
  });

  const rows = Object.entries(map)
    .map(
      ([name, { count, total }]) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">${escapeHtml(name)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${count}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(
        total
      )}</td>
    </tr>`
    )
    .join("\n");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Customer Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; }
    .report { max-width: 900px; margin: 24px auto; padding: 24px }
    table { width:100%; border-collapse:collapse; margin-top:16px }
    th { text-align:left; padding:8px; border:1px solid #ddd; background:#f9fafb }
    .muted { color:#6b7280 }
    @media print { .no-print { display:none } }
  </style>
</head>
<body>
  <div class="report">
    <h1>Customer Report</h1>
    <div class="muted">Generated: ${new Date(date).toLocaleString()}</div>

    <table>
      <thead>
        <tr>
          <th>Customer</th>
          <th style="text-align:center">Orders</th>
          <th style="text-align:right">Total Spent</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div style="margin-top:12px" class="no-print"><button onclick="window.print()">Print / Save as PDF</button></div>
  </div>
</body>
</html>`;
}

export function buildFinancialStatementHtml({
  financial,
  generatedAt,
}: {
  financial?: { revenue?: number; expenses?: number };
  generatedAt?: string;
}) {
  const date = generatedAt || new Date().toISOString();
  const revenue = financial?.revenue ?? 0;
  const expenses = financial?.expenses ?? 0;
  const profit = revenue - expenses;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Financial Statement</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; }
    .report { max-width: 700px; margin: 24px auto; padding: 24px }
    .muted { color:#6b7280 }
    .line { display:flex; justify-content:space-between; padding:8px 0 }
    .total { font-weight:700 }
    @media print { .no-print { display:none } }
  </style>
</head>
<body>
  <div class="report">
    <h1>Financial Statement</h1>
    <div class="muted">Generated: ${new Date(date).toLocaleString()}</div>

    <div style="margin-top:12px">
      <div class="line"><span>Revenue</span><span>${formatCurrency(
        revenue
      )}</span></div>
      <div class="line"><span>Expenses</span><span>${formatCurrency(
        expenses
      )}</span></div>
      <div class="line total"><span>Profit</span><span>${formatCurrency(
        profit
      )}</span></div>
    </div>

    <div style="margin-top:12px" class="no-print"><button onclick="window.print()">Print / Save as PDF</button></div>
  </div>
</body>
</html>`;
}

export function buildCustomReportHtml({
  title,
  type,
  content,
  generatedAt,
}: {
  title: string;
  type?: string;
  content?: string;
  generatedAt?: string;
}) {
  const date = generatedAt || new Date().toISOString();
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; }
    .report { max-width: 900px; margin: 24px auto; padding: 24px }
    .muted { color:#6b7280 }
    @media print { .no-print { display:none } }
  </style>
</head>
<body>
  <div class="report">
    <h1>${escapeHtml(title)}</h1>
    <div class="muted">Type: ${escapeHtml(type || "Custom")}</div>
    <div class="muted">Generated: ${new Date(date).toLocaleString()}</div>
    <div style="margin-top:16px">${content || ""}</div>
    <div style="margin-top:12px" class="no-print"><button onclick="window.print()">Print / Save as PDF</button></div>
  </div>
</body>
</html>`;
}

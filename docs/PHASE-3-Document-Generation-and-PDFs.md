# PHASE 3 — Document Generation & PDF System
**FHI Export Trade Calculator**
**Duration: 5–7 days**
**Goal: Branded PDF generation for buyer-facing and internal documents**

---

## 3.1 Overview

Phase 3 makes the platform produce professional, branded, exportable documents. This is what closes deals — a buyer receives a polished FHI-branded quotation PDF, not a raw screen share.

By end of Phase 3:
- Branded buyer quotation PDF generated server-side
- Proforma invoice PDF
- Internal costing/margin sheet PDF
- Product specification sheet
- All documents downloadable and optionally emailed
- Document storage (linked to quote)

---

## 3.2 PDF Generation Strategy

### Recommended Approach: Puppeteer (Server-Side)

Render an HTML template in a headless browser → convert to PDF. This gives pixel-perfect output with full CSS/Tailwind control.

**Why Puppeteer over alternatives:**
- Full CSS support (gradients, fonts, tables, page breaks)
- Easy to update (just edit HTML/CSS template)
- Handles multi-page documents well
- Can use the same design language as the app

**Alternative:** `@react-pdf/renderer` — React components → PDF. Simpler but more limited styling.

**Decision:** Use Puppeteer for complex docs (quotation, proforma). Use `@react-pdf/renderer` for simpler internal sheets.

### Setup

```bash
cd backend
npm install puppeteer handlebars
```

> On Railway/Render, Puppeteer needs a compatible Chrome. Railway supports it out of the box. Render requires `PUPPETEER_EXECUTABLE_PATH` env var.

---

## 3.3 Document Templates — Structure

Store HTML templates in `backend/src/templates/`:

```
backend/src/
├── templates/
│   ├── partials/
│   │   ├── header.hbs           # FHI logo + company details
│   │   ├── footer.hbs           # Address, IEC, GST
│   │   ├── watermark.hbs        # Optional watermark
│   │   └── signature.hbs        # Authorized signatory block
│   ├── quotation.hbs            # Buyer-facing quotation
│   ├── proforma-invoice.hbs     # Proforma invoice
│   ├── product-spec.hbs         # Product specification sheet
│   ├── packing-summary.hbs      # Packing details
│   ├── internal-costing.hbs     # Internal cost sheet (not for buyer)
│   └── margin-analysis.hbs      # Internal margin report
```

---

## 3.4 PDF Generation Service

`backend/src/modules/documents/pdf.service.ts`:

```typescript
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export class PdfService {

  private async compileTemplate(templateName: string, data: object): Promise<string> {
    const templatePath = path.join(__dirname, '../../templates', `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');

    // Register partials
    this.registerPartials();

    const template = Handlebars.compile(templateSource);
    return template(data);
  }

  private registerPartials() {
    const partialsDir = path.join(__dirname, '../../templates/partials');
    const partials = fs.readdirSync(partialsDir);
    partials.forEach(file => {
      const name = path.basename(file, '.hbs');
      const source = fs.readFileSync(path.join(partialsDir, file), 'utf-8');
      Handlebars.registerPartial(name, source);
    });
  }

  async generatePdf(templateName: string, data: object): Promise<Buffer> {
    const html = await this.compileTemplate(templateName, data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],  // required for Railway/Render
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,   // needed for colored headers/footers
    });

    await browser.close();
    return Buffer.from(pdf);
  }
}
```

---

## 3.5 Quotation Template Data Structure

When generating a buyer quotation, assemble this data object:

```typescript
interface QuotationTemplateData {
  // FHI Company Info
  company: {
    name: string;           // "Flourish High International Pvt. Ltd."
    tagline: string;
    logo: string;           // base64 or URL
    address: string;
    email: string;
    website: string;
    phone: string;
    iecNumber: string;
    gstNumber: string;
  };

  // Quote Meta
  quoteNumber: string;      // FHI-TXT-AUS-2026-00021
  quoteDate: string;        // formatted
  validUntil: string;
  incoterm: string;
  portOfOrigin: string;
  portOfDestination: string;

  // Buyer Info
  buyer: {
    name: string;
    companyName: string;
    address: string;
    country: string;
    email: string;
    phone: string;
  };

  // Products
  items: Array<{
    srNo: number;
    productCode: string;
    description: string;
    specifications: string;    // formatted attribute summary
    quantity: number;
    unit: string;              // "PCS" | "KG" | "SET"
    unitPrice: string;         // formatted with currency symbol
    totalPrice: string;
  }>;

  // Totals
  currency: string;
  subtotal: string;
  grandTotal: string;

  // Terms
  paymentTerms: string;
  deliveryTime: string;
  packagingDetails: string;

  // Branding
  brandColor: string;          // e.g. "#1E3A5F"
  showWatermark: boolean;
}
```

---

## 3.6 HTML Template Design

`templates/quotation.hbs` — key sections:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Use inline CSS for PDF compatibility */
    body { font-family: 'Helvetica', sans-serif; color: #1a1a1a; font-size: 11px; }
    .header { background: {{brandColor}}; color: white; padding: 20px; }
    .company-name { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
    .quote-badge { background: #f0f4f8; border-left: 4px solid {{brandColor}}; padding: 12px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .items-table th { background: {{brandColor}}; color: white; padding: 8px; text-align: left; }
    .items-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    .items-table tr:nth-child(even) { background: #f9fafb; }
    .totals-box { float: right; width: 280px; margin-top: 20px; }
    .grand-total { background: {{brandColor}}; color: white; font-weight: bold; font-size: 13px; }
    .terms-section { margin-top: 30px; font-size: 10px; color: #6b7280; }
    .signature-block { margin-top: 40px; }
    .page-break { page-break-after: always; }
    @media print { .page-break { page-break-after: always; } }
  </style>
</head>
<body>

  {{> header}}

  <!-- Quote Reference -->
  <div class="quote-badge">
    <strong>QUOTATION</strong> &nbsp;&nbsp; Ref: {{quoteNumber}} &nbsp;&nbsp; Date: {{quoteDate}} &nbsp;&nbsp; Valid Until: {{validUntil}}
  </div>

  <!-- Buyer Info -->
  <table style="width:100%; margin-top:20px;">
    <tr>
      <td style="width:50%; vertical-align:top;">
        <strong>To:</strong><br>
        {{buyer.companyName}}<br>
        Attn: {{buyer.name}}<br>
        {{buyer.address}}<br>
        {{buyer.country}}<br>
        {{buyer.email}}
      </td>
      <td style="width:50%; vertical-align:top; text-align:right;">
        <strong>Shipment Terms:</strong> {{incoterm}}<br>
        <strong>Port of Origin:</strong> {{portOfOrigin}}<br>
        <strong>Port of Destination:</strong> {{portOfDestination}}<br>
        <strong>Currency:</strong> {{currency}}
      </td>
    </tr>
  </table>

  <!-- Product Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Product Code</th>
        <th>Description & Specifications</th>
        <th>Qty</th>
        <th>Unit Price ({{currency}})</th>
        <th>Total ({{currency}})</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{srNo}}</td>
        <td>{{productCode}}</td>
        <td>{{description}}<br><small style="color:#6b7280;">{{specifications}}</small></td>
        <td>{{quantity}} {{unit}}</td>
        <td>{{unitPrice}}</td>
        <td>{{totalPrice}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-box">
    <table style="width:100%;">
      <tr><td>Subtotal:</td><td style="text-align:right;">{{currency}} {{subtotal}}</td></tr>
      <tr class="grand-total"><td>GRAND TOTAL:</td><td style="text-align:right;">{{currency}} {{grandTotal}}</td></tr>
    </table>
  </div>

  <!-- Terms -->
  <div class="terms-section" style="clear:both;">
    <strong>Terms & Conditions:</strong><br>
    Payment Terms: {{paymentTerms}}<br>
    Delivery Time: {{deliveryTime}}<br>
    Packaging: {{packagingDetails}}
  </div>

  {{> signature}}
  {{> footer}}

</body>
</html>
```

---

## 3.7 Document API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/documents/quote/:quoteId/quotation` | Generate & return buyer quotation PDF |
| GET | `/api/documents/quote/:quoteId/proforma` | Generate proforma invoice PDF |
| GET | `/api/documents/quote/:quoteId/spec-sheet` | Generate product spec sheet PDF |
| GET | `/api/documents/quote/:quoteId/packing` | Generate packing summary PDF |
| GET | `/api/documents/quote/:quoteId/internal-costing` | Generate internal costing sheet (protected) |
| GET | `/api/documents/quote/:quoteId/margin-analysis` | Generate margin analysis (Finance role only) |
| POST | `/api/documents/quote/:quoteId/save` | Generate + save PDF to storage, record in DB |

### Controller Pattern

```typescript
export async function generateQuotationPdf(req: Request, res: Response) {
  const { quoteId } = req.params;

  // Fetch full quote with all relations
  const quote = await quoteService.getFullQuote(quoteId);

  // Assemble template data
  const templateData = assembleQuotationData(quote);

  // Generate PDF
  const pdfService = new PdfService();
  const pdfBuffer = await pdfService.generatePdf('quotation', templateData);

  // Stream to client
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${quote.quoteNumber}-Quotation.pdf"`,
    'Content-Length': pdfBuffer.length,
  });

  res.end(pdfBuffer);
}
```

---

## 3.8 File Storage (Optional for MVP)

For MVP, stream PDFs directly to client without saving. In Phase 3+, optionally store to Cloudinary:

```typescript
import { v2 as cloudinary } from 'cloudinary';

async function uploadPdfToCloudinary(pdfBuffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'fhi-documents', public_id: filename },
      (err, result) => {
        if (err) reject(err);
        else resolve(result!.secure_url);
      }
    ).end(pdfBuffer);
  });
}
```

Then save URL to `QuoteDocument` table.

---

## 3.9 Frontend — Document Actions

On the Quote detail page, add a **Documents panel**:

```typescript
// components/quotes/DocumentPanel.tsx

const documents = [
  {
    label: 'Buyer Quotation',
    description: 'Branded PDF for the buyer',
    endpoint: 'quotation',
    icon: FileText,
    roles: ['ADMIN', 'TRADE_MANAGER', 'SALES'],
  },
  {
    label: 'Proforma Invoice',
    description: 'For payment initiation',
    endpoint: 'proforma',
    icon: Receipt,
    roles: ['ADMIN', 'TRADE_MANAGER', 'SALES'],
  },
  {
    label: 'Product Spec Sheet',
    description: 'Technical product details',
    endpoint: 'spec-sheet',
    icon: ClipboardList,
    roles: ['ADMIN', 'TRADE_MANAGER', 'SALES', 'OPERATIONS'],
  },
  {
    label: 'Internal Costing Sheet',
    description: 'Full cost breakdown (internal only)',
    endpoint: 'internal-costing',
    icon: Calculator,
    roles: ['ADMIN', 'TRADE_MANAGER', 'FINANCE'],
  },
  {
    label: 'Margin Analysis',
    description: 'Profitability breakdown',
    endpoint: 'margin-analysis',
    icon: TrendingUp,
    roles: ['ADMIN', 'FINANCE'],
  },
];
```

Each document card shows:
- Label + description
- Download button → calls API, triggers browser download
- "Last generated: X days ago" if saved

### Download Handler

```typescript
async function downloadDocument(quoteId: string, type: string, filename: string) {
  const response = await api.get(`/documents/quote/${quoteId}/${type}`, {
    responseType: 'blob',
  });

  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

---

## 3.10 Internal Costing Sheet Template

The internal sheet (never shared with buyer) shows:

| Section | Fields |
|---|---|
| Product Cost | Supplier cost, packaging, QC, sampling, tooling |
| Logistics Breakdown | Every individual cost line with amounts |
| Operational Costs | Bank, commission, admin, misc |
| Margin | Margin %, margin amount, risk buffer |
| FX Details | Exchange rate, FX buffer, effective rate |
| Profitability | Net profit INR, profit per unit, score |

Add a **red "INTERNAL — NOT FOR DISTRIBUTION"** watermark banner on this document.

---

## 3.11 Handlebars Helpers

Register useful Handlebars helpers for templates:

```typescript
Handlebars.registerHelper('formatCurrency', (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
});

Handlebars.registerHelper('formatDate', (date: string) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
});

Handlebars.registerHelper('uppercase', (str: string) => str.toUpperCase());
```

---

## 3.12 Phase 3 Completion Checklist

### Backend
- [ ] Puppeteer installed and working on Railway/Render
- [ ] PdfService built with Handlebars template compilation
- [ ] Partial templates built (header, footer, signature, watermark)
- [ ] Buyer Quotation template built and styled
- [ ] Proforma Invoice template built
- [ ] Product Spec Sheet template built
- [ ] Internal Costing Sheet template built
- [ ] Margin Analysis template built
- [ ] All document API endpoints returning correct PDFs
- [ ] Role-based access on internal documents (Finance only for margin analysis)
- [ ] Handlebars helpers registered (currency, date formatting)

### Frontend
- [ ] Documents panel on Quote detail page
- [ ] Download handler working (blob download)
- [ ] Role-based document visibility working
- [ ] Loading state during PDF generation
- [ ] Document history (last generated date) if storage enabled

### Quality
- [ ] PDFs render correctly on A4
- [ ] Company logo appears correctly
- [ ] Brand color applied
- [ ] Multi-page documents paginate correctly
- [ ] Internal costing sheet has watermark

---

## 3.13 Claude Code Prompts for This Phase

**For PDF Service:**
> "Build a Puppeteer-based PDF generation service in TypeScript for an Express.js backend deployed on Railway. It takes a Handlebars template name and data object, compiles the template, renders in headless Chrome, and returns a PDF buffer. Include partial template support. Puppeteer must use --no-sandbox for Railway."

**For Quotation Template:**
> "Build an A4-sized HTML/Handlebars quotation template for an Indian export company called Flourish High International. The template has: branded header with logo and company details, buyer info block, product items table, totals box, terms section, and authorized signatory footer. Use inline CSS. Brand color variable: {{brandColor}}"

**For Download Handler:**
> "Write a React function that calls an Express API endpoint returning a PDF blob, then triggers a browser download. Use Axios with responseType: blob. Handle loading state and errors. The filename should be passed as a parameter."

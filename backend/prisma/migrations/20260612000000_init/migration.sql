-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TRADE_MANAGER', 'SALES', 'FINANCE', 'OPERATIONS');

-- CreateEnum
CREATE TYPE "BuyerCategory" AS ENUM ('DISTRIBUTOR', 'RETAILER', 'HOSPITALITY', 'IMPORTER', 'WHOLESALER', 'MARKETPLACE', 'OEM_BUYER');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('INR', 'AUD', 'NZD', 'JPY', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'SENT_TO_BUYER', 'NEGOTIATION', 'APPROVED', 'PO_RECEIVED', 'SHIPMENT_PLANNED', 'CLOSED', 'LOST');

-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('EXW', 'FOB', 'CIF', 'CFR', 'DDP');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('PRODUCT', 'LOGISTICS', 'OPERATIONAL', 'MARGIN');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('QUOTATION_PDF', 'PROFORMA_INVOICE', 'PRODUCT_SPEC_SHEET', 'PACKING_SUMMARY', 'INTERNAL_COSTING', 'MARGIN_ANALYSIS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SALES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "buyerCategory" "BuyerCategory" NOT NULL,
    "portOfDest" TEXT,
    "notes" TEXT,
    "productInterests" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_lines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "productLineId" TEXT NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "productTypeId" TEXT NOT NULL,
    "moq" INTEGER,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "attributes" JSONB,
    "baseSupplierCost" DECIMAL(12,2),
    "packagingDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "region" TEXT,
    "gstNumber" TEXT,
    "iecNumber" TEXT,
    "exportCapable" BOOLEAN NOT NULL DEFAULT true,
    "moq" INTEGER,
    "leadTimeDays" INTEGER,
    "certifications" TEXT[],
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freight_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originPort" TEXT NOT NULL,
    "destinationPort" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "freightCost20ft" DECIMAL(12,2) NOT NULL,
    "freightCost40ft" DECIMAL(12,2) NOT NULL,
    "transitDays" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freight_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_charge_templates" (
    "id" TEXT NOT NULL,
    "portName" TEXT NOT NULL,
    "chaCharges" DECIMAL(12,2) NOT NULL,
    "portCharges" DECIMAL(12,2) NOT NULL,
    "handlingCharges" DECIMAL(12,2) NOT NULL,
    "documentCharges" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "port_charge_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_rates" (
    "id" TEXT NOT NULL,
    "fromCurrency" "Currency" NOT NULL,
    "toCurrency" "Currency" NOT NULL,
    "rate" DECIMAL(12,6) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "lockedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "incoterm" "Incoterm" NOT NULL,
    "buyerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "exchangeRate" DECIMAL(12,6) NOT NULL,
    "fxBuffer" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "internalNotes" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitSupplierCost" DECIMAL(12,2) NOT NULL,
    "packagingCostPerUnit" DECIMAL(12,2) NOT NULL,
    "labelingCostPerUnit" DECIMAL(12,2) NOT NULL,
    "qcCostPerUnit" DECIMAL(12,2) NOT NULL,
    "samplingCost" DECIMAL(12,2) NOT NULL,
    "toolingCost" DECIMAL(12,2) NOT NULL,
    "marginPercent" DECIMAL(5,2) NOT NULL,
    "totalProductCostInr" DECIMAL(14,2) NOT NULL,
    "unitSellingPrice" DECIMAL(12,4) NOT NULL,
    "totalLineValue" DECIMAL(14,4) NOT NULL,
    "unitsPerCarton" INTEGER,
    "cartonsPerPallet" INTEGER,
    "cartonLWHCm" JSONB,
    "cartonWeightKg" DECIMAL(8,2),
    "totalCbm" DECIMAL(10,4),
    "totalWeightKg" DECIMAL(10,2),

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_costs" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "quote_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_status_history" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "fromStatus" "QuoteStatus",
    "toStatus" "QuoteStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "quote_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_documents" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_notes" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT,
    "quoteId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quoteId" TEXT,
    "buyerId" TEXT,
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quoteData" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "buyers_country_idx" ON "buyers"("country");

-- CreateIndex
CREATE INDEX "buyers_buyerCategory_idx" ON "buyers"("buyerCategory");

-- CreateIndex
CREATE UNIQUE INDEX "product_lines_name_key" ON "product_lines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_lines_code_key" ON "product_lines"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE INDEX "products_productCode_idx" ON "products"("productCode");

-- CreateIndex
CREATE INDEX "products_productTypeId_idx" ON "products"("productTypeId");

-- CreateIndex
CREATE INDEX "freight_templates_destinationCountry_idx" ON "freight_templates"("destinationCountry");

-- CreateIndex
CREATE UNIQUE INDEX "port_charge_templates_portName_key" ON "port_charge_templates"("portName");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quoteNumber_key" ON "quotes"("quoteNumber");

-- CreateIndex
CREATE INDEX "quotes_buyerId_idx" ON "quotes"("buyerId");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_createdById_idx" ON "quotes"("createdById");

-- CreateIndex
CREATE INDEX "quotes_createdAt_idx" ON "quotes"("createdAt");

-- CreateIndex
CREATE INDEX "quote_items_quoteId_idx" ON "quote_items"("quoteId");

-- CreateIndex
CREATE INDEX "quote_costs_quoteId_idx" ON "quote_costs"("quoteId");

-- CreateIndex
CREATE INDEX "quote_status_history_quoteId_idx" ON "quote_status_history"("quoteId");

-- CreateIndex
CREATE INDEX "quote_documents_quoteId_idx" ON "quote_documents"("quoteId");

-- CreateIndex
CREATE INDEX "buyer_notes_buyerId_idx" ON "buyer_notes"("buyerId");

-- CreateIndex
CREATE INDEX "follow_ups_dueDate_idx" ON "follow_ups"("dueDate");

-- CreateIndex
CREATE INDEX "follow_ups_createdById_idx" ON "follow_ups"("createdById");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_productLineId_fkey" FOREIGN KEY ("productLineId") REFERENCES "product_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_costs" ADD CONSTRAINT "quote_costs_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_status_history" ADD CONSTRAINT "quote_status_history_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_status_history" ADD CONSTRAINT "quote_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_documents" ADD CONSTRAINT "quote_documents_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_notes" ADD CONSTRAINT "buyer_notes_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_notes" ADD CONSTRAINT "buyer_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_templates" ADD CONSTRAINT "quote_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


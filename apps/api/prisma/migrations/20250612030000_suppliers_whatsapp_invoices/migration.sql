-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "cnpj" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contact_name" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "payment_terms" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoices" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "number" TEXT,
    "series" TEXT,
    "access_key" TEXT,
    "issue_date" DATE,
    "total_amount" DECIMAL(10,2),
    "file_url" TEXT,
    "file_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "raw_data" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_message_logs" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "template_key" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "order_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_sessions" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_sessions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ingredient_purchases" ADD COLUMN "supplier_id" TEXT;
ALTER TABLE "ingredient_purchases" ADD COLUMN "invoice_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_key" ON "suppliers"("cnpj");
CREATE UNIQUE INDEX "purchase_invoices_access_key_key" ON "purchase_invoices"("access_key");
CREATE UNIQUE INDEX "message_templates_key_key" ON "message_templates"("key");
CREATE INDEX "purchase_invoices_status_idx" ON "purchase_invoices"("status");
CREATE INDEX "whatsapp_message_logs_phone_idx" ON "whatsapp_message_logs"("phone");
CREATE INDEX "whatsapp_message_logs_created_at_idx" ON "whatsapp_message_logs"("created_at");
CREATE INDEX "otp_sessions_phone_idx" ON "otp_sessions"("phone");
CREATE INDEX "ingredient_purchases_supplier_id_idx" ON "ingredient_purchases"("supplier_id");

-- AddForeignKey
ALTER TABLE "ingredient_purchases" ADD CONSTRAINT "ingredient_purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ingredient_purchases" ADD CONSTRAINT "ingredient_purchases_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

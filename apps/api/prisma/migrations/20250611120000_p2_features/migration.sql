-- Delivery zones, promo codes, delivery blocks, order promo_code
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "zip_prefixes" JSONB NOT NULL DEFAULT '[]',
    "neighborhoods" JSONB,
    "delivery_fee" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_order_value" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "uses_count" INTEGER NOT NULL DEFAULT 0,
    "max_uses" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

CREATE TABLE "delivery_blocks" (
    "id" TEXT NOT NULL,
    "block_date" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_blocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_blocks_block_date_key" ON "delivery_blocks"("block_date");

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promo_code" TEXT;

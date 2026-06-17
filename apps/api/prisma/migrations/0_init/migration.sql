-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit_type" TEXT NOT NULL,
    "weight_grams" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "stock_qty" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "min_stock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "is_pre_cut" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combos" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serves_people" INTEGER,
    "weight_label" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_items" (
    "id" TEXT NOT NULL,
    "combo_id" TEXT NOT NULL,
    "product_id" TEXT,
    "item_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "combo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_windows" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "cutoff_weekday" INTEGER NOT NULL,
    "cutoff_hour" INTEGER NOT NULL DEFAULT 18,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "delivery_window_id" TEXT NOT NULL,
    "delivery_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "address_json" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "combo_id" TEXT,
    "item_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_label" TEXT NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(10,2) NOT NULL,
    "pix_copy_paste" TEXT,
    "idempotency_key" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "reason" TEXT,
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "store_name" TEXT NOT NULL,
    "tagline" TEXT,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 12,
    "min_order_value" DECIMAL(10,2) NOT NULL DEFAULT 49,
    "whatsapp" TEXT,
    "about_text" TEXT,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "purchase_unit" TEXT NOT NULL,
    "avg_yield_percent" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "cost_per_kg_net" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "stock_gross_qty" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "stock_net_qty" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "min_stock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "perishable" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_purchases" (
    "id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "supplier" TEXT,
    "purchase_date" DATE NOT NULL,
    "price_paid" DECIMAL(10,2) NOT NULL,
    "gross_weight_grams" INTEGER NOT NULL,
    "net_weight_grams" INTEGER NOT NULL,
    "yield_percent" DECIMAL(5,2) NOT NULL,
    "cost_per_kg_net" DECIMAL(10,4) NOT NULL,
    "expiry_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yield_records" (
    "id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "loss_type" TEXT NOT NULL,
    "gross_weight_grams" INTEGER NOT NULL,
    "net_weight_grams" INTEGER NOT NULL,
    "yield_percent" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yield_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packaging" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size_label" TEXT NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "capacity_grams" INTEGER,
    "capacity_ml" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packaging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_id" TEXT,
    "combo_id" TEXT,
    "packaging_id" TEXT,
    "target_margin_percent" DECIMAL(6,2) NOT NULL DEFAULT 120,
    "min_margin_percent" DECIMAL(6,2) NOT NULL DEFAULT 80,
    "ideal_margin_percent" DECIMAL(6,2) NOT NULL DEFAULT 150,
    "waste_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "computed_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "suggested_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "quantity_grams" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "default_target_margin" DECIMAL(6,2) NOT NULL DEFAULT 120,
    "default_min_margin" DECIMAL(6,2) NOT NULL DEFAULT 80,
    "default_ideal_margin" DECIMAL(6,2) NOT NULL DEFAULT 150,
    "round_increment" DECIMAL(4,2) NOT NULL DEFAULT 0.1,
    "auto_update_prices" BOOLEAN NOT NULL DEFAULT false,
    "perishable_markup_boost" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "yield_history_size" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "pricing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_alerts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_stock_movements" (
    "id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "combo_items_combo_id_idx" ON "combo_items"("combo_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_delivery_date_idx" ON "orders"("delivery_date");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "ingredients_category_idx" ON "ingredients"("category");

-- CreateIndex
CREATE INDEX "ingredient_purchases_ingredient_id_idx" ON "ingredient_purchases"("ingredient_id");

-- CreateIndex
CREATE INDEX "ingredient_purchases_purchase_date_idx" ON "ingredient_purchases"("purchase_date");

-- CreateIndex
CREATE INDEX "yield_records_ingredient_id_idx" ON "yield_records"("ingredient_id");

-- CreateIndex
CREATE INDEX "recipes_product_id_idx" ON "recipes"("product_id");

-- CreateIndex
CREATE INDEX "recipes_combo_id_idx" ON "recipes"("combo_id");

-- CreateIndex
CREATE INDEX "recipe_items_recipe_id_idx" ON "recipe_items"("recipe_id");

-- CreateIndex
CREATE INDEX "pricing_alerts_read_idx" ON "pricing_alerts"("read");

-- CreateIndex
CREATE INDEX "ingredient_stock_movements_ingredient_id_idx" ON "ingredient_stock_movements"("ingredient_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combos" ADD CONSTRAINT "combos_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_window_id_fkey" FOREIGN KEY ("delivery_window_id") REFERENCES "delivery_windows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_purchases" ADD CONSTRAINT "ingredient_purchases_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_records" ADD CONSTRAINT "yield_records_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_packaging_id_fkey" FOREIGN KEY ("packaging_id") REFERENCES "packaging"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_stock_movements" ADD CONSTRAINT "ingredient_stock_movements_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


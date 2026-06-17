-- Subscriptions, push notifications, order subscription link
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subscription_id" TEXT;

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "delivery_window_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "address_json" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_items" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "combo_id" TEXT,
    "product_id" TEXT,
    "item_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_label" TEXT NOT NULL,
    CONSTRAINT "subscription_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys_json" JSONB NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX "subscription_items_subscription_id_idx" ON "subscription_items"("subscription_id");

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_delivery_window_id_fkey" FOREIGN KEY ("delivery_window_id") REFERENCES "delivery_windows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

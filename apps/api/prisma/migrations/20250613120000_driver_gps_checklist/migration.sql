ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "driver_pin_hash" TEXT;

CREATE TABLE IF NOT EXISTS "driver_live_state" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "active_order_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "driver_live_state_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "order_checklist_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "item_index" INTEGER NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_label" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checked_at" TIMESTAMP(3),
    CONSTRAINT "order_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "order_checklist_items_order_id_item_index_key"
    ON "order_checklist_items"("order_id", "item_index");

ALTER TABLE "order_checklist_items"
    ADD CONSTRAINT "order_checklist_items_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "driver_live_state" ("id", "updated_at") VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

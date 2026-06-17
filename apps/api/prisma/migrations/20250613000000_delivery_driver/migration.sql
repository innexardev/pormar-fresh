ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "depot_address_json" JSONB;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "depot_lat" DECIMAL(10,7);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "depot_lng" DECIMAL(10,7);

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_proof_url" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_completed_at" TIMESTAMP(3);

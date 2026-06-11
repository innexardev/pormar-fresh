-- Product & combo images + home content

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "combos" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "hero_image_url" TEXT;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "hero_fallback_urls" JSONB;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "home_cards_json" JSONB;

ALTER TABLE "delivery_windows" ADD COLUMN IF NOT EXISTS "order_deadline_days_before" INTEGER NOT NULL DEFAULT 1;

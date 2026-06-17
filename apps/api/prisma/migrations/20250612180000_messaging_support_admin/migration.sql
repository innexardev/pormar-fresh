-- StoreSettings: admin team notifications & engagement
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "admin_notify_phone_1" TEXT;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "admin_notify_phone_2" TEXT;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "admin_notify_events_json" JSONB;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "inactivity_reminder_days" INTEGER NOT NULL DEFAULT 14;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "inactivity_reminder_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Customer engagement tracking
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_engagement_reminder_at" TIMESTAMP(3);

-- MessageTemplate category
ALTER TABLE "message_templates" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'transactional';

-- Bot menu options (predefined WhatsApp replies)
CREATE TABLE IF NOT EXISTS "bot_menu_options" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "response_text" TEXT,
    "response_template_key" TEXT,
    "action" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_menu_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "bot_menu_options_trigger_key" ON "bot_menu_options"("trigger");

-- Support tickets
CREATE TABLE IF NOT EXISTS "support_tickets" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "phone" TEXT NOT NULL,
    "customer_name" TEXT,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX IF NOT EXISTS "support_tickets_phone_idx" ON "support_tickets"("phone");
CREATE INDEX IF NOT EXISTS "support_tickets_created_at_idx" ON "support_tickets"("created_at");
CREATE INDEX IF NOT EXISTS "support_messages_ticket_id_idx" ON "support_messages"("ticket_id");

ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_customer_id_fkey";
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_order_id_fkey";
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_messages" DROP CONSTRAINT IF EXISTS "support_messages_ticket_id_fkey";
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

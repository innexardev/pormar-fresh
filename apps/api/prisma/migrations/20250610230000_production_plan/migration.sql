-- ProductionPlan module (Pomar Fresh P1)

CREATE TABLE "production_plans" (
    "id" TEXT NOT NULL,
    "delivery_window_id" TEXT NOT NULL,
    "delivery_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "cutoff_at" TIMESTAMP(3),
    "warnings_json" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_plan_outputs" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "recipe_id" TEXT,
    "combo_id" TEXT,
    "product_id" TEXT,
    "item_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "production_plan_outputs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_plan_ingredients" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "net_grams_needed" INTEGER NOT NULL,
    "gross_grams_needed" INTEGER NOT NULL,
    "stock_net_grams" INTEGER NOT NULL,
    "purchase_gross_grams" INTEGER NOT NULL,

    CONSTRAINT "production_plan_ingredients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_plan_packaging" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "packaging_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "production_plan_packaging_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "production_plans_delivery_window_id_delivery_date_key" ON "production_plans"("delivery_window_id", "delivery_date");
CREATE INDEX "production_plans_delivery_date_idx" ON "production_plans"("delivery_date");
CREATE INDEX "production_plan_outputs_plan_id_idx" ON "production_plan_outputs"("plan_id");
CREATE INDEX "production_plan_ingredients_plan_id_idx" ON "production_plan_ingredients"("plan_id");
CREATE INDEX "production_plan_packaging_plan_id_idx" ON "production_plan_packaging"("plan_id");

ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_delivery_window_id_fkey" FOREIGN KEY ("delivery_window_id") REFERENCES "delivery_windows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_plan_outputs" ADD CONSTRAINT "production_plan_outputs_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "production_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_plan_ingredients" ADD CONSTRAINT "production_plan_ingredients_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "production_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_plan_ingredients" ADD CONSTRAINT "production_plan_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_plan_packaging" ADD CONSTRAINT "production_plan_packaging_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "production_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_plan_packaging" ADD CONSTRAINT "production_plan_packaging_packaging_id_fkey" FOREIGN KEY ("packaging_id") REFERENCES "packaging"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "transformation_results" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_revenue" DECIMAL(14,2) NOT NULL,
    "sale_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transformation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_aggregates" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "sale_date" DATE NOT NULL,
    "total_quantity" INTEGER NOT NULL,
    "total_revenue" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transformation_results_batch_id_idx" ON "transformation_results"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_aggregates_batch_id_product_name_sale_date_key" ON "daily_aggregates"("batch_id", "product_name", "sale_date");

-- CreateIndex
CREATE INDEX "daily_aggregates_sale_date_idx" ON "daily_aggregates"("sale_date");

-- CreateIndex
CREATE INDEX "daily_aggregates_product_name_idx" ON "daily_aggregates"("product_name");

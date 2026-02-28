-- CreateEnum
CREATE TYPE "CycleType" AS ENUM ('monthly_fixed', 'monthly_variable', 'irregular_fixed', 'irregular_variable');

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "major_category" TEXT NOT NULL,
    "minor_category" TEXT NOT NULL,
    "institution" TEXT,
    "memo" TEXT,
    "moneyforward_id" TEXT,
    "is_income" BOOLEAN NOT NULL DEFAULT false,
    "import_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_amount" INTEGER NOT NULL,
    "cycle_type" "CycleType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_category_mappings" (
    "id" TEXT NOT NULL,
    "budget_item_id" TEXT NOT NULL,
    "major_category" TEXT NOT NULL,
    "minor_category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_category_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_import_hash_key" ON "transactions"("import_hash");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date" DESC);

-- CreateIndex
CREATE INDEX "transactions_major_category_minor_category_idx" ON "transactions"("major_category", "minor_category");

-- CreateIndex
CREATE UNIQUE INDEX "budget_category_mappings_budget_item_id_major_category_mino_key" ON "budget_category_mappings"("budget_item_id", "major_category", "minor_category");

-- AddForeignKey
ALTER TABLE "budget_category_mappings" ADD CONSTRAINT "budget_category_mappings_budget_item_id_fkey" FOREIGN KEY ("budget_item_id") REFERENCES "budget_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

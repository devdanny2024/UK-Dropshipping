-- Add weight fields to Category
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "defaultWeightGrams" INTEGER;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "defaultChargeableWeightGrams" INTEGER;

-- Add weight fields to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "chargeableWeightGrams" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizes" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "gender" TEXT;

-- Add weight fields to Quote
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "itemWeightGrams" INTEGER;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "chargeableWeightGrams" INTEGER;

-- Create WeightReference table
CREATE TABLE IF NOT EXISTS "WeightReference" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "actualWeightGrams" INTEGER,
    "chargeableWeightGrams" INTEGER NOT NULL,
    "isNamedProduct" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeightReference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WeightReference_category_label_key" ON "WeightReference"("category", "label");
CREATE INDEX IF NOT EXISTS "WeightReference_category_idx" ON "WeightReference"("category");
CREATE INDEX IF NOT EXISTS "WeightReference_isNamedProduct_idx" ON "WeightReference"("isNamedProduct");

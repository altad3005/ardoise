-- DropForeignKey
ALTER TABLE "bar"."sale_items" DROP CONSTRAINT "sale_items_product_id_fkey";

-- AlterTable
ALTER TABLE "bar"."sale_items" ALTER COLUMN "product_id" DROP NOT NULL,
ALTER COLUMN "consumed_quantity" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "bar"."sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "bar"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A sale item consumes a product quantity, or nothing at all when it is stockless
ALTER TABLE "bar"."sale_items" ADD CONSTRAINT "sale_items_consumption_check" CHECK (("product_id" IS NULL) = ("consumed_quantity" IS NULL));

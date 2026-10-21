-- AlterTable
ALTER TABLE "bar"."sale_items" ADD COLUMN     "menu_position" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "sale_items_association_id_menu_position_key" ON "bar"."sale_items"("association_id", "menu_position");


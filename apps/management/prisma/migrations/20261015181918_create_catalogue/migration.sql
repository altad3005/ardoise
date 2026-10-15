-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "bar";

-- CreateEnum
CREATE TYPE "bar"."ProductCategory" AS ENUM ('PILSNER', 'SPECIALTY_BEER', 'SOFT_DRINK', 'SPIRIT', 'WINE');

-- CreateTable
CREATE TABLE "bar"."products" (
    "id" UUID NOT NULL,
    "association_id" UUID,
    "name" TEXT NOT NULL,
    "category" "bar"."ProductCategory" NOT NULL,
    "stock_unit" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bar"."association_products" (
    "association_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "association_products_pkey" PRIMARY KEY ("association_id","product_id")
);

-- CreateTable
CREATE TABLE "bar"."sale_items" (
    "id" UUID NOT NULL,
    "association_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "consumed_quantity" DECIMAL(12,4) NOT NULL,
    "base_price_cents" INTEGER,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_association_id_idx" ON "bar"."products"("association_id");

-- CreateIndex
CREATE INDEX "sale_items_association_id_idx" ON "bar"."sale_items"("association_id");

-- AddForeignKey
ALTER TABLE "bar"."association_products" ADD CONSTRAINT "association_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "bar"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar"."sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "bar"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Shared catalogue
INSERT INTO "bar"."products" ("id", "name", "category", "stock_unit") VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Jupiler 25 cl', 'PILSNER', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000002', 'Stella Artois 25 cl', 'PILSNER', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000003', 'Leffe Blonde 33 cl', 'SPECIALTY_BEER', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000004', 'Chimay Bleue 33 cl', 'SPECIALTY_BEER', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000005', 'Duvel 33 cl', 'SPECIALTY_BEER', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000006', 'Karmeliet 33 cl', 'SPECIALTY_BEER', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000007', 'Kriek Belle-Vue 25 cl', 'SPECIALTY_BEER', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000008', 'Jupiler fût 20 L', 'PILSNER', 'fût'),
  ('c0000000-0000-4000-8000-000000000009', 'Coca-Cola 33 cl', 'SOFT_DRINK', 'canette'),
  ('c0000000-0000-4000-8000-000000000010', 'Coca-Cola Zero 33 cl', 'SOFT_DRINK', 'canette'),
  ('c0000000-0000-4000-8000-000000000011', 'Fanta 33 cl', 'SOFT_DRINK', 'canette'),
  ('c0000000-0000-4000-8000-000000000012', 'Sprite 33 cl', 'SOFT_DRINK', 'canette'),
  ('c0000000-0000-4000-8000-000000000013', 'Ice Tea 33 cl', 'SOFT_DRINK', 'canette'),
  ('c0000000-0000-4000-8000-000000000014', 'Eau plate 50 cl', 'SOFT_DRINK', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000015', 'Eau pétillante 50 cl', 'SOFT_DRINK', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000016', 'Jus d''orange 1 L', 'SOFT_DRINK', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000017', 'Ricard 1 L', 'SPIRIT', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000018', 'Martini Bianco 1 L', 'SPIRIT', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000019', 'Vodka 70 cl', 'SPIRIT', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000020', 'Gin 70 cl', 'SPIRIT', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000021', 'Whisky 70 cl', 'SPIRIT', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000022', 'Vin rouge 75 cl', 'WINE', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000023', 'Vin blanc 75 cl', 'WINE', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000024', 'Vin rosé 75 cl', 'WINE', 'bouteille'),
  ('c0000000-0000-4000-8000-000000000025', 'Cava 75 cl', 'WINE', 'bouteille');

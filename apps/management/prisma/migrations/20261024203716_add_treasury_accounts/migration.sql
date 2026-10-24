-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "treasury";

-- CreateEnum
CREATE TYPE "treasury"."AccountType" AS ENUM ('BANK', 'CASH');

-- CreateTable
CREATE TABLE "treasury"."accounts" (
    "id" UUID NOT NULL,
    "association_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "treasury"."AccountType" NOT NULL,
    "opening_balance_cents" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_association_id_name_key" ON "treasury"."accounts"("association_id", "name");

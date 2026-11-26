-- CreateTable
CREATE TABLE "treasury"."treasury_settings" (
    "association_id" UUID NOT NULL,
    "default_project_id" UUID,
    "stock_project_id" UUID,
    "default_cash_account_id" UUID,

    CONSTRAINT "treasury_settings_pkey" PRIMARY KEY ("association_id")
);

-- AddForeignKey
ALTER TABLE "treasury"."treasury_settings" ADD CONSTRAINT "treasury_settings_default_project_id_fkey" FOREIGN KEY ("default_project_id") REFERENCES "treasury"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury"."treasury_settings" ADD CONSTRAINT "treasury_settings_stock_project_id_fkey" FOREIGN KEY ("stock_project_id") REFERENCES "treasury"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury"."treasury_settings" ADD CONSTRAINT "treasury_settings_default_cash_account_id_fkey" FOREIGN KEY ("default_cash_account_id") REFERENCES "treasury"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

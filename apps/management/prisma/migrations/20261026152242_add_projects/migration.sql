-- CreateTable
CREATE TABLE "treasury"."project_categories" (
    "id" UUID NOT NULL,
    "association_id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury"."projects" (
    "id" UUID NOT NULL,
    "association_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_association_id_name_key" ON "treasury"."project_categories"("association_id", "name");

-- CreateIndex
CREATE INDEX "projects_category_id_idx" ON "treasury"."projects"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_association_id_name_key" ON "treasury"."projects"("association_id", "name");

-- AddForeignKey
ALTER TABLE "treasury"."projects" ADD CONSTRAINT "projects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "treasury"."project_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

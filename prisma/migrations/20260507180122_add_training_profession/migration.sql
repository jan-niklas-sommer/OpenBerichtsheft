-- AlterTable
ALTER TABLE "users" ADD COLUMN     "professionId" TEXT;

-- CreateTable
CREATE TABLE "training_professions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_professions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_professions_name_key" ON "training_professions"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "training_professions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

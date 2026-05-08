-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('weekly', 'daily');

-- AlterTable
ALTER TABLE "daily_entries" ADD COLUMN     "reportText" TEXT;

-- AlterTable
ALTER TABLE "weekly_reports" ADD COLUMN     "reportType" "ReportType" NOT NULL DEFAULT 'weekly';

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

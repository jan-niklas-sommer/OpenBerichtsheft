-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'trainer', 'training_officer', 'trainee');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'needs_revision');

-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('company', 'vocational_school', 'vacation', 'other');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('created', 'autosaved', 'submitted', 'approved', 'needs_revision', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainee_trainer_assignments" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainee_trainer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainee_officer_assignments" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "trainingOfficerId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainee_officer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "calendarYear" INTEGER NOT NULL,
    "calendarWeek" INTEGER NOT NULL,
    "reportText" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_entries" (
    "id" TEXT NOT NULL,
    "weeklyReportId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayType" "DayType" NOT NULL DEFAULT 'company',
    "hours" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_events" (
    "id" TEXT NOT NULL,
    "weeklyReportId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "ReviewAction" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trainee_trainer_assignments_traineeId_trainerId_key" ON "trainee_trainer_assignments"("traineeId", "trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "trainee_officer_assignments_traineeId_trainingOfficerId_key" ON "trainee_officer_assignments"("traineeId", "trainingOfficerId");

-- CreateIndex
CREATE INDEX "weekly_reports_traineeId_idx" ON "weekly_reports"("traineeId");

-- CreateIndex
CREATE INDEX "weekly_reports_status_idx" ON "weekly_reports"("status");

-- CreateIndex
CREATE INDEX "weekly_reports_calendarYear_calendarWeek_idx" ON "weekly_reports"("calendarYear", "calendarWeek");

-- CreateIndex
CREATE INDEX "weekly_reports_weekStartDate_idx" ON "weekly_reports"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_traineeId_calendarYear_calendarWeek_key" ON "weekly_reports"("traineeId", "calendarYear", "calendarWeek");

-- CreateIndex
CREATE INDEX "daily_entries_weeklyReportId_idx" ON "daily_entries"("weeklyReportId");

-- CreateIndex
CREATE INDEX "review_events_weeklyReportId_idx" ON "review_events"("weeklyReportId");

-- AddForeignKey
ALTER TABLE "trainee_trainer_assignments" ADD CONSTRAINT "trainee_trainer_assignments_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainee_trainer_assignments" ADD CONSTRAINT "trainee_trainer_assignments_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainee_officer_assignments" ADD CONSTRAINT "trainee_officer_assignments_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainee_officer_assignments" ADD CONSTRAINT "trainee_officer_assignments_trainingOfficerId_fkey" FOREIGN KEY ("trainingOfficerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainee_officer_assignments" ADD CONSTRAINT "trainee_officer_assignments_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_weeklyReportId_fkey" FOREIGN KEY ("weeklyReportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_events" ADD CONSTRAINT "review_events_weeklyReportId_fkey" FOREIGN KEY ("weeklyReportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_events" ADD CONSTRAINT "review_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

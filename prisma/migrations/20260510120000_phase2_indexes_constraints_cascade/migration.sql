-- DropIndex (redundant with unique constraint)
DROP INDEX IF EXISTS "recurrence_exceptions_ruleId_date_idx";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_events_actorId_idx" ON "review_events"("actorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "weekly_reports_reviewedById_idx" ON "weekly_reports"("reviewedById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trainee_officer_assignments_traineeId_validFrom_validUntil_idx" ON "trainee_officer_assignments"("traineeId", "validFrom", "validUntil");

-- CreateIndex (unique constraint on daily_entries)
CREATE UNIQUE INDEX IF NOT EXISTS "daily_entries_weeklyReportId_date_key" ON "daily_entries"("weeklyReportId", "date");

-- AlterTable: ScheduleAssignment.createdBy optional + SetNull
ALTER TABLE "schedule_assignments" ALTER COLUMN "createdBy" DROP NOT NULL;

-- Drop existing cascade FK, recreate with SetNull
ALTER TABLE "schedule_assignments" DROP CONSTRAINT IF EXISTS "schedule_assignments_createdBy_fkey";
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: RecurrenceRule.createdById optional + SetNull
ALTER TABLE "recurrence_rules" ALTER COLUMN "createdById" DROP NOT NULL;

-- Drop existing cascade FK, recreate with SetNull
ALTER TABLE "recurrence_rules" DROP CONSTRAINT IF EXISTS "recurrence_rules_createdById_fkey";
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

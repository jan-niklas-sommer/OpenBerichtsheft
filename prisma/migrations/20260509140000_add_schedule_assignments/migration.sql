-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('department', 'school', 'vacation', 'other');

-- CreateTable
CREATE TABLE "schedule_assignments" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "department" TEXT,
    "supervisorId" TEXT,
    "color" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_assignments_traineeId_idx" ON "schedule_assignments"("traineeId");
CREATE INDEX "schedule_assignments_startDate_endDate_idx" ON "schedule_assignments"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

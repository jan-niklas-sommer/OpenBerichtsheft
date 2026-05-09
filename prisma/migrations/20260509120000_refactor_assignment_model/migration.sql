-- Create table for trainer-profession assignments
CREATE TABLE "trainer_profession_assignments" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_profession_assignments_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on trainer+profession
ALTER TABLE "trainer_profession_assignments" ADD CONSTRAINT "trainer_profession_assignments_trainerId_professionId_key" UNIQUE ("trainerId", "professionId");

-- Add foreign keys
ALTER TABLE "trainer_profession_assignments" ADD CONSTRAINT "trainer_profession_assignments_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trainer_profession_assignments" ADD CONSTRAINT "trainer_profession_assignments_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "training_professions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing trainer-trainee assignments to trainer-profession assignments
INSERT INTO "trainer_profession_assignments" ("id", "trainerId", "professionId", "createdAt", "updatedAt")
SELECT DISTINCT
    gen_random_uuid()::text,
    tta."trainerId",
    u."professionId",
    tta."createdAt",
    tta."updatedAt"
FROM "trainee_trainer_assignments" tta
JOIN "users" u ON u."id" = tta."traineeId"
WHERE u."professionId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Add new columns to trainee_officer_assignments
ALTER TABLE "trainee_officer_assignments" ADD COLUMN "assignedById" TEXT;
ALTER TABLE "trainee_officer_assignments" ADD COLUMN "validFrom" TIMESTAMP(3);
ALTER TABLE "trainee_officer_assignments" ADD COLUMN "validUntil" TIMESTAMP(3);

-- Migrate existing data: use trainerId as assignedById, set wide date range
UPDATE "trainee_officer_assignments"
SET "assignedById" = "trainerId",
    "validFrom" = '2020-01-01'::timestamp,
    "validUntil" = '2030-12-31'::timestamp;

-- Make new columns NOT NULL after migration
ALTER TABLE "trainee_officer_assignments" ALTER COLUMN "assignedById" SET NOT NULL;
ALTER TABLE "trainee_officer_assignments" ALTER COLUMN "validFrom" SET NOT NULL;
ALTER TABLE "trainee_officer_assignments" ALTER COLUMN "validUntil" SET NOT NULL;

-- Add foreign key for assignedById
ALTER TABLE "trainee_officer_assignments" ADD CONSTRAINT "trainee_officer_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old trainerId column (replaced by assignedById)
ALTER TABLE "trainee_officer_assignments" DROP CONSTRAINT "trainee_officer_assignments_trainerId_fkey";
ALTER TABLE "trainee_officer_assignments" DROP COLUMN "trainerId";

-- Drop unique constraint on trainee+officer if it exists (now multiple assignments with different periods are allowed)
ALTER TABLE "trainee_officer_assignments" DROP CONSTRAINT IF EXISTS "trainee_officer_assignments_traineeId_trainingOfficerId_key";

-- Add indexes
CREATE INDEX "trainee_officer_assignments_traineeId_idx" ON "trainee_officer_assignments"("traineeId");
CREATE INDEX "trainee_officer_assignments_trainingOfficerId_idx" ON "trainee_officer_assignments"("trainingOfficerId");

-- Drop old trainee_trainer_assignments table
DROP TABLE "trainee_trainer_assignments";

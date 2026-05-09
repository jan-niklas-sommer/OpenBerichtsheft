import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const fiAe = await prisma.trainingProfession.upsert({
    where: { name: "Fachinformatiker für Anwendungsentwicklung" },
    update: {},
    create: { name: "Fachinformatiker für Anwendungsentwicklung" },
  });

  const fiSi = await prisma.trainingProfession.upsert({
    where: { name: "Fachinformatiker für Systemintegration" },
    update: {},
    create: { name: "Fachinformatiker für Systemintegration" },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      role: Role.admin,
      passwordHash,
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: "trainer@example.com" },
    update: {},
    create: {
      email: "trainer@example.com",
      name: "Max Mustermann (Ausbilder)",
      role: Role.trainer,
      passwordHash,
    },
  });

  const officer = await prisma.user.upsert({
    where: { email: "officer@example.com" },
    update: {},
    create: {
      email: "officer@example.com",
      name: "Erika Mustermann (Ausbildungsbeauftragte)",
      role: Role.training_officer,
      passwordHash,
    },
  });

  const trainee = await prisma.user.upsert({
    where: { email: "trainee@example.com" },
    update: {},
    create: {
      email: "trainee@example.com",
      name: "Anna Azubi",
      role: Role.trainee,
      passwordHash,
      professionId: fiAe.id,
      trainingStartDate: new Date("2026-01-05"),
    },
  });

  const trainee2 = await prisma.user.upsert({
    where: { email: "trainee2@example.com" },
    update: {},
    create: {
      email: "trainee2@example.com",
      name: "Ben Azubi",
      role: Role.trainee,
      passwordHash,
      professionId: fiSi.id,
      trainingStartDate: new Date("2026-03-01"),
    },
  });

  await prisma.trainerProfessionAssignment.upsert({
    where: {
      trainerId_professionId: { trainerId: trainer.id, professionId: fiAe.id },
    },
    update: {},
    create: {
      trainerId: trainer.id,
      professionId: fiAe.id,
    },
  });

  await prisma.trainerProfessionAssignment.upsert({
    where: {
      trainerId_professionId: { trainerId: trainer.id, professionId: fiSi.id },
    },
    update: {},
    create: {
      trainerId: trainer.id,
      professionId: fiSi.id,
    },
  });

  const existingOfficerAssignment = await prisma.traineeOfficerAssignment.findFirst({
    where: { traineeId: trainee.id, trainingOfficerId: officer.id },
  });
  if (!existingOfficerAssignment) {
    await prisma.traineeOfficerAssignment.create({
      data: {
        traineeId: trainee.id,
        trainingOfficerId: officer.id,
        assignedById: trainer.id,
        validFrom: new Date("2026-01-01"),
        validUntil: new Date("2026-12-31"),
      },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "workingDays" },
    update: {},
    create: {
      key: "workingDays",
      value: JSON.stringify([1, 2, 3, 4, 5]),
    },
  });

  console.log("Seed data created:");
  console.log("  Admin:    admin@example.com / password123");
  console.log("  Ausbilder: trainer@example.com / password123");
  console.log("  Offizier:  officer@example.com / password123");
  console.log("  Azubi 1:  trainee@example.com / password123");
  console.log("  Azubi 2:  trainee2@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

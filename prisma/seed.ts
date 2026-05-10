import { PrismaClient, Role, ReportStatus, DayType, ReportType, ScheduleType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getIsoWeek, getWeekDates } from "../src/lib/utils";

function getIsoWeeksInYear(year: number): number {
  const dec28 = new Date(year, 11, 28);
  return getIsoWeek(dec28).week;
}

const prisma = new PrismaClient();

function upsertUser(email: string, name: string, role: Role, passwordHash: string, extra: Record<string, unknown> = {}) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, passwordHash, emailVerified: new Date(), ...extra },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const professions = await Promise.all([
    prisma.trainingProfession.upsert({
      where: { name: "Fachinformatiker für Anwendungsentwicklung" },
      update: {},
      create: { name: "Fachinformatiker für Anwendungsentwicklung" },
    }),
    prisma.trainingProfession.upsert({
      where: { name: "Fachinformatiker für Systemintegration" },
      update: {},
      create: { name: "Fachinformatiker für Systemintegration" },
    }),
    prisma.trainingProfession.upsert({
      where: { name: "Kaufmann/-frau für Versicherungen und Finanzanlagen" },
      update: {},
      create: { name: "Kaufmann/-frau für Versicherungen und Finanzanlagen" },
    }),
  ]);
  const [fiAe, fiSi, kvf] = professions;

  await upsertUser("admin@example.com", "Admin User", Role.admin, passwordHash);

  const trainers = await Promise.all([
    upsertUser("trainer@example.com", "Max Mustermann", Role.trainer, passwordHash),
    upsertUser("trainer2@example.com", "Dr. Katharina Weber", Role.trainer, passwordHash),
    upsertUser("trainer3@example.com", "Stefan Krüger", Role.trainer, passwordHash),
    upsertUser("trainer4@example.com", "Petra Hoffmann", Role.trainer, passwordHash),
  ]);
  const [t1, t2, t3, t4] = trainers;

  const officers = await Promise.all([
    upsertUser("officer@example.com", "Erika Mustermann", Role.training_officer, passwordHash),
    upsertUser("officer2@example.com", "Thomas Schmidt", Role.training_officer, passwordHash),
    upsertUser("officer3@example.com", "Sandra Lehmann", Role.training_officer, passwordHash),
    upsertUser("officer4@example.com", "Jörg Fischer", Role.training_officer, passwordHash),
    upsertUser("officer5@example.com", "Nicole Braun", Role.training_officer, passwordHash),
    upsertUser("officer6@example.com", "Ralf Wagner", Role.training_officer, passwordHash),
    upsertUser("officer7@example.com", "Monika Becker", Role.training_officer, passwordHash),
    upsertUser("officer8@example.com", "Wolfgang Hartmann", Role.training_officer, passwordHash),
    upsertUser("officer9@example.com", "Claudia Zimmermann", Role.training_officer, passwordHash),
    upsertUser("officer10@example.com", "Holger Richter", Role.training_officer, passwordHash),
  ]);
  const [o1, o2, o3, o4, o5, o6, o7, o8, o9, o10] = officers;

  const traineeDefs: { email: string; name: string; professionId: string; start: string }[] = [
    { email: "trainee@example.com", name: "Anna Schulz", professionId: fiAe.id, start: "2026-01-05" },
    { email: "trainee2@example.com", name: "Ben Müller", professionId: fiSi.id, start: "2026-03-01" },
    { email: "trainee3@example.com", name: "Clara Weber", professionId: fiAe.id, start: "2025-08-01" },
    { email: "trainee4@example.com", name: "David Becker", professionId: fiSi.id, start: "2025-08-01" },
    { email: "trainee5@example.com", name: "Emma Fischer", professionId: fiAe.id, start: "2026-01-05" },
    { email: "trainee6@example.com", name: "Felix Wagner", professionId: kvf.id, start: "2025-09-01" },
    { email: "trainee7@example.com", name: "Greta Hoffmann", professionId: kvf.id, start: "2025-09-01" },
    { email: "trainee8@example.com", name: "Hannes Richter", professionId: fiSi.id, start: "2026-01-05" },
    { email: "trainee9@example.com", name: "Ines Lehmann", professionId: fiAe.id, start: "2025-08-01" },
    { email: "trainee10@example.com", name: "Jan Schmidt", professionId: fiSi.id, start: "2026-03-01" },
    { email: "trainee11@example.com", name: "Klara Braun", professionId: kvf.id, start: "2026-01-05" },
    { email: "trainee12@example.com", name: "Lukas Zimmermann", professionId: fiAe.id, start: "2025-08-01" },
    { email: "trainee13@example.com", name: "Mia Hartmann", professionId: fiSi.id, start: "2026-01-05" },
    { email: "trainee14@example.com", name: "Niklas Krüger", professionId: kvf.id, start: "2025-09-01" },
    { email: "trainee15@example.com", name: "Olivia Schneider", professionId: fiAe.id, start: "2026-03-01" },
    { email: "trainee16@example.com", name: "Paul Meier", professionId: fiSi.id, start: "2025-08-01" },
    { email: "trainee17@example.com", name: "Quirin Koch", professionId: kvf.id, start: "2026-01-05" },
    { email: "trainee18@example.com", name: "Rosa Grün", professionId: fiAe.id, start: "2026-03-01" },
    { email: "trainee19@example.com", name: "Samuel Wolf", professionId: fiSi.id, start: "2025-08-01" },
    { email: "trainee20@example.com", name: "Theresa Braun", professionId: kvf.id, start: "2026-01-05" },
    { email: "trainee21@example.com", name: "Uwe Neumann", professionId: fiAe.id, start: "2025-09-01" },
    { email: "trainee22@example.com", name: "Vera Lange", professionId: kvf.id, start: "2026-03-01" },
  ];

  const trainees = await Promise.all(
    traineeDefs.map((d) =>
      upsertUser(d.email, d.name, Role.trainee, passwordHash, {
        professionId: d.professionId,
        trainingStartDate: new Date(d.start),
      })
    )
  );

  for (const trainer of trainers) {
    for (const prof of professions) {
      await prisma.trainerProfessionAssignment.upsert({
        where: {
          trainerId_professionId: { trainerId: trainer.id, professionId: prof.id },
        },
        update: {},
        create: { trainerId: trainer.id, professionId: prof.id },
      });
    }
  }

  for (let i = 0; i < trainees.length; i++) {
    const officer = officers[i % officers.length];
    const trainer = trainers[i % trainers.length];
    const existing = await prisma.traineeOfficerAssignment.findFirst({
      where: { traineeId: trainees[i].id, trainingOfficerId: officer.id },
    });
    if (!existing) {
      await prisma.traineeOfficerAssignment.create({
        data: {
          traineeId: trainees[i].id,
          trainingOfficerId: officer.id,
          assignedById: trainer.id,
          validFrom: new Date("2026-01-01"),
          validUntil: new Date("2026-12-31"),
        },
      });
    }
  }

  await prisma.appSetting.upsert({
    where: { key: "workingDays" },
    update: {},
    create: { key: "workingDays", value: JSON.stringify([1, 2, 3, 4, 5]) },
  });

  const departments = [
    "IT-Entwicklung", "IT-Support", "Netzwerktechnik", "Systemadministration",
    "Qualitätssicherung", "DevOps", "Data Engineering", "Cybersecurity",
    "Schadenabteilung", "Lebensversicherung", "Kundenbetreuung", "Risikomanagement",
    "Anwendungsentwicklung", "Frontend-Team", "Backend-Team", "Mobile-Team",
  ];

  const scheduleTypes = ["department", "school", "vacation", "other"] as const;

  for (let i = 0; i < trainees.length; i++) {
    const existing = await prisma.scheduleAssignment.findFirst({
      where: { traineeId: trainees[i].id },
    });
    if (existing) continue;

    const start = new Date(traineeDefs[i].start);
    const entries: { traineeId: string; scheduleType: ScheduleType; startDate: Date; endDate: Date; department: string | null; supervisorId: string | null; createdBy: string }[] = [];
    let cursor = new Date(start);
    cursor.setDate(cursor.getDate() - cursor.getDay() + 1);

    for (let block = 0; block < 12; block++) {
      const type = scheduleTypes[block % scheduleTypes.length];
      const durationWeeks = type === "vacation" ? 2 : type === "school" ? 2 : 4 + (block % 3);
      const end = new Date(cursor);
      end.setDate(end.getDate() + durationWeeks * 7 - 3);

      if (end > new Date("2026-12-31")) break;

      const assignedOfficer = officers[(i + block) % officers.length];

      entries.push({
        traineeId: trainees[i].id,
        scheduleType: type,
        startDate: new Date(cursor),
        endDate: new Date(end),
        department: type === "department" ? departments[(i + block) % departments.length] : null,
        supervisorId: type === "department" && block % 3 === 0 ? assignedOfficer.id : null,
        createdBy: trainers[i % trainers.length].id,
      });

      cursor = new Date(end);
      cursor.setDate(cursor.getDate() + 3);
    }

    if (entries.length > 0) {
      await prisma.scheduleAssignment.createMany({ data: entries });
    }
  }

  const reportTexts = [
    "Heute habe ich gelernt, dass man Kaffee nicht nur trinken, sondern auch als Debugging-Tool einsetzen kann. Drei Tassen später: Bug gefunden. ☕→🐛→✅",
    "Mein Code kompiliert. Mein Code funktioniert. Ich bin unverwundbar. *Tests starten* ... Ich bin verwundbar. 😭",
    "Heute 8 Stunden versucht einen CSS-Bug zu fixen. Am Ende war es ein fehlendes Semikolon. Ich hasse mein Leben. Aber die Seite sieht jetzt geil aus! ✨",
    "Pair Programming mit dem Ausbilder. Er hat mir gezeigt wie man richtig refactored. Mein Code vorher: Spaghetti. Mein Code nachher: Michelin-Sterne Restaurant. 🍝→⭐",
    "Git merge conflict gelöst. Ich fühle mich wie ein Krieger der einen Drachen besiegt hat. Nächster Konflikt in 3... 2... 1... 🐉⚔️",
    "Stand-up Meeting: 'Und was hast du gestern gemacht?' — Ich: *schweigt in 47 Sprachen* — Nein Spaß, ich hab die API-Endpoint fertiggestellt. 🎯",
    "Heute durfte ich mein erstes eigenes Feature deployen! Production! Live! Echte Nutzer! *Panik* ... Hat funktioniert. Ich bin offiziell Developer. 🚀",
    "Datenbank-Optimierung gelernt. SELECT * FROM tabelle WHERE 1=1 war gestern. Heute: Indexe, Query-Pläne, und eine Ausführungszeit von 0.002ms statt 47s. 📊",
    "Documentation Day! 47 Kommentare im Code hinterlassen. Mein zukünftiges Ich wird dankbar sein. Mein aktuelles Ich ist es definitiv nicht. 📝😤",
    "Heute: React Hooks deep dive. useState, useEffect, useMemo, useCallback — mein Gehirn sieht aus wie ein dependency array. [?, ?, 🧠, ?]",
    "Password-Hashing gelernt. bcrypt ist wie eine Zwiebel — Layer für Layer. Und wie bei einer Zwiebel weint man beim Schneiden. 🧅😢",
    "Erster Tag in der Schadenabteilung: Ein Kunde hat sein Handy in der Pfanne mitgebraten und will Schadensersatz. Versicherungswelt ist wild. 📱🍳",
    "Heute Lebensversicherungsberechnungen gelernt. Sterbetafeln sind morbide aber mathematisch faszinierend. Lebenserwartung berechnet: Ich brauche mehr Kaffee. ☕📈",
    "Kundenbetreuung-Praxis: Einen wütenden Kunden beruhigt. Niveauvoll und professionell. Innere Stimme: AAAAAAAAAAAH. Äußere Stimme: 'Natürlich helfe ich Ihnen gerne!' 😊🔥",
    "Netzwerk-Kabel gezogen. Server down. Kollegen schauen mich an. Ich schaue auf das Kabel. Kabel zurückgesteckt. Server up. Niemand hat was gesehen. 🤫",
    "Firewall-Regeln konfiguriert. Port 80, 443, 8080... Moment, war 8080 jetzt dev oder prod? *ratter* Naja,testen wir mal. Spoiler: Es war prod. 🙈",
    "Docker-Container gebaut. Image-Size: 1.2GB. Ausbilder: 'Das geht kleiner.' 3 Stunden später: 89MB. Ich bin jetzt offiziell Docker-Magier. 🐳✨",
    "TypeScript strict mode aktiviert. 847 Fehler. Nach 6 Stunden: 0 Fehler. Mein Code ist jetzt typesafe und ich bin mental exhausted. 💪😤",
    "Unit Tests geschrieben für meinen Code. 100% Coverage! Test: expect(true).toBe(true). Na gut, vielleicht doch etwas ausführlicher... 🧪",
    "Sprint Review: Mein Feature wird live demonstriert. Cheering vom Team! Ich schaue auf den Code von letzter Woche und schäme mich. Aber hey, es funktioniert! 🎉",
    "Heute Risikomanagement gelernt. Risikomatrix erstellt: Hoch-Wahrscheinlichkeit + Hoher-Schaden = 'Das machen wir nie wieder so'. Gute Lektion. 📋",
    "SQL-Injection gelernt. Bobby Tables heißt der Typ. DROP TABLE students; — Niemals User-Input vertrauen! 🛡️",
    "Agile Scrum Retrospektive: 'Was lief gut?' — Ich hab nicht den Server zerstört. 'Was kann besser?' — Ich sollte aufhören den Server zu zerstören. 📊😅",
    "Heute: Kubernetes introduziert bekommen. Pods, Services, Deployments — mein Gehirn braucht horizontal pod autoscaling. 🧠➡️🧠🧠🧠",
    "Versicherungsverträge analysiert. Kleingedrucktes lesen ist wie Code-Review — man findet die bösen Überraschungen erst bei genauerem Hinsehen. 🔍",
  ];

  const statuses: ReportStatus[] = [
    ReportStatus.approved,
    ReportStatus.submitted,
    ReportStatus.draft,
    ReportStatus.approved,
    ReportStatus.approved,
    ReportStatus.needs_revision,
    ReportStatus.submitted,
    ReportStatus.approved,
    ReportStatus.draft,
    ReportStatus.rejected,
  ];

  for (let i = 0; i < trainees.length; i++) {
    const trainee = trainees[i];
    const startDate = new Date(traineeDefs[i].start);
    const now = new Date();

    const startInfo = getIsoWeek(startDate);
    const currentInfo = getIsoWeek(now);

    let week = startInfo.week;
    let year = startInfo.year;
    let reportCount = 0;
    const maxReports = 4 + (i % 5);

    while ((year < currentInfo.year || (year === currentInfo.year && week <= currentInfo.week)) && reportCount < maxReports) {
      const existingReport = await prisma.weeklyReport.findFirst({
        where: { traineeId: trainee.id, calendarYear: year, calendarWeek: week },
      });
      if (existingReport) {
        week++;
        if (week > getIsoWeeksInYear(year)) { week = 1; year++; }
        continue;
      }

      const weekDays = getWeekDates(year, week);
      const weekStart = weekDays[0];
      const weekEnd = weekDays[6];
      if (weekStart < startDate) {
        week++;
        if (week > getIsoWeeksInYear(year)) { week = 1; year++; }
        continue;
      }

      const status = statuses[reportCount % statuses.length];
      const text = reportTexts[(i * 5 + reportCount) % reportTexts.length];
      const submittedAt = status !== ReportStatus.draft ? new Date(weekStart.getTime() + 4 * 86400000) : null;
      const reviewedAt = status === ReportStatus.approved || status === ReportStatus.rejected ? new Date(weekStart.getTime() + 5 * 86400000) : null;
      const reviewer = trainers[i % trainers.length];

      const report = await prisma.weeklyReport.create({
        data: {
          traineeId: trainee.id,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          calendarYear: year,
          calendarWeek: week,
          reportText: `${text}\n\nKW ${week}/${year} — ${traineeDefs[i].name}`,
          reportType: ReportType.weekly,
          status,
          submittedAt,
          reviewedAt,
          reviewedById: reviewedAt ? reviewer.id : null,
          reviewComment: status === ReportStatus.rejected
            ? "Bitte den Berichtstext überarbeiten und Details zu den Tätigkeiten ergänzen."
            : status === ReportStatus.needs_revision
            ? "Formatierung anpassen und konkrete Beispiele nachreichen."
            : null,
        },
      });

      const days = weekDays;

      const dayTypes: DayType[] = [
        DayType.company, DayType.company, DayType.vocational_school,
        DayType.company, DayType.company, DayType.other, DayType.other,
      ];

      await prisma.dailyEntry.createMany({
        data: days.map((day, d) => ({
          weeklyReportId: report.id,
          date: day,
          dayType: dayTypes[d],
          hours: d < 5 ? 8 : 0,
          minutes: 0,
        })),
      });

      reportCount++;
      week++;
      if (week > getIsoWeeksInYear(year)) { week = 1; year++; }
    }
  }

  console.log("🌱 Seed data created:");
  console.log(`  ${professions.length} Berufe`);
  console.log(`  ${trainers.length} Ausbilder`);
  console.log(`  ${officers.length} Ausbildungsbeauftragte`);
  console.log(`  ${trainees.length} Auszubildende`);
  console.log("");
  console.log("  Login: <role>@example.com / password123");
  console.log("  Azubi-Logins: trainee@example.com bis trainee22@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

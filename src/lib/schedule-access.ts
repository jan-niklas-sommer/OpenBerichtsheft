import { prisma } from "@/lib/prisma";

/**
 * Prüft, ob ein Trainer Zugriff auf einen Auszubildenden hat — analog zur
 * Lese-Berechtigung (Profession-Zuordnung), nicht mehr nur Ersteller-Recht.
 * Liefert true für Admins sowie Trainer, die dem Beruf des Azubis zugeordnet sind.
 */
export async function trainerCanAccessTrainee(
  userId: string,
  role: string,
  traineeId: string,
): Promise<boolean> {
  if (role === "admin") return true;
  if (role !== "trainer") return false;

  const trainee = await prisma.user.findUnique({
    where: { id: traineeId },
    select: { professionId: true },
  });
  if (!trainee?.professionId) return false;

  const assignment = await prisma.trainerProfessionAssignment.findFirst({
    where: { trainerId: userId, professionId: trainee.professionId },
  });
  return !!assignment;
}

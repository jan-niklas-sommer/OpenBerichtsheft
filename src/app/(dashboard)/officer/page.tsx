import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReviewerDashboard } from "@/components/reports/reviewer-dashboard";

export default async function OfficerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "training_officer") redirect("/");

  return (
    <ReviewerDashboard
      userId={session.user.id}
      role="training_officer"
      title="Ausbildungsbeauftragten-Dashboard"
      basePath="/officer"
    />
  );
}

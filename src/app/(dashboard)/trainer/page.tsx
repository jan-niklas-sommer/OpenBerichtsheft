import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReviewerDashboard } from "@/components/reports/reviewer-dashboard";

export default async function TrainerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "trainer") redirect("/");

  return (
    <ReviewerDashboard
      userId={session.user.id}
      role="trainer"
      title="Ausbilder-Dashboard"
      basePath="/trainer"
    />
  );
}

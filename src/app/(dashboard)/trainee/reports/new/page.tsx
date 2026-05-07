import { redirect } from "next/navigation";
import { getCurrentWeek } from "@/lib/utils";

export default function NewReportPage() {
  const { year, week } = getCurrentWeek();
  redirect(`/trainee/reports/${year}-${week}`);
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, UserCheck } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "admin") redirect("/");

  const [userCount, reportCount, assignmentCount] = await Promise.all([
    prisma.user.count({ where: { deactivatedAt: null } }),
    prisma.weeklyReport.count(),
    prisma.trainerProfessionAssignment.count(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-content-base">
        Admin-Dashboard
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users">
          <Card className="transition-colors hover:border-stroke-base">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-content-muted" />
                <CardTitle>Benutzer</CardTitle>
              </div>
            </CardHeader>
            <p className="text-3xl font-semibold text-content-base">
              {userCount}
            </p>
          </Card>
        </Link>

        <Link href="/admin/progress">
          <Card className="transition-colors hover:border-stroke-base">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-content-muted" />
                <CardTitle>Berichte</CardTitle>
              </div>
            </CardHeader>
            <p className="text-3xl font-semibold text-content-base">
              {reportCount}
            </p>
          </Card>
        </Link>

        <Link href="/admin/assignments">
          <Card className="transition-colors hover:border-stroke-base">
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-content-muted" />
                <CardTitle>Zuordnungen</CardTitle>
              </div>
            </CardHeader>
            <p className="text-3xl font-semibold text-content-base">
              {assignmentCount}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

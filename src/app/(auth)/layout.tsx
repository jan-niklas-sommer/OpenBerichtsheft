import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) {
    const role = session.user.role;
    switch (role) {
      case "admin": redirect("/admin");
      case "trainer": redirect("/trainer");
      case "training_officer": redirect("/officer");
      case "trainee": redirect("/trainee");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      {children}
    </div>
  );
}

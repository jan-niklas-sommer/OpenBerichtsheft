import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
    <div className="relative flex min-h-screen items-center justify-center bg-surface-base px-4 py-10">
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}

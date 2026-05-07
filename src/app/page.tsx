import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  switch (role) {
    case "admin":
      redirect("/admin");
    case "trainer":
      redirect("/trainer");
    case "training_officer":
      redirect("/officer");
    case "trainee":
      redirect("/trainee");
    default:
      redirect("/login");
  }
}

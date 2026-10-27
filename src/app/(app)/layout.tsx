import { redirect } from "next/navigation";
import { getUser } from "@/server/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}

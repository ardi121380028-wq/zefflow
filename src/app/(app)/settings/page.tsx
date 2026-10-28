import { redirect } from "next/navigation";
import { getUser, getWorkspaceContext } from "@/server/auth/session";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Pengaturan Workspace" };

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login?reauth=1");

  const ctx = await getWorkspaceContext(user.id);
  const email = ctx.profile?.email || user.email || "";
  const fullName =
    ctx.profile?.fullName ||
    (user.user_metadata?.full_name as string | undefined) ||
    email.split("@")[0] ||
    "Pengguna Zefflow";

  const canRenameWorkspace = ctx.active.role === "owner" || ctx.active.role === "admin";

  return (
    <SettingsClient
      initialName={fullName}
      initialEmail={email}
      initialWorkspaceId={ctx.active.id}
      initialWorkspaceName={ctx.active.name}
      plan={ctx.active.plan}
      canRenameWorkspace={canRenameWorkspace}
    />
  );
}

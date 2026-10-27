import { getWorkspaceContext, requireUser } from "@/server/auth/session";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default async function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const workspaceCtx = await getWorkspaceContext(user.id);

  return (
    <DashboardLayout workspaceCtx={workspaceCtx}>
      {children}
    </DashboardLayout>
  );
}

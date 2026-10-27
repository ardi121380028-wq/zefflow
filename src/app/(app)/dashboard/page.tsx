import { Suspense } from "react";
import { getWorkspaceContext, requireUser } from "@/server/auth/session";
import { listFlows } from "@/features/flows/queries";
import { DashboardView } from "@/features/flows/components/DashboardView";

export default async function DashboardPage() {
  const user = await requireUser();
  const { active } = await getWorkspaceContext(user.id);
  const flows = await listFlows(user.id, active.id);

  return (
    <Suspense fallback={<div className="skeleton h-96 w-full rounded-2xl" />}>
      <DashboardView
        flows={flows}
        workspaceName={active.name}
      />
    </Suspense>
  );
}

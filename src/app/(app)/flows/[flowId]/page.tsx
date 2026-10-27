import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { getFlow } from "@/features/flows/queries";
import { FlowEditorClient } from "@/features/flows/components/FlowEditorClient";

interface FlowPageProps {
  params: { flowId: string };
}

export default async function FlowEditorPage({ params }: FlowPageProps) {
  const user = await requireUser();
  const flow = await getFlow(user.id, params.flowId);

  if (!flow) {
    notFound();
  }

  return (
    <FlowEditorClient
      flowId={flow.id}
      initialTitle={flow.title}
      kind={flow.kind}
      initialShareEnabled={flow.shareEnabled}
      initialShareToken={flow.shareToken}
      initialDocument={flow.doc}
      initialVersion={flow.version}
    />
  );
}

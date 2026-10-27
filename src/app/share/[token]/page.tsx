import { notFound } from "next/navigation";
import { getSharedFlow } from "@/features/flows/queries";
import { PublicFlowView } from "@/features/flows/components/PublicFlowView";

interface PublicSharePageProps {
  params: { token: string };
}

export default async function PublicSharePage({ params }: PublicSharePageProps) {
  const shared = await getSharedFlow(params.token);

  if (!shared) {
    notFound();
  }

  return (
    <PublicFlowView
      flowId={shared.id}
      title={shared.title}
      kind={shared.kind}
      description={shared.description}
      document={shared.doc}
    />
  );
}

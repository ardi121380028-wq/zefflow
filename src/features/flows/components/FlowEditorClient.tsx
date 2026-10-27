"use client";

import * as React from "react";
import type { FlowDocument } from "@/lib/validation/flow";
import { SwimlaneCanvas } from "@/features/canvas/SwimlaneCanvas";
import { FlowEditorHeader } from "./FlowEditorHeader";

interface FlowEditorClientProps {
  flowId: string;
  initialTitle: string;
  kind: "sop" | "journey";
  initialShareEnabled: boolean;
  initialShareToken?: string | null;
  initialDocument: FlowDocument;
  initialVersion: number;
}

export function FlowEditorClient({
  flowId,
  initialTitle,
  kind,
  initialShareEnabled,
  initialShareToken,
  initialDocument,
  initialVersion,
}: FlowEditorClientProps) {
  const [saveNowRef, setSaveNowRef] = React.useState<(() => Promise<void>) | null>(null);

  const handleCanvasReady = React.useCallback(
    (api: { saveNow: () => Promise<void> }) => {
      setSaveNowRef(() => api.saveNow);
    },
    [],
  );

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <FlowEditorHeader
        flowId={flowId}
        initialTitle={initialTitle}
        kind={kind}
        initialShareEnabled={initialShareEnabled}
        initialShareToken={initialShareToken}
        onManualSave={saveNowRef ?? undefined}
      />
      <div className="relative flex-1 overflow-hidden">
        <SwimlaneCanvas
          flowId={flowId}
          initialDocument={initialDocument}
          initialVersion={initialVersion}
          onReady={handleCanvasReady}
        />
      </div>
    </div>
  );
}

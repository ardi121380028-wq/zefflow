"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { publicEnv } from "@/env";
import { createClient } from "@/lib/supabase/client";
import { useCanvasStore } from "./canvas-store";

export interface CollaboratorPresence {
  sessionId: string;
  label: string;
  color: string;
}

const AVATAR_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
];

const MAX_VISIBLE_AVATARS = 3;
const PRESENCE_THROTTLE_MS = 1500;

function isRealtimeAvailable(flowId: string): boolean {
  if (typeof window === "undefined") return false;
  if (!flowId || flowId.startsWith("00000000-0000-4000-8000-")) return false;
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || url.includes("your-project.supabase.co")) return false;
  if (!key || key.includes("default_anon_key_placeholder")) return false;
  return true;
}

/**
 * Kolaborasi Realtime ringan berbasis Supabase Channel (`flow:{flowId}`):
 * 1. Presence ter-throttle (1.5s) dan dibatasi maksimal 3 avatar + total counter (`totalOnline`),
 *    sehingga 1.000+ viewer/editor serentak tetap O(1) di DOM dan bebas lag React.
 * 2. Broadcast versi tersimpan (`flow_saved`) agar rekan satu tim langsung tahu saat ada versi baru
 *    tanpa perlu menabrakkan optimistic lock (`CONFLICT`) terlebih dahulu.
 */
export function useRealtimeFlow(flowId: string, readOnly: boolean) {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [totalOnline, setTotalOnline] = useState(1);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (!isRealtimeAvailable(flowId)) return;

    if (!sessionIdRef.current) {
      sessionIdRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).slice(2, 10);
    }
    const mySessionId = sessionIdRef.current;
    const myColor =
      AVATAR_COLORS[
        Math.abs(mySessionId.charCodeAt(0) + mySessionId.charCodeAt(1)) % AVATAR_COLORS.length
      ]!;
    const myLabel = mySessionId.slice(0, 2).toUpperCase();

    const supabase = createClient();
    const channel = supabase.channel(`flow:${flowId}`, {
      config: {
        presence: { key: mySessionId },
        broadcast: { self: false },
      },
    });

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastSyncAt = 0;

    const flushPresence = () => {
      throttleTimer = null;
      lastSyncAt = Date.now();
      const raw = channel.presenceState<{ sessionId?: string; label?: string; color?: string }>();
      const keys = Object.keys(raw);
      const total = Math.max(1, keys.length);
      const others: CollaboratorPresence[] = [];

      for (let i = 0; i < keys.length && others.length < MAX_VISIBLE_AVATARS; i++) {
        const key = keys[i]!;
        if (key === mySessionId) continue;
        const first = raw[key]?.[0];
        others.push({
          sessionId: key,
          label: first?.label || key.slice(0, 2).toUpperCase(),
          color: first?.color || AVATAR_COLORS[i % AVATAR_COLORS.length]!,
        });
      }

      setTotalOnline((prev) => (prev === total ? prev : total));
      setCollaborators((prev) => {
        if (
          prev.length === others.length &&
          prev.every((p, idx) => p.sessionId === others[idx]?.sessionId)
        ) {
          return prev;
        }
        return others;
      });
    };

    const schedulePresenceSync = () => {
      const elapsed = Date.now() - lastSyncAt;
      if (elapsed >= PRESENCE_THROTTLE_MS) {
        flushPresence();
      } else if (!throttleTimer) {
        throttleTimer = setTimeout(flushPresence, PRESENCE_THROTTLE_MS - elapsed);
      }
    };

    channel
      .on("presence", { event: "sync" }, schedulePresenceSync)
      .on("broadcast", { event: "flow_saved" }, ({ payload }) => {
        const remoteVersion = typeof payload?.version === "number" ? payload.version : null;
        if (!remoteVersion) return;
        const cur = useCanvasStore.getState();
        if (remoteVersion <= cur.version) return;

        if (cur.saveStatus === "dirty" || cur.saveStatus === "saving") {
          toast.warning("Rekan tim baru saja menyimpan perubahan terbaru pada diagram ini.", {
            id: `remote-save-${flowId}`,
            action: { label: "Muat ulang", onClick: () => window.location.reload() },
          });
        } else {
          toast.info("Diagram diperbarui oleh rekan tim.", {
            id: `remote-save-${flowId}`,
            action: { label: "Sinkronkan", onClick: () => window.location.reload() },
          });
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({
            sessionId: mySessionId,
            label: myLabel,
            color: myColor,
            role: readOnly ? "viewer" : "editor",
          });
        }
      });

    const onLocalSaved = (e: Event) => {
      const detail = (e as CustomEvent<{ flowId: string; version: number }>).detail;
      if (!detail || detail.flowId !== flowId) return;
      void channel.send({
        type: "broadcast",
        event: "flow_saved",
        payload: { version: detail.version, sessionId: mySessionId },
      });
    };
    window.addEventListener("zefflow:flow-saved", onLocalSaved);

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      window.removeEventListener("zefflow:flow-saved", onLocalSaved);
      void supabase.removeChannel(channel);
    };
  }, [flowId, readOnly]);

  return { collaborators, totalOnline };
}


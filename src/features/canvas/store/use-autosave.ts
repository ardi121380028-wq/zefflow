"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { saveFlowDocumentAction } from "@/features/flows/actions";
import { useCanvasStore } from "../store/canvas-store";
import { serializeDocument } from "../lib/layout";

const DEBOUNCE_MS = 1500;

/**
 * Autosave: debounce saat `saveStatus === "dirty"`, kirim ke server action,
 * tangani konflik versi & error jaringan, dan peringatkan saat menutup tab dengan perubahan belum tersimpan.
 * Mengembalikan `saveNow` untuk tombol simpan manual / Ctrl+S.
 */
export function useAutosave() {
  // Hanya subscribe ke primitif ringan agar drag/measure 60fps tidak me-render ulang atau me-reset timer tiap frame.
  const status = useCanvasStore((s) => s.saveStatus);
  const mutationTick = useCanvasStore((s) => s.mutationTick);
  const isDragging = useCanvasStore((s) => s.isDragging);
  const inFlight = useRef(false);
  const lastSavedTick = useRef(0);

  const saveNow = useRef(async () => {
    const s = useCanvasStore.getState();
    if (s.readOnly || !s.flowId || inFlight.current || s.saveStatus === "conflict") return;
    const tickAtStart = s.mutationTick;
    inFlight.current = true;
    s.setSaveStatus("saving");
    try {
      const res = await saveFlowDocumentAction({
        flowId: s.flowId,
        document: serializeDocument(s.nodes, s.edges, s.orientation, {
          companyLogo: s.companyLogo,
          companyName: s.companyName,
          docCode: s.docCode,
        }),
        expectedVersion: s.version,
      });
      if (res.ok) {
        lastSavedTick.current = Math.max(lastSavedTick.current, tickAtStart);
        const cur = useCanvasStore.getState();
        // Jika ada mutasi baru selama request berlangsung, biarkan tetap dirty untuk siklus berikutnya
        if (cur.mutationTick > tickAtStart) {
          useCanvasStore.setState({ version: res.data.version, saveStatus: "dirty" });
        } else {
          cur.markSaved(res.data.version);
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("zefflow:flow-saved", {
              detail: { flowId: s.flowId, version: res.data.version },
            }),
          );
        }
      } else if (res.error.code === "CONFLICT") {
        useCanvasStore.getState().setSaveStatus("conflict");
        toast.error(res.error.message, {
          duration: Infinity,
          action: { label: "Muat ulang", onClick: () => window.location.reload() },
        });
      } else {
        useCanvasStore.getState().setSaveStatus("error");
        toast.error(res.error.message);
      }
    } catch {
      // Jaringan putus / server action gagal total
      useCanvasStore.getState().setSaveStatus("error");
      toast.error("Gagal menyimpan — periksa koneksi Anda. Akan dicoba lagi saat ada perubahan.");
    } finally {
      inFlight.current = false;
      // Ada perubahan selama menyimpan -> jadwalkan simpan lagi bila tidak sedang drag.
      const latest = useCanvasStore.getState();
      if (latest.saveStatus === "dirty" && !latest.isDragging) {
        setTimeout(() => void saveNow.current(), DEBOUNCE_MS);
      }
    }
  });

  useEffect(() => {
    if (status !== "dirty" || isDragging) return;
    if (mutationTick <= lastSavedTick.current && mutationTick > 0) return;
    const t = setTimeout(() => void saveNow.current(), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [status, mutationTick, isDragging]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const st = useCanvasStore.getState().saveStatus;
      if (st === "dirty" || st === "saving" || st === "error") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return { saveNow: saveNow.current };
}

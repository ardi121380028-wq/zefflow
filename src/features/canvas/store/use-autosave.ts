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
  const status = useCanvasStore((s) => s.saveStatus);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const inFlight = useRef(false);

  const saveNow = useRef(async () => {
    const s = useCanvasStore.getState();
    if (s.readOnly || !s.flowId || inFlight.current || s.saveStatus === "conflict") return;
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
        useCanvasStore.getState().markSaved(res.data.version);
      } else if (res.error.code === "CONFLICT") {
        useCanvasStore.getState().setSaveStatus("conflict");
        toast.error(res.error.message, { duration: Infinity, action: { label: "Muat ulang", onClick: () => window.location.reload() } });
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
      // Ada perubahan selama menyimpan -> jadwalkan simpan lagi.
      if (useCanvasStore.getState().saveStatus === "dirty") setTimeout(() => void saveNow.current(), DEBOUNCE_MS);
    }
  });

  useEffect(() => {
    if (status !== "dirty") return;
    const t = setTimeout(() => void saveNow.current(), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [status, nodes, edges]);

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

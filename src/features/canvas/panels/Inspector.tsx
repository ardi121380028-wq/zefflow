"use client";

import * as React from "react";
import {
  Trash2,
  X,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { DURATION_UNITS, LANE_COLORS, type LaneData, type StepData } from "@/lib/validation/flow";
import { LANE_STYLES } from "../lib/layout";
import { useCanvasStore } from "../store/canvas-store";
import { isLane, isStep, type AppNode } from "../types";

/**
 * Panel Kanan Studio (Inspector Properti):
 * - Hanya muncul saat sebuah elemen (node langkah, lane divisi, atau edge garis) dipilih.
 * - Menggunakan `useShallow` pada `{ id, type, data }` sehingga drag node 60fps TIDAK memicu re-render form.
 * - Snapshot Undo (`commit`) hanya direkam sekali pada perubahan aktual pertama per seleksi (bukan tiap klik fokus).
 */
export function Inspector() {
  const selectedId = useCanvasStore((s) => s.selectedId);
  const node = useCanvasStore(
    useShallow((s) => {
      if (!s.selectedId) return undefined;
      const found = s.nodes.find((n) => n.id === s.selectedId);
      if (!found) return undefined;
      return { id: found.id, type: found.type, data: found.data } as AppNode;
    }),
  );
  const edge = useCanvasStore(
    useShallow((s) => {
      if (!s.selectedId) return undefined;
      const found = s.edges.find((e) => e.id === s.selectedId);
      if (!found) return undefined;
      return { id: found.id, label: found.label };
    }),
  );
  const readOnly = useCanvasStore((s) => s.readOnly);

  const {
    updateNodeData,
    updateEdgeLabel,
    deleteSelected,
    select,
    commit,
  } = useCanvasStore.getState();

  const [panelDismissed, setPanelDismissed] = React.useState(false);
  const committedForIdRef = React.useRef<string | null>(null);

  // Jika user memilih node/elemen baru, buka kembali panel & reset flag snapshot undo
  React.useEffect(() => {
    committedForIdRef.current = null;
    if (selectedId) setPanelDismissed(false);
  }, [selectedId]);

  if (panelDismissed) return null;
  if (!node && !edge) return null;

  const commitOnce = () => {
    if (selectedId && committedForIdRef.current !== selectedId) {
      committedForIdRef.current = selectedId;
      commit();
    }
  };

  const handleNodeChange = (id: string, patch: Partial<LaneData & StepData>) => {
    commitOnce();
    updateNodeData(id, patch);
  };

  const handleEdgeChange = (id: string, label: string) => {
    commitOnce();
    updateEdgeLabel(id, label);
  };

  return (
    <aside
      aria-label="Detail elemen terpilih"
      className="absolute bottom-2 right-2 top-2 sm:bottom-4 sm:right-4 sm:top-4 z-20 flex w-[310px] sm:w-[340px] max-w-[calc(100vw-1rem)] animate-scale-in flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 dark:border-white/[0.08] bg-white dark:bg-[#0E0F16] text-foreground dark:text-white shadow-2xl"
    >
      {/* Header Inspector */}
      <header className="flex items-center justify-between border-b border-border/70 dark:border-white/[0.08] px-4 py-3 bg-slate-50/80 dark:bg-[#12131D]">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
            {isLane(node)
              ? "JALUR DIVISI (LANE)"
              : edge
              ? "GARIS ALUR KONEKSI"
              : node?.type === "decision"
              ? "KEPUTUSAN (IF/THEN)"
              : node?.type === "terminal"
              ? "TERMINAL (MULAI/SELESAI)"
              : "LANGKAH KERJA SOP"}
          </p>
          <h2 className="font-display text-sm font-bold text-foreground dark:text-white tracking-tight">
            Detail Properti
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setPanelDismissed(true);
            select(null);
          }}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:text-white"
          aria-label="Tutup panel"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Form Editor Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 no-scrollbar">
        {/* Detail Properti Lane */}
        {isLane(node) && (
          <>
            <Field label="Nama Lane">
              <Input
                value={node.data.title}
                maxLength={80}
                disabled={readOnly}
                onChange={(e) => handleNodeChange(node.id, { title: e.target.value })}
              />
            </Field>
            <Field label="Divisi / Departemen">
              <Input
                value={node.data.division}
                maxLength={80}
                placeholder="mis. Divisi Keuangan / Sales"
                disabled={readOnly}
                onChange={(e) => handleNodeChange(node.id, { division: e.target.value })}
              />
            </Field>
            <Field label="Warna Aksen Jalur">
              <div className="flex gap-2 pt-1">
                {LANE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleNodeChange(node.id, { color: c })}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform",
                      LANE_STYLES[c].dot,
                      node.data.color === c && "scale-125 ring-2 ring-primary ring-offset-2",
                    )}
                    aria-label={`Pilih warna ${c}`}
                  />
                ))}
              </div>
            </Field>
          </>
        )}

        {/* Detail Properti Langkah Kerja / Keputusan / Terminal */}
        {isStep(node) && (
          <>
            <Field label="Judul Langkah">
              <Input
                value={node.data.title}
                maxLength={120}
                disabled={readOnly}
                onChange={(e) => handleNodeChange(node.id, { title: e.target.value })}
              />
            </Field>
            <Field label="Deskripsi Prosedur">
              <Textarea
                rows={3}
                value={node.data.description}
                maxLength={2000}
                placeholder="Rincian prosedur operasional..."
                disabled={readOnly}
                onChange={(e) => handleNodeChange(node.id, { description: e.target.value })}
              />
            </Field>
            {node.type !== "terminal" && (
              <>
                <Field label="Durasi Kerja Estimasi">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={10000}
                      value={node.data.durationValue ?? ""}
                      placeholder="0"
                      disabled={readOnly}
                      onChange={(e) =>
                        handleNodeChange(node.id, {
                          durationValue: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                    <Select
                      value={node.data.durationUnit ?? "menit"}
                      disabled={readOnly}
                      onChange={(e) =>
                        handleNodeChange(node.id, {
                          durationUnit: e.target.value as "menit" | "jam" | "hari",
                        })
                      }
                    >
                      {DURATION_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </Select>
                  </div>
                </Field>
                <Field label="Penanggung Jawab (PIC)">
                  <Input
                    value={node.data.owner}
                    maxLength={80}
                    placeholder="mis. Account Exec, Supervisor"
                    disabled={readOnly}
                    onChange={(e) => handleNodeChange(node.id, { owner: e.target.value })}
                  />
                </Field>
                <Field label="Output / Deliverable Dokumen">
                  <Input
                    value={node.data.output}
                    maxLength={200}
                    placeholder="mis. Formulir Tervalidasi, Invoice"
                    disabled={readOnly}
                    onChange={(e) => handleNodeChange(node.id, { output: e.target.value })}
                  />
                </Field>
              </>
            )}
          </>
        )}

        {/* Detail Properti Garis Alur */}
        {edge && (
          <Field label="Label Garis Alur">
            <Input
              value={typeof edge.label === "string" ? edge.label : ""}
              maxLength={60}
              placeholder="mis. Ya / Disetujui / Revisi"
              disabled={readOnly}
              onChange={(e) => handleEdgeChange(edge.id, e.target.value)}
            />
          </Field>
        )}
      </div>

      {/* Footer Inspector */}
      {!readOnly && !isLane(node) && (
        <footer className="border-t border-border/70 dark:border-white/[0.08] p-3 bg-slate-50/50 dark:bg-[#12131D]">
          <Button
            variant="ghost"
            className="w-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 text-xs h-8"
            onClick={() => deleteSelected()}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Hapus {edge ? "koneksi" : "langkah"}
          </Button>
        </footer>
      )}
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-foreground/80 dark:text-zinc-300">{label}</Label>
      {children}
    </div>
  );
}

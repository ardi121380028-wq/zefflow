"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { DURATION_UNITS, LANE_COLORS } from "@/lib/validation/flow";
import { LANE_STYLES } from "../lib/layout";
import { useCanvasStore } from "../store/canvas-store";
import { isLane, isStep } from "../types";

/**
 * Panel kanan: form SOP untuk node terpilih (judul, deskripsi, durasi, output, PIC).
 * Tampilan ElevenLabs Studio Glass, responsif di mobile & adaptif light/dark.
 */
export function Inspector() {
  const selectedId = useCanvasStore((s) => s.selectedId);
  const node = useCanvasStore((s) => s.nodes.find((n) => n.id === selectedId));
  const edge = useCanvasStore((s) => s.edges.find((e) => e.id === selectedId));
  const readOnly = useCanvasStore((s) => s.readOnly);
  const { updateNodeData, updateEdgeLabel, deleteSelected, select, commit } = useCanvasStore.getState();

  if (!node && !edge) return null;
  const onFocus = () => commit();

  return (
    <aside
      aria-label="Detail terpilih"
      className="absolute bottom-2 right-2 top-2 sm:bottom-4 sm:right-4 sm:top-4 z-20 flex w-[350px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] animate-scale-in flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border dark:border-white/[0.08] bg-white/95 dark:bg-[#0E0F16]/95 text-foreground dark:text-white shadow-2xl backdrop-blur-2xl"
    >
      <header className="flex items-center justify-between border-b border-border dark:border-white/[0.08] px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/80 dark:bg-[#12131D]">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
            {isLane(node) ? "LANE / DIVISI" : edge ? "KONEKSI ALUR" : node?.type === "decision" ? "KEPUTUSAN (IF/THEN)" : node?.type === "terminal" ? "TERMINAL" : "LANGKAH SOP"}
          </p>
          <h2 className="font-display text-sm font-bold text-foreground dark:text-white tracking-tight">Detail Properti</h2>
        </div>
        <button
          onClick={() => select(null)}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:text-white"
          aria-label="Tutup panel"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {isLane(node) && (
          <>
            <Field label="Nama Lane">
              <Input value={node.data.title} maxLength={80} disabled={readOnly} onFocus={onFocus} onChange={(e) => updateNodeData(node.id, { title: e.target.value })} />
            </Field>
            <Field label="Divisi / Departemen">
              <Input value={node.data.division} maxLength={80} placeholder="mis. Divisi Keuangan / Sales" disabled={readOnly} onFocus={onFocus} onChange={(e) => updateNodeData(node.id, { division: e.target.value })} />
            </Field>
            <Field label="Warna Aksen Jalur">
              <div className="flex gap-2 pt-1">
                {LANE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={readOnly}
                    aria-label={c}
                    onClick={() => { commit(); updateNodeData(node.id, { color: c }); }}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform hover:scale-110 disabled:opacity-50",
                      LANE_STYLES[c].dot,
                      node.data.color === c && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                  />
                ))}
              </div>
            </Field>
          </>
        )}

        {isStep(node) && (
          <>
            <Field label="Judul Langkah Kerja">
              <Input value={node.data.title} maxLength={120} disabled={readOnly} onFocus={onFocus} onChange={(e) => updateNodeData(node.id, { title: e.target.value })} />
            </Field>
            {node.type !== "terminal" && (
              <>
                <Field label="Deskripsi Tugas (SOP)">
                  <Textarea value={node.data.description} maxLength={2000} rows={4} placeholder="Jelaskan standar prosedur yang harus dijalankan..." disabled={readOnly} onFocus={onFocus} onChange={(e) => updateNodeData(node.id, { description: e.target.value })} />
                </Field>
                <div className="grid grid-cols-[1fr_1fr] gap-3">
                  <Field label="Estimasi Durasi">
                    <Input
                      type="number"
                      min={0}
                      max={100000}
                      value={node.data.durationValue ?? ""}
                      disabled={readOnly}
                      onFocus={onFocus}
                      onChange={(e) => {
                        const v = e.target.value === "" ? null : Math.max(0, Math.min(100000, Number(e.target.value)));
                        updateNodeData(node.id, { durationValue: Number.isFinite(v) ? v : null });
                      }}
                    />
                  </Field>
                  <Field label="Satuan">
                    <Select value={node.data.durationUnit} disabled={readOnly} onChange={(e) => updateNodeData(node.id, { durationUnit: e.target.value as (typeof DURATION_UNITS)[number] })}>
                      {DURATION_UNITS.map((u) => <option key={u} className="bg-card text-foreground">{u}</option>)}
                    </Select>
                  </Field>
                </div>
                <Field label="Output / Deliverables">
                  <Input value={node.data.output} maxLength={500} placeholder="mis. Form PO, Bukti Transfer" disabled={readOnly} onFocus={onFocus} onChange={(e) => updateNodeData(node.id, { output: e.target.value })} />
                </Field>
                <Field label="Penanggung Jawab (PIC)">
                  <Input value={node.data.owner} maxLength={80} placeholder="mis. Staf Purchasing, Finance Officer" disabled={readOnly} onFocus={onFocus} onChange={(e) => updateNodeData(node.id, { owner: e.target.value })} />
                </Field>
              </>
            )}
          </>
        )}

        {edge && (
          <Field label="Label Koneksi Alur">
            <Input value={typeof edge.label === "string" ? edge.label : ""} maxLength={60} placeholder="mis. Ya / Disetujui / Gagal" disabled={readOnly} onFocus={onFocus} onChange={(e) => updateEdgeLabel(edge.id, e.target.value)} />
          </Field>
        )}
      </div>

      {!readOnly && !isLane(node) && (
        <footer className="border-t border-border dark:border-white/[0.08] p-3.5 bg-slate-50/50 dark:bg-[#12131D]">
          <Button variant="ghost" className="w-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 text-xs" onClick={() => deleteSelected()}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Hapus {edge ? "koneksi" : "langkah"}
          </Button>
        </footer>
      )}
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

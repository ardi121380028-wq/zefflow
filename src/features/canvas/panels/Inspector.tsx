"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowRight,
  Building2,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { DURATION_UNITS, LANE_COLORS } from "@/lib/validation/flow";
import { LANE_STYLES } from "../lib/layout";
import { useCanvasStore } from "../store/canvas-store";
import { isLane, isStep } from "../types";

/**
 * Panel Kanan Studio:
 * 1. Menampilkan properti langkah/lane/koneksi saat elemen dipilih.
 * 2. Menampilkan Form Branding & Logo Perusahaan saat tidak ada elemen yang dipilih.
 */
export function Inspector() {
  const selectedId = useCanvasStore((s) => s.selectedId);
  const node = useCanvasStore((s) => s.nodes.find((n) => n.id === selectedId));
  const edge = useCanvasStore((s) => s.edges.find((e) => e.id === selectedId));
  const readOnly = useCanvasStore((s) => s.readOnly);
  const companyLogo = useCanvasStore((s) => s.companyLogo);
  const companyName = useCanvasStore((s) => s.companyName);
  const docCode = useCanvasStore((s) => s.docCode);
  const orientation = useCanvasStore((s) => s.orientation);

  const {
    updateNodeData,
    updateEdgeLabel,
    deleteSelected,
    select,
    commit,
    updateBranding,
    setOrientation,
  } = useCanvasStore.getState();

  const [panelDismissed, setPanelDismissed] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Jika user memilih node baru, buka kembali panel
  React.useEffect(() => {
    if (selectedId) setPanelDismissed(false);
  }, [selectedId]);

  if (panelDismissed) {
    // Tombol kecil untuk membuka kembali branding panel jika sengaja ditutup
    if (!node && !edge && !readOnly) {
      return (
        <button
          type="button"
          onClick={() => setPanelDismissed(false)}
          title="Buka Pengaturan Branding & Logo Perusahaan"
          className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-border dark:border-white/[0.12] bg-white/95 dark:bg-[#0D0E16]/90 px-3 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-2xl transition-all duration-150 hover:bg-muted dark:hover:bg-white/[0.08] active:scale-95 text-foreground"
        >
          <Building2 className="h-3.5 w-3.5 text-violet-500" />
          <span>Branding Logo</span>
        </button>
      );
    }
    return null;
  }

  const onFocus = () => commit();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Harap pilih file gambar (PNG, JPG, SVG).");
      return;
    }

    if (file.size > 850_000) {
      toast.error("Ukuran file terlalu besar. Maksimal 800 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateBranding({ companyLogo: reader.result });
        toast.success("Logo perusahaan berhasil disematkan!");
      }
    };
    reader.readAsDataURL(file);
  };

  // KASUS 1: Tidak ada node/edge terpilih -> Tampilkan Branding & Dokumen Perusahaan
  if (!node && !edge) {
    if (readOnly) return null;

    return (
      <aside
        aria-label="Pengaturan Dokumen & Logo Perusahaan"
        className="absolute bottom-2 right-2 top-2 sm:bottom-4 sm:right-4 sm:top-4 z-20 flex w-[330px] sm:w-[350px] max-w-[calc(100vw-1rem)] animate-scale-in flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border dark:border-white/[0.08] bg-white/95 dark:bg-[#0E0F16]/95 text-foreground dark:text-white shadow-2xl backdrop-blur-2xl"
      >
        <header className="flex items-center justify-between border-b border-border dark:border-white/[0.08] px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/80 dark:bg-[#12131D]">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Building2 className="h-3 w-3" /> IDENTITAS DOKUMEN
            </p>
            <h2 className="font-display text-sm font-bold text-foreground dark:text-white tracking-tight">
              Logo &amp; Info Perusahaan
            </h2>
          </div>
          <button
            onClick={() => setPanelDismissed(true)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:text-white"
            aria-label="Tutup panel"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 no-scrollbar">
          {/* Logo Perusahaan */}
          <div>
            <Label className="text-xs font-semibold">Logo Perusahaan (Kop Dokumen)</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Akan disematkan di pojok kanvas dan header ekspor resmi PDF/PNG.
            </p>

            {companyLogo ? (
              <div className="mt-2.5 rounded-2xl border border-border bg-muted/30 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-20 rounded-xl bg-white dark:bg-black/40 border border-border/80 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={companyLogo}
                      alt="Logo Perusahaan"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">Logo Terpasang</p>
                    <p className="text-[10px] text-muted-foreground font-mono">Siap diekspor</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateBranding({ companyLogo: "" })}
                  className="h-8 px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                  title="Hapus Logo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                  className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-500/[0.03] hover:bg-violet-500/[0.08] p-4 text-center cursor-pointer transition-colors"
                >
                  <Upload className="mx-auto h-5 w-5 text-violet-500" />
                  <p className="mt-1.5 text-xs font-bold text-foreground">Unggah File Logo</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    PNG, JPG, atau SVG (Maks. 800 KB)
                  </p>
                </div>

                <div className="relative">
                  <Input
                    placeholder="Atau tempel URL gambar logo..."
                    value={companyLogo || ""}
                    onChange={(e) => updateBranding({ companyLogo: e.target.value.trim() })}
                    className="text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Nama Perusahaan */}
          <Field label="Nama Perusahaan / Organisasi">
            <Input
              value={companyName || ""}
              maxLength={120}
              placeholder="mis. PT Nusantara Solusi Mandiri"
              onChange={(e) => updateBranding({ companyName: e.target.value })}
              className="text-xs"
            />
          </Field>

          {/* Nomor / Kode SOP */}
          <Field label="Nomor Dokumen / Kode SOP">
            <Input
              value={docCode || ""}
              maxLength={60}
              placeholder="mis. SOP-OPS-001 / Rev 02"
              onChange={(e) => updateBranding({ docCode: e.target.value })}
              className="text-xs font-mono"
            />
          </Field>

          {/* Arah Alur Diagram */}
          <div>
            <Label className="text-xs font-semibold">Orientasi Alur</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrientation("vertical")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all",
                  orientation === "vertical"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <ArrowDown className="h-3.5 w-3.5" />
                <span>Ke Bawah (SOP)</span>
              </button>

              <button
                type="button"
                onClick={() => setOrientation("horizontal")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all",
                  orientation === "horizontal"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Ke Samping</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
            <span>
              Tip: Klik langkah mana pun pada diagram untuk membuka editor properti detailnya.
            </span>
          </div>
        </div>
      </aside>
    );
  }

  // KASUS 2: Ada Node / Edge Terpilih -> Tampilkan Detail Properti Elemen
  return (
    <aside
      aria-label="Detail terpilih"
      className="absolute bottom-2 right-2 top-2 sm:bottom-4 sm:right-4 sm:top-4 z-20 flex w-[330px] sm:w-[350px] max-w-[calc(100vw-1rem)] animate-scale-in flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border dark:border-white/[0.08] bg-white/95 dark:bg-[#0E0F16]/95 text-foreground dark:text-white shadow-2xl backdrop-blur-2xl"
    >
      <header className="flex items-center justify-between border-b border-border dark:border-white/[0.08] px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/80 dark:bg-[#12131D]">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
            {isLane(node)
              ? "LANE / DIVISI"
              : edge
              ? "KONEKSI ALUR"
              : node?.type === "decision"
              ? "KEPUTUSAN (IF/THEN)"
              : node?.type === "terminal"
              ? "TERMINAL"
              : "LANGKAH SOP"}
          </p>
          <h2 className="font-display text-sm font-bold text-foreground dark:text-white tracking-tight">
            Detail Properti
          </h2>
        </div>
        <button
          onClick={() => select(null)}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:text-white"
          aria-label="Tutup panel"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 no-scrollbar">
        {isLane(node) && (
          <>
            <Field label="Nama Lane">
              <Input
                value={node.data.title}
                maxLength={80}
                disabled={readOnly}
                onFocus={onFocus}
                onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
              />
            </Field>
            <Field label="Divisi / Departemen">
              <Input
                value={node.data.division}
                maxLength={80}
                placeholder="mis. Divisi Keuangan / Sales"
                disabled={readOnly}
                onFocus={onFocus}
                onChange={(e) => updateNodeData(node.id, { division: e.target.value })}
              />
            </Field>
            <Field label="Warna Aksen Jalur">
              <div className="flex gap-2 pt-1">
                {LANE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={readOnly}
                    onClick={() => updateNodeData(node.id, { color: c })}
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

        {isStep(node) && (
          <>
            <Field label="Judul Langkah">
              <Input
                value={node.data.title}
                maxLength={120}
                disabled={readOnly}
                onFocus={onFocus}
                onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
              />
            </Field>
            <Field label="Deskripsi Prosedur">
              <Textarea
                rows={3}
                value={node.data.description}
                maxLength={2000}
                placeholder="Rincian prosedur operasional..."
                disabled={readOnly}
                onFocus={onFocus}
                onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
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
                      onFocus={onFocus}
                      onChange={(e) =>
                        updateNodeData(node.id, {
                          durationValue: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                    <Select
                      value={node.data.durationUnit ?? "menit"}
                      disabled={readOnly}
                      onFocus={onFocus}
                      onChange={(e) =>
                        updateNodeData(node.id, {
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
                    onFocus={onFocus}
                    onChange={(e) => updateNodeData(node.id, { owner: e.target.value })}
                  />
                </Field>
                <Field label="Output / Deliverable Dokumen">
                  <Input
                    value={node.data.output}
                    maxLength={200}
                    placeholder="mis. Formulir Tervalidasi, Invoice"
                    disabled={readOnly}
                    onFocus={onFocus}
                    onChange={(e) => updateNodeData(node.id, { output: e.target.value })}
                  />
                </Field>
              </>
            )}
          </>
        )}

        {edge && (
          <Field label="Label Koneksi Alur">
            <Input
              value={typeof edge.label === "string" ? edge.label : ""}
              maxLength={60}
              placeholder="mis. Ya / Disetujui / Gagal"
              disabled={readOnly}
              onFocus={onFocus}
              onChange={(e) => updateEdgeLabel(edge.id, e.target.value)}
            />
          </Field>
        )}
      </div>

      {!readOnly && !isLane(node) && (
        <footer className="border-t border-border dark:border-white/[0.08] p-3.5 bg-slate-50/50 dark:bg-[#12131D]">
          <Button
            variant="ghost"
            className="w-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 text-xs"
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

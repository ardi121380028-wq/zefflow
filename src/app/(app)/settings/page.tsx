"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Globe,
  KeyRound,
  Layers,
  Palette,
  Save,
  Shield,
  Sliders,
  Sparkles,
  User,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";

type SettingsTab = "profile" | "editor" | "standards" | "api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");
  const [saving, setSaving] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState(false);

  // Form states
  const [name, setName] = React.useState("Demo User");
  const [email] = React.useState("demo@zefflow.app");
  const [orgName, setOrgName] = React.useState("Zefflow Studio Team");
  const [defaultDurationUnit, setDefaultDurationUnit] = React.useState("menit");
  const [gridSnap, setGridSnap] = React.useState("8");
  const [autoSaveDelay, setAutoSaveDelay] = React.useState("1200");
  const [exportQuality, setExportQuality] = React.useState("4k");
  const [apiKey] = React.useState("zf_live_9a7f3e82b1c44d65e908f2a178bc");
  const [webhookUrl, setWebhookUrl] = React.useState("https://api.perusahaan.com/webhooks/zefflow");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Pengaturan workspace berhasil diperbarui!");
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    toast.success("API Key disalin ke clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/85 px-4 sm:px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-sm font-bold tracking-tight text-foreground">
              Pengaturan Workspace
            </h1>
            <span className="hidden rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 sm:inline-block">
              PRO TIER
            </span>
          </div>
        </div>

        <Button
          variant="brand"
          size="sm"
          loading={saving}
          onClick={handleSave}
          className="gap-1.5 text-xs font-semibold"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Simpan Perubahan</span>
        </Button>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Banner Hero Mini */}
          <div className="relative overflow-hidden rounded-2xl border border-border dark:border-white/[0.08] bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
                  Identitas Tim & Konfigurasi
                </p>
                <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground">
                  Konfigurasi Standard Operating Procedure (SOP)
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Kelola preferensi kanvas swimlane, standar ekspor grafis, profil divisi, serta kunci API terintegrasi.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
                  <Link href="/api-docs">
                    <Code2 className="h-3.5 w-3.5 text-violet-500" />
                    <span>Lihat Dokumentasi API</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Segmented Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-muted/40 p-1.5">
            <TabButton
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
              icon={<User className="h-3.5 w-3.5" />}
              label="Profil & Organisasi"
            />
            <TabButton
              active={activeTab === "editor"}
              onClick={() => setActiveTab("editor")}
              icon={<Sliders className="h-3.5 w-3.5" />}
              label="Preferensi Editor"
            />
            <TabButton
              active={activeTab === "standards"}
              onClick={() => setActiveTab("standards")}
              icon={<Workflow className="h-3.5 w-3.5" />}
              label="Standar Notasi & Ekspor"
            />
            <TabButton
              active={activeTab === "api"}
              onClick={() => setActiveTab("api")}
              icon={<KeyRound className="h-3.5 w-3.5" />}
              label="Kunci API & Webhooks"
            />
          </div>

          {/* Tab Content: Profile */}
          {activeTab === "profile" && (
            <div className="space-y-6 rounded-2xl border border-border dark:border-white/[0.08] bg-card p-6 shadow-sm">
              <div className="border-b border-border pb-4">
                <h3 className="font-display text-sm font-bold text-foreground">Informasi Akun & Tim</h3>
                <p className="text-xs text-muted-foreground">
                  Data ini digunakan sebagai PIC penanggung jawab dan identitas organisasi pada kop diagram.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nama Lengkap</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Email Akun</Label>
                  <Input value={email} disabled className="opacity-70 cursor-not-allowed" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Nama Organisasi / Perusahaan</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Editor Preferences */}
          {activeTab === "editor" && (
            <div className="space-y-6 rounded-2xl border border-border dark:border-white/[0.08] bg-card p-6 shadow-sm">
              <div className="border-b border-border pb-4">
                <h3 className="font-display text-sm font-bold text-foreground">Perilaku & Geometri Kanvas</h3>
                <p className="text-xs text-muted-foreground">
                  Atur kenyamanan drag-and-drop, magnetis alur koneksi, serta interval penyimpanan otomatis.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Snap to Grid (Pixel)</Label>
                  <select
                    value={gridSnap}
                    onChange={(e) => setGridSnap(e.target.value)}
                    className="h-9 w-full rounded-xl border border-input dark:border-white/[0.08] bg-surface-raised/70 dark:bg-zinc-900/90 px-3.5 text-xs text-foreground dark:text-zinc-100 shadow-sm"
                  >
                    <option value="8">8px (Presisi Tinggi - Standar Studio)</option>
                    <option value="16">16px (Grid Longgar)</option>
                    <option value="24">24px (Grid Renggang)</option>
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Menyelaraskan langkah kerja otomatis saat digeser.
                  </p>
                </div>

                <div>
                  <Label>Autosave Delay (Milidetik)</Label>
                  <select
                    value={autoSaveDelay}
                    onChange={(e) => setAutoSaveDelay(e.target.value)}
                    className="h-9 w-full rounded-xl border border-input dark:border-white/[0.08] bg-surface-raised/70 dark:bg-zinc-900/90 px-3.5 text-xs text-foreground dark:text-zinc-100 shadow-sm"
                  >
                    <option value="800">800 ms (Super Cepat)</option>
                    <option value="1200">1200 ms (Direkomendasikan)</option>
                    <option value="2500">2500 ms (Jeda Panjang)</option>
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Waktu tunda sebelum perubahan disimpan ke cloud secara otomatis.
                  </p>
                </div>

                <div>
                  <Label>Default Satuan Durasi Waktu</Label>
                  <select
                    value={defaultDurationUnit}
                    onChange={(e) => setDefaultDurationUnit(e.target.value)}
                    className="h-9 w-full rounded-xl border border-input dark:border-white/[0.08] bg-surface-raised/70 dark:bg-zinc-900/90 px-3.5 text-xs text-foreground dark:text-zinc-100 shadow-sm"
                  >
                    <option value="menit">Menit (Prosedur Operasional Cepat)</option>
                    <option value="jam">Jam (Tugas Harian)</option>
                    <option value="hari">Hari (Siklus Project / SLA)</option>
                  </select>
                </div>

                <div>
                  <Label>Auto-Connect on Shape Drop</Label>
                  <div className="flex h-9 items-center justify-between rounded-xl border border-border px-3.5 bg-muted/30">
                    <span className="text-xs font-medium text-foreground">Sensitivitas 48px Magnetik</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Aktif
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Menghubungkan garis otomatis begitu pointer menyentuh badan shape target.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Standards & Export */}
          {activeTab === "standards" && (
            <div className="space-y-6 rounded-2xl border border-border dark:border-white/[0.08] bg-card p-6 shadow-sm">
              <div className="border-b border-border pb-4">
                <h3 className="font-display text-sm font-bold text-foreground">Standar Mutu Prosedur & Ekspor</h3>
                <p className="text-xs text-muted-foreground">
                  Kepatuhan notasi terhadap standar BPMN 2.0 dan ISO 9001:2015 Quality Management Systems.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Kualitas Ekspor Gambar PNG</Label>
                  <select
                    value={exportQuality}
                    onChange={(e) => setExportQuality(e.target.value)}
                    className="h-9 w-full rounded-xl border border-input dark:border-white/[0.08] bg-surface-raised/70 dark:bg-zinc-900/90 px-3.5 text-xs text-foreground dark:text-zinc-100 shadow-sm"
                  >
                    <option value="4k">Ultra-HD 4K (Pixel Ratio 3.0x - Tajam Maksimal)</option>
                    <option value="2k">Full-HD 2K (Pixel Ratio 2.0x - Ringan)</option>
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Memastikan teks dan garis diagram tetap jernih saat dicetak di banner atau laporan rapat.
                  </p>
                </div>

                <div>
                  <Label>Format PDF Standar</Label>
                  <div className="flex h-9 items-center justify-between rounded-xl border border-border px-3.5 bg-muted/30">
                    <span className="text-xs font-medium text-foreground">Vector-Grade Landscape</span>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                      Anti-Pelangi
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Direncanakan dengan flattening offscreen kanvas 2D untuk mencegah glitch warna jsPDF.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: API & Webhooks */}
          {activeTab === "api" && (
            <div className="space-y-6 rounded-2xl border border-border dark:border-white/[0.08] bg-card p-6 shadow-sm">
              <div className="border-b border-border pb-4">
                <h3 className="font-display text-sm font-bold text-foreground">Kredensial API & Webhook Perusahaan</h3>
                <p className="text-xs text-muted-foreground">
                  Gunakan API Key ini untuk membuat atau memperbarui diagram dari sistem backend internal (ERP, CRM, Jira).
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Live Personal Access Token (Bearer Key)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={apiKey}
                      readOnly
                      className="font-mono text-xs tracking-wider"
                    />
                    <Button variant="secondary" onClick={copyApiKey} className="gap-1.5 shrink-0 text-xs">
                      {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedKey ? "Tersalin" : "Salin Kunci"}</span>
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Jangan bagikan token ini. Gunakan header <code>Authorization: Bearer &lt;TOKEN&gt;</code> pada setiap request.
                  </p>
                </div>

                <div>
                  <Label>Webhook Endpoint URL</Label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://perusahaan.com/api/zefflow-events"
                    className="font-mono text-xs"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Event yang dikirim: <code>flow.created</code>, <code>flow.updated</code>, <code>sop.published</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 ${
        active
          ? "bg-card text-foreground shadow-sm border border-border"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  Globe2,
  KeyRound,
  Layers,
  Send,
  ShieldCheck,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Language = "curl" | "typescript" | "python";

export default function ApiDocsPage() {
  const [lang, setLang] = React.useState<Language>("curl");
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    toast.success("Snippet kode berhasil disalin!");
    setTimeout(() => setCopiedSection(null), 2000);
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
              Dokumentasi REST API
            </h1>
            <span className="hidden rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 sm:inline-block">
              V1.0 STABLE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
            <Link href="/settings">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span>Ambil API Key</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-border dark:border-white/[0.08] bg-card p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <Terminal className="h-4 w-4" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                Industrial Integration Standard
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Zefflow REST API Reference
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Integrasikan generator diagram SOP dan Customer Journey langsung ke dalam pipeline ERP internal, CRM, sistem ticketing, atau script CI/CD organisasi Anda.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-mono">
                <Globe2 className="h-3.5 w-3.5 text-violet-500" />
                <span>Base URL:</span>
                <strong className="text-foreground">https://api.zefflow.app/v1</strong>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Format:</span>
                <strong className="text-foreground">JSON + Bearer Token</strong>
              </div>
            </div>
          </div>

          {/* Language Switcher Bar */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide font-mono">
              Pilih Contoh Bahasa Pemrograman:
            </p>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
              <LangButton active={lang === "curl"} onClick={() => setLang("curl")} label="cURL" />
              <LangButton active={lang === "typescript"} onClick={() => setLang("typescript")} label="TypeScript / Node" />
              <LangButton active={lang === "python"} onClick={() => setLang("python")} label="Python" />
            </div>
          </div>

          {/* Section 1: Autentikasi */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono text-xs font-bold">
                1
              </span>
              <h3 className="font-display text-base font-bold text-foreground">Autentikasi (Bearer Token)</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Semua permintaan HTTP ke API Zefflow harus menyertakan header <code>Authorization: Bearer &lt;YOUR_API_KEY&gt;</code>. Kunci dapat dibuat di menu <Link href="/settings" className="text-primary underline">Pengaturan Workspace</Link>.
            </p>

            <CodeSnippet
              id="auth"
              lang={lang}
              code={
                lang === "curl"
                  ? `curl -X GET "https://api.zefflow.app/v1/flows" \\
  -H "Authorization: Bearer zf_live_9a7f3e82b1c44d65e908f2a178bc" \\
  -H "Content-Type: application/json"`
                  : lang === "typescript"
                  ? `import axios from "axios";

const client = axios.create({
  baseURL: "https://api.zefflow.app/v1",
  headers: {
    Authorization: \`Bearer \${process.env.ZEFFLOW_API_KEY}\`,
    "Content-Type": "application/json",
  },
});`
                  : `import requests
import os

headers = {
    "Authorization": f"Bearer {os.getenv('ZEFFLOW_API_KEY')}",
    "Content-Type": "application/json"
}
response = requests.get("https://api.zefflow.app/v1/flows", headers=headers)`
              }
              onCopy={copyCode}
              copiedSection={copiedSection}
            />
          </section>

          {/* Section 2: Buat Diagram Baru */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                2
              </span>
              <h3 className="font-display text-base font-bold text-foreground">
                POST /v1/flows — Buat Diagram & Langkah SOP Baru
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Membuat dokumen alur kerja swimlane secara otomatis dengan definisi lane divisi, langkah kerja, SLA waktu tugas, dan koneksi alur.
            </p>

            <CodeSnippet
              id="create"
              lang={lang}
              code={
                lang === "curl"
                  ? `curl -X POST "https://api.zefflow.app/v1/flows" \\
  -H "Authorization: Bearer zf_live_9a7f3e82b1c44d65e908f2a178bc" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "SOP Pengadaan Barang & Logistik",
    "kind": "sop",
    "document": {
      "version": 1,
      "lanes": [
        { "id": "lane-1", "title": "Customer / User", "division": "Internal Staff", "color": "violet" },
        { "id": "lane-2", "title": "Procurement", "division": "Purchasing Div", "color": "sky" },
        { "id": "lane-3", "title": "Finance", "division": "Finance & Tax", "color": "emerald" }
      ],
      "steps": [
        { "id": "s-1", "laneId": "lane-1", "type": "step", "title": "Buat Form PR", "durationValue": 30, "durationUnit": "menit", "owner": "Staff Pemohon" },
        { "id": "s-2", "laneId": "lane-2", "type": "decision", "title": "Budget Disetujui?" },
        { "id": "s-3", "laneId": "lane-3", "type": "step", "title": "Rilis Purchase Order (PO)", "durationValue": 2, "durationUnit": "jam", "output": "Dokumen PO" }
      ],
      "connections": [
        { "id": "c-1", "source": "s-1", "target": "s-2" },
        { "id": "c-2", "source": "s-2", "target": "s-3", "label": "Ya" }
      ]
    }
  }'`
                  : lang === "typescript"
                  ? `const newFlow = await client.post("/flows", {
  title: "SOP Pengadaan Barang & Logistik",
  kind: "sop",
  document: {
    version: 1,
    lanes: [
      { id: "lane-1", title: "Customer / User", division: "Internal Staff", color: "violet" },
      { id: "lane-2", title: "Procurement", division: "Purchasing Div", color: "sky" }
    ],
    steps: [
      { id: "s-1", laneId: "lane-1", type: "step", title: "Buat Form PR", durationValue: 30, durationUnit: "menit", owner: "Staff" }
    ],
    connections: []
  }
});
console.log("Flow ID:", newFlow.data.id);`
                  : `payload = {
    "title": "SOP Pengadaan Barang & Logistik",
    "kind": "sop",
    "document": {
        "version": 1,
        "lanes": [{"id": "lane-1", "title": "Procurement", "division": "Purchasing", "color": "sky"}],
        "steps": [{"id": "s-1", "laneId": "lane-1", "type": "step", "title": "Verifikasi PO"}],
        "connections": []
    }
}
res = requests.post("https://api.zefflow.app/v1/flows", json=payload, headers=headers)
print("Result:", res.json())`
              }
              onCopy={copyCode}
              copiedSection={copiedSection}
            />

            {/* Response Preview */}
            <div className="rounded-xl border border-border dark:border-white/[0.08] bg-muted/30 p-4">
              <p className="text-[11px] font-mono font-bold uppercase text-muted-foreground mb-2">
                Contoh Respon 201 Created (JSON)
              </p>
              <pre className="overflow-x-auto text-xs font-mono text-emerald-600 dark:text-emerald-400">
{`{
  "status": "success",
  "id": "flow-x9842a",
  "title": "SOP Pengadaan Barang & Logistik",
  "version": 1,
  "shareUrl": "https://zefflow.app/share/tok_89a4fe",
  "createdAt": "2026-10-27T14:00:00Z"
}`}
              </pre>
            </div>
          </section>

          {/* Section 3: Headless Export API */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold">
                3
              </span>
              <h3 className="font-display text-base font-bold text-foreground">
                POST /v1/flows/:id/export — Ekspor Grafis Otomatis (Headless)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Menghasilkan file gambar PNG resolusi 4K tajam atau PDF vektor siap cetak secara headless untuk dilampirkan pada sistem otomatisasi dokumen.
            </p>

            <CodeSnippet
              id="export"
              lang={lang}
              code={
                lang === "curl"
                  ? `curl -X POST "https://api.zefflow.app/v1/flows/flow-x9842a/export" \\
  -H "Authorization: Bearer zf_live_9a7f3e82b1c44d65e908f2a178bc" \\
  -H "Content-Type: application/json" \\
  -d '{ "format": "png", "theme": "dark", "quality": "4k" }' \\
  --output diagram-sop.png`
                  : lang === "typescript"
                  ? `const fileResponse = await client.post(
  "/flows/flow-x9842a/export",
  { format: "pdf", theme: "light" },
  { responseType: "arraybuffer" }
);
// Simpan buffer ke filesystem atau kirim via email/S3`
                  : `res = requests.post(
    "https://api.zefflow.app/v1/flows/flow-x9842a/export",
    json={"format": "png", "theme": "dark"},
    headers=headers
)
with open("sop-diagram.png", "wb") as f:
    f.write(res.content)`
              }
              onCopy={copyCode}
              copiedSection={copiedSection}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function LangButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
        active
          ? "bg-card text-foreground shadow-sm border border-border"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function CodeSnippet({
  id,
  code,
  lang,
  onCopy,
  copiedSection,
}: {
  id: string;
  code: string;
  lang: string;
  onCopy: (code: string, id: string) => void;
  copiedSection: string | null;
}) {
  const isCopied = copiedSection === id;
  return (
    <div className="relative rounded-xl border border-border dark:border-white/[0.08] bg-[#0A0B10] p-4 text-zinc-100 shadow-sm">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-[10px] font-mono text-zinc-400 uppercase">
        <span>{lang}</span>
        <button
          type="button"
          onClick={() => onCopy(code, id)}
          className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{isCopied ? "Tersalin" : "Salin"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto text-xs font-mono leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

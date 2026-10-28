import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Columns3,
  Download,
  FileCheck2,
  GitBranch,
  Layers,
  LayoutGrid,
  Maximize2,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata = {
  title: "Fitur Unggulan — Zefflow Swimlane & SOP Studio",
  description:
    "Eksplorasi lengkap fitur visualisasi SOP bisnis, swimlane vertikal & horizontal, smart routing, auto-tidy, dan ekspor PDF resmi standar ISO 9001.",
};

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground transition-colors duration-200">
      {/* Background radial glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-violet-600/10 dark:bg-violet-600/20 blur-[130px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 mx-auto flex h-16 max-w-7xl items-center justify-between border-b border-border/80 bg-background/80 px-4 sm:px-6 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-600 to-fuchsia-600 shadow-[0_0_18px_rgba(139,92,246,0.4)] transition-transform group-hover:scale-105">
            <Workflow className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight text-foreground">
            Zefflow
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <Link href="/features" className="text-foreground font-semibold">Fitur Unggulan</Link>
          <Link href="/guide" className="hover:text-foreground transition-colors">Panduan Aplikasi</Link>
          <Link href="/#pricing" className="hover:text-foreground transition-colors">Paket &amp; Harga</Link>
          <Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button variant="brand" size="sm" asChild className="text-xs font-semibold px-3 h-8 sm:h-9">
            <Link href="/login">
              <span>Buka Studio</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1 hidden xs:inline" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs text-muted-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
            Fitur Kelas Dunia untuk SOP &amp; Swimlane
          </span>
        </div>

        <h1 className="mt-6 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.18]">
          Semua yang Anda Butuhkan untuk <br className="hidden sm:inline" />
          <span className="text-gradient">Memetakan Alur Kerja Organisasi</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          Dari pembuatan diagram alur vertikal ke bawah, struktur lapisan ala Figma, hingga ekspor dokumen resmi siap cetak berlogo perusahaan.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="brand" size="lg" asChild className="text-xs sm:text-sm font-semibold">
            <Link href="/login">
              <span>Coba Demo Interaktif Sekarang</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="text-xs sm:text-sm">
            <Link href="/guide">Baca Panduan Penggunaan</Link>
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<ArrowDown className="h-5 w-5 text-violet-500" />}
            title="Alur Vertikal (Ke Bawah) &amp; Horizontal"
            badge="Terbaru"
            desc="Dukungan penuh dua mode alur: vertikal menurun (seperti SOP modern standar industri) atau horizontal menyamping. Beralih arah kapan saja tanpa merusak data diagram."
          />

          <FeatureCard
            icon={<Layers className="h-5 w-5 text-sky-500" />}
            title="Panel Layers &amp; Struktur Alur (Figma Style)"
            badge="Favorit"
            desc="Sidebar kiri untuk menjelajahi seluruh hirarki diagram per divisi. Klik layer untuk langsung meluncurkan kamera (smooth pan &amp; zoom) ke langkah yang dipilih."
          />

          <FeatureCard
            icon={<Sparkles className="h-5 w-5 text-amber-500" />}
            title="Tombol 'Rapikan' Otomatis (Auto-Tidy)"
            badge="Instan"
            desc="Satu klik untuk menata ulang baris yang berantakan. Menggunakan algoritma height-aware row packing agar jarak diagram rapat, presisi, dan tidak bolong-bolong."
          />

          <FeatureCard
            icon={<Download className="h-5 w-5 text-emerald-500" />}
            title="Ekspor Resolusi Retina 4K (PNG &amp; PDF)"
            badge="Anti-Pecah"
            desc="Ekspor diagram ke gambar ultra-tajam dengan header resmi dokumen. Dilengkapi teknologi solid-flattening anti-pelangi pada PDF dokumen ISO."
          />

          <FeatureCard
            icon={<Paintbrush className="h-5 w-5 text-rose-500" />}
            title="Branding Logo &amp; Kode Dokumen Perusahaan"
            badge="Corporate"
            desc="Sematkan logo resmi perusahaan dan kode nomor SOP di sudut diagram. Otomatis tercetak di lembar ekspor PDF resmi perusahaan Anda."
          />

          <FeatureCard
            icon={<FileCheck2 className="h-5 w-5 text-indigo-500" />}
            title="Kalkulasi Durasi &amp; Checklist PIC Otomatis"
            badge="Audit SOP"
            desc="Menghitung total estimasi siklus kerja proses (menit, jam, hari kerja) dan mendeteksi langkah yang belum memiliki PIC/output dokumen."
          />

          <FeatureCard
            icon={<GitBranch className="h-5 w-5 text-amber-500" />}
            title="Titik Keputusan (True Diamond BPMN)"
            desc="Belah ketupat sejati adaptif light/dark dengan penempatan label 'Ya' / 'Tidak' otomatis di garis panah tanpa merusak tata letak visual."
          />

          <FeatureCard
            icon={<LayoutGrid className="h-5 w-5 text-violet-500" />}
            title="Floating Command Bar di Bawah Tengah"
            desc="Toolbar alat melayang di bawah tengah layar layaknya Figma/Linear. Bebas dari menutupi judul divisi dan mudah dijangkau."
          />

          <FeatureCard
            icon={<Zap className="h-5 w-5 text-cyan-500" />}
            title="Mode Demo Instan Tanpa Setup DB"
            desc="Langsung coba membuat dan mengedit swimlane di browser tanpa perlu akun Supabase/PostgreSQL atau kartu kredit."
          />
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-16">
        <div className="rounded-3xl border border-border bg-card/60 p-6 sm:p-10 backdrop-blur-xl">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-center text-foreground">
            Mengapa Zefflow Berbeda dari Tool Diagram Biasa?
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="rounded-2xl border border-border/80 bg-background/50 p-5 space-y-3">
              <p className="font-bold text-rose-500 uppercase tracking-wider text-[11px] font-mono">
                Tool Diagram Manual (Miro / Lucidchart)
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">✕ Menata kotak swimlane manual satu per satu memakan waktu berjam-jam</li>
                <li className="flex items-start gap-2">✕ Alur sering berantakan dan jarak antar langkah tidak konsisten</li>
                <li className="flex items-start gap-2">✕ Tidak ada audit kelengkapan SOP (siapa PIC, berapa lama durasinya)</li>
                <li className="flex items-start gap-2">✕ Garis panah sering kusut dan terpotong saat diekspor</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-5 space-y-3">
              <p className="font-bold text-primary uppercase tracking-wider text-[11px] font-mono">
                Zefflow Studio (Didesain Khusus untuk SOP)
              </p>
              <ul className="space-y-2 text-foreground">
                <li className="flex items-start gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Struktur divisi otomatis rapi dengan konsep Lane &amp; Step terintegrasi</li>
                <li className="flex items-start gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Tombol "Rapikan" sekali klik merapikan seluruh alur seketika</li>
                <li className="flex items-start gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Kalkulator SLA &amp; durasi total proses otomatis dihitung</li>
                <li className="flex items-start gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Ekspor dokumen resmi beresolusi 4K dengan logo perusahaan Anda</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card/40 py-10 text-center text-xs text-muted-foreground">
        <p>© 2026 Zefflow Studio. Dibuat khusus untuk efisiensi SOP bisnis dan operasional Indonesia.</p>
        <div className="mt-3 flex justify-center gap-4">
          <Link href="/" className="hover:text-foreground">Beranda</Link>
          <Link href="/guide" className="hover:text-foreground">Panduan Aplikasi</Link>
          <Link href="/login" className="hover:text-foreground">Masuk Studio</Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  badge,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  desc: string;
}) {
  return (
    <div className="group rounded-3xl border border-border bg-card/80 p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/80 dark:bg-white/[0.05] group-hover:scale-105 transition-transform">
          {icon}
        </div>
        {badge && (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-base font-bold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

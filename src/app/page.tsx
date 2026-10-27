import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  FileOutput,
  GitBranch,
  Github,
  Instagram,
  Layers,
  Linkedin,
  Lock,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Twitter,
  User2,
  Users2,
  Workflow,
  Youtube,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getUser } from "@/server/auth/session";
import { InteractiveFlowShowcase } from "@/features/landing/InteractiveFlowShowcase";
import { PricingSection } from "@/features/landing/PricingSection";
import { FaqSection } from "@/features/landing/FaqSection";

export default async function HomePage() {
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground selection:bg-violet-600/30 selection:text-white transition-colors duration-200">
      {/* Background ambient radial spotlight glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[900px] rounded-full bg-gradient-to-b from-violet-600/12 via-indigo-600/8 to-transparent blur-[140px] dark:from-violet-600/20 dark:via-indigo-600/15" />
      <div className="pointer-events-none absolute top-[700px] -right-40 h-[450px] w-[550px] rounded-full bg-violet-600/10 blur-[150px]" />

      {/* Floating Studio Header */}
      <header className="sticky top-0 z-50 mx-auto flex h-16 max-w-7xl items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-600 to-fuchsia-600 shadow-[0_0_18px_rgba(139,92,246,0.4)] transition-transform group-hover:scale-105">
            <Workflow className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-semibold tracking-tight text-foreground">
              Zefflow
            </span>
            <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.2 text-[9px] font-mono font-semibold tracking-widest text-violet-600 dark:text-violet-400">
              STUDIO
            </span>
          </div>
        </Link>

        {/* Center links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <a href="#canvas-showcase" className="hover:text-foreground transition-colors">Kanvas Interaktif</a>
          <a href="#features" className="hover:text-foreground transition-colors">Fitur SOP</a>
          <a href="#pricing" className="hover:text-foreground transition-colors font-semibold text-primary">Paket &amp; Harga</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button variant="brand" size="sm" asChild className="text-xs font-semibold">
            <Link href="/login">
              <span>Mulai Gratis</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-16 sm:pt-20 pb-28 text-center">
        {/* Modern Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs text-muted-foreground shadow-sm dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6] animate-pulse" />
          <span className="font-mono text-[11px] font-medium tracking-wide">
            GENERATOR SOP &amp; SWIMLANE MULTI-DIVISI
          </span>
        </div>

        {/* Main Headline - Sleek font-semibold weight, high contrast gradient */}
        <h1 className="mt-6 font-display text-3xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] text-foreground leading-[1.18]">
          Rancang SOP Bisnis &amp; <br className="hidden sm:inline" />
          <span className="text-gradient font-semibold">Customer Journey Lintas Divisi</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
          Platform kanvas visual modern untuk memetakan alur kerja organisasi Anda.
          Tetapkan tanggung jawab departemen, waktu siklus SLA, dan deliverables tugas dalam format standar industri siap ekspor.
        </p>

        {/* Action Buttons with Glossy Glowing AI Styling */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Button variant="brand" size="lg" asChild className="gap-2 font-semibold text-xs sm:text-sm">
            <Link href="/login">
              <Sparkles className="h-4 w-4 mr-1 text-white" />
              <span>Mulai Mode Demo Instan</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button variant="secondary" size="lg" asChild className="text-xs sm:text-sm font-semibold">
            <a href="#pricing">
              <Zap className="h-4 w-4 text-violet-500 mr-2" />
              <span>Lihat Paket Harga (Mulai Rp 0)</span>
            </a>
          </Button>
        </div>

        {/* Interactive Live Canvas Studio Showcase */}
        <div id="canvas-showcase" className="mt-14 sm:mt-16 text-left">
          <InteractiveFlowShowcase />
        </div>

        {/* Feature Grid: Studio Quality */}
        <div id="features" className="mt-28 text-left">
          <div className="flex flex-col items-center text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold">
              Fitur Arsitektur Studio
            </span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Dibangun untuk Standarisasi Operasional Perusahaan
            </h2>
            <p className="mt-2 max-w-xl text-xs sm:text-sm text-muted-foreground">
              Kombinasi diagram visual interaktif dan parameter SOP baku untuk mempermudah audit ISO dan transparansi antar departemen.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm transition-all hover:border-violet-500/40 hover:shadow-md">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                <Layers className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-3.5 font-display text-sm font-semibold text-foreground">
                Swimlane Multi-Divisi
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Tiap divisi memiliki jalur (lane) tersendiri dengan bar aksen warna solid asli tanpa pudar.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm transition-all hover:border-sky-500/40 hover:shadow-md">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <FileCheck2 className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-3.5 font-display text-sm font-semibold text-foreground">
                Spesifikasi SOP Detail
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Lengkap dengan durasi SLA, output deliverables yang diharapkan, serta person-in-charge (PIC).
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Share2 className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-3.5 font-display text-sm font-semibold text-foreground">
                Ekspor PDF &amp; PNG 4K
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Ekspor satu klik ke PDF vector atau PNG tajam tanpa glitch kotak hitam. Tautan publik view-only siap pakai.
              </p>
            </div>

            <div id="security" className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-3.5 font-display text-sm font-semibold text-foreground">
                PostgreSQL RLS Terisolasi
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Keamanan tingkat basis data dengan Row Level Security. Data alur operasional tiap workspace terisolasi secara mutlak.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Section (Affordable Indonesia) */}
        <PricingSection />

        {/* FAQ Section */}
        <FaqSection />

        {/* Bottom CTA Banner */}
        <div className="mt-28 rounded-3xl border border-border/80 bg-card/70 dark:bg-gradient-to-r dark:from-[#12131C] dark:via-[#0F1017] dark:to-[#171324] p-8 md:p-12 text-center shadow-lg dark:shadow-[0_16px_50px_rgba(0,0,0,0.8)]">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Siap Menstandarisasi Alur Operasional Bisnis Anda?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-muted-foreground">
            Gunakan mode demo Zefflow sekarang juga untuk langsung merancang diagram swimlane pertama Anda tanpa biaya.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="brand" size="lg" asChild className="gap-2 font-semibold">
              <Link href="/login">
                <span>Buka Dashboard Zefflow</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Modern Studio 4-Column Footer with Social Media */}
      <footer className="border-t border-border bg-card/60 pt-16 pb-12 text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-indigo-600 to-fuchsia-600 shadow-md">
                  <Workflow className="h-4 w-4 text-white" />
                </div>
                <span className="font-display text-base font-bold text-foreground">
                  Zefflow
                </span>
                <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-widest text-violet-600 dark:text-violet-400">
                  STUDIO
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                Platform visualisasi diagram swimlane dan standarisasi SOP multi-divisi modern. Didesain untuk memperjelas alur kerja tim dan bisnis di Indonesia.
              </p>
              {/* Social Media Icons */}
              <div className="flex items-center gap-2.5 pt-2">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter X"
                  className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Col 2: Produk */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Produk</p>
              <ul className="space-y-2 text-xs">
                <li><a href="#canvas-showcase" className="hover:text-foreground transition-colors">Kanvas Swimlane</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Notasi SOP BPMN</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Paket &amp; Harga</a></li>
                <li><Link href="/api-docs" className="hover:text-foreground transition-colors">Dokumentasi API</Link></li>
              </ul>
            </div>

            {/* Col 3: Perusahaan */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Perusahaan</p>
              <ul className="space-y-2 text-xs">
                <li><Link href="/about" className="hover:text-foreground transition-colors">Tentang Kami</Link></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">Pusat Bantuan (FAQ)</a></li>
                <li><a href="mailto:support@zefflow.app" className="hover:text-foreground transition-colors">Kontak Tim</a></li>
              </ul>
            </div>

            {/* Col 4: Legal & Standar */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Legal &amp; Keamanan</p>
              <ul className="space-y-2 text-xs">
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Syarat &amp; Ketentuan</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Kebijakan Privasi</Link></li>
                <li><a href="#security" className="hover:text-foreground transition-colors">PostgreSQL RLS</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
            <p>© 2026 Zefflow Studio. Platform visualisasi alur SOP &amp; Swimlane standar ISO 9001 &amp; BPMN 2.0.</p>
            <p className="font-mono">Made with passion for Indonesian Businesses</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

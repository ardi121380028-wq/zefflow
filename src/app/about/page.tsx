import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Heart, Sparkles, Users2, Workflow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Tentang Kami - Zefflow Studio",
  description: "Misi Zefflow membantu bisnis dan organisasi di Indonesia menstandarisasi SOP dan alur kerja lintas divisi secara visual dan modern.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-violet-600/30 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-600 to-fuchsia-600 shadow-md">
              <Workflow className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-foreground">
              Zefflow
            </span>
          </Link>

          <Button variant="outline" size="sm" asChild className="gap-2 text-xs">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 font-mono text-xs font-semibold text-violet-600 dark:text-violet-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>TENTANG ZEFFLOW STUDIO</span>
          </div>

          <h1 className="mt-5 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.2]">
            Membawa Kejelasan Alur Kerja bagi Bisnis di Indonesia
          </h1>

          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Kami membangun Zefflow untuk mengakhiri kebingungan operasional. Tidak ada lagi dokumen SOP ratusan halaman yang berdebu di lemari arsip — cukup kanvas visual interaktif yang dipahami setiap divisi dalam hitungan detik.
          </p>
        </div>

        {/* Story Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Kenapa Zefflow Lahir?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Banyak perusahaan, UMKM, dan tim teknologi di Indonesia kesulitan menjelaskan alur kerja antar departemen. Sales tidak tahu status teknis di lapangan, tim Finance lambat memproses faktur karena berkas tersangkut, dan karyawan baru bingung siapa yang bertanggung jawab atas suatu tugas.
            </p>
            <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Software diagram internasional seringkali terlalu mahal untuk kantong lokal, lambat, atau rumit digunakan. <strong>Zefflow</strong> hadir sebagai solusi kanvas swimlane modern, berkecepatan tinggi, berstandar ISO 9001 &amp; BPMN 2.0, dengan harga yang ramah bagi bisnis di Tanah Air.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                  <Workflow className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    Swimlane Multi-Divisi Intuitif
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tiap departemen memiliki jalur mandiri dengan indikator warna tegas.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    Kecepatan &amp; Ekspor Tajam 4K
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Render instan tanpa lag, siap ekspor ke PDF vector dan PNG resolusi tinggi.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Heart className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    Dibuat untuk Komunitas Bisnis Indonesia
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tarif terjangkau dalam Rupiah dengan dukungan bantuan berbahasa Indonesia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-16 rounded-3xl border border-border bg-gradient-to-r from-violet-500/10 via-background to-indigo-500/10 p-8 sm:p-12 text-center shadow-sm">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Mulai Transformasi Operasional Anda Sekarang
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Gunakan mode demo Zefflow hari ini tanpa biaya dan rasakan kemudahan merancang diagram swimlane pertama Anda.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="brand" size="lg" asChild className="gap-2 font-semibold">
              <Link href="/login">
                <span>Coba Zefflow Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 Zefflow Studio. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}

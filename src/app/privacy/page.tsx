import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZefflowLogo } from "@/components/ui/zefflow-logo";

export const metadata = {
  title: "Kebijakan Privasi - Zefflow Studio",
  description: "Kebijakan perlindungan data pribadi dan keamanan dokumen diagram SOP di Zefflow Studio.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-violet-600/30 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
            <ZefflowLogo size="md" badge="STUDIO" hideBadgeOnMobile />
          </Link>

          <Button variant="outline" size="sm" asChild className="gap-2 text-xs">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>PRIVASI &amp; PERLINDUNGAN DATA</span>
          </div>
          <h1 className="mt-3.5 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Kebijakan Privasi
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Zefflow berkomitmen menjaga kerahasiaan data operasional dan struktur SOP bisnis Anda sesuai UU Perlindungan Data Pribadi (UU PDP).
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              1. Informasi yang Kami Kumpulkan
            </h2>
            <p>
              Kami hanya mengumpulkan data yang esensial untuk mengoperasikan platform diagram:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Informasi Akun:</strong> Alamat email, nama lengkap, dan preferensi organisasi.</li>
              <li><strong>Data Diagram &amp; SOP:</strong> Struktur swimlane, node tugas, durasi SLA, nama PIC, dan deliverables yang Anda simpan.</li>
              <li><strong>Log Penggunaan Teknis:</strong> Alamat IP, jenis browser, dan metrik performa untuk pencegahan error dan keamanan sistem.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              2. Isolasi Mutlak dengan PostgreSQL Row Level Security (RLS)
            </h2>
            <p>
              Setiap baris data diagram, lane, dan langkah kerja di Zefflow dienkripsi dan diikat langsung ke <code>workspace_id</code> Anda menggunakan <strong>PostgreSQL Row Level Security (RLS)</strong>. Artinya, pengguna lain atau tim luar secara teknis tidak memiliki akses untuk membaca atau memodifikasi diagram Anda di tingkat basis data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              3. Tidak Ada Penjualan Data ke Pihak Ketiga
            </h2>
            <p>
              Kami <strong>tidak pernah menjual, menyewakan, atau membagikan</strong> data proses bisnis, diagram alur, atau informasi identitas Anda kepada pengiklan atau broker data pihak ketiga mana pun.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              4. Hak Akses &amp; Penghapusan Data Anda
            </h2>
            <p>
              Sesuai ketentuan UU PDP, Anda berhak sepenuhnya untuk mengunduh seluruh data diagram Anda (dalam format JSON standar, PDF vector, atau PNG resolusi tinggi 4K) dan meminta penghapusan akun serta pemusnahan seluruh data terkait kapan saja melalui menu Pengaturan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              5. Kontak Perlindungan Data
            </h2>
            <p>
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini atau pengelolaan data di Zefflow, silakan hubungi Tim Keamanan Kami di{" "}
              <a href="mailto:privacy@zefflow.app" className="text-primary hover:underline">
                privacy@zefflow.app
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 Zefflow Studio. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}

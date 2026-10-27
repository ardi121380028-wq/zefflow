import Link from "next/link";
import { ArrowLeft, FileText, Shield, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Syarat & Ketentuan Layanan - Zefflow Studio",
  description: "Ketentuan dan syarat penggunaan platform kanvas visual diagram SOP dan Swimlane Zefflow.",
};

export default function TermsPage() {
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

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-mono text-xs font-semibold text-violet-600 dark:text-violet-400">
            <FileText className="h-3.5 w-3.5" />
            <span>LEGAL &amp; COMPLIANCE</span>
          </div>
          <h1 className="mt-3.5 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Syarat &amp; Ketentuan Layanan
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Terakhir diperbarui: 27 Oktober 2026 • Berlaku efektif untuk seluruh pengguna platform Zefflow di Indonesia.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              1. Penerimaan Ketentuan
            </h2>
            <p>
              Dengan mendaftar, mengakses, atau menggunakan layanan <strong>Zefflow</strong> (&ldquo;Zefflow Studio&rdquo;, &ldquo;Kami&rdquo;), Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat dengan Syarat dan Ketentuan ini serta Kebijakan Privasi Kami. Jika Anda mewakili suatu badan usaha atau organisasi, Anda menyatakan berwenang untuk mengikat entitas tersebut.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              2. Kepemilikan Konten &amp; Hak Cipta Diagram
            </h2>
            <p>
              <strong>Diagram dan SOP Anda adalah milik Anda seutuhnya.</strong> Anda memegang hak cipta penuh atas seluruh teks, diagram alur kerja, bagan swimlane, parameter SLA, dan deliverables yang Anda buat di dalam Zefflow. Kami tidak mengklaim kepemilikan apa pun atas konten intelektual pengguna.
            </p>
            <p>
              Zefflow hanya memproses konten Anda untuk tujuan teknis penyediaan layanan, rendering kanvas, penyimpanan cloud terenkripsi, dan ekspor sesuai instruksi Anda.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              3. Penggunaan yang Diperbolehkan
            </h2>
            <p>Anda setuju untuk tidak:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Menyalahgunakan API atau kanvas visual untuk aktivitas melawan hukum Republik Indonesia.</li>
              <li>Melakukan rekayasa balik (*reverse engineering*), scraping otomatis tanpa izin, atau upaya penetrasi keamanan terhadap basis data Zefflow.</li>
              <li>Menyebarkan malware atau mengeksploitasi fitur berbagi publik (*public share token*) untuk konten spam atau penipuan.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              4. Paket Berlangganan &amp; Pembayaran
            </h2>
            <p>
              Zefflow menawarkan paket Gratis (Starter) serta paket Pro dan Tim dengan tarif Rupiah (IDR) yang terjangkau. Pembayaran diproses melalui payment gateway terpercaya dan berizin Bank Indonesia. Pembatalan langganan dapat dilakukan kapan saja melalui menu Pengaturan Akun tanpa biaya tersembunyi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              5. Jaminan Ketersediaan Layanan (SLA) &amp; Keamanan Data
            </h2>
            <p>
              Kami berupaya mempertahankan ketersediaan sistem hingga 99.9% uptime. Data Anda dilindungi oleh Row Level Security (RLS) pada PostgreSQL dan transmisi SSL/TLS 256-bit berstandar perbankan. Namun, Kami menganjurkan Anda untuk secara berkala mengekspor cadangan dokumen dalam format PDF atau PNG beresolusi tinggi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              6. Hubungi Kami
            </h2>
            <p>
              Pertanyaan seputar ketentuan layanan ini dapat dikirimkan melalui email ke{" "}
              <a href="mailto:legal@zefflow.app" className="text-primary hover:underline">
                legal@zefflow.app
              </a>{" "}
              atau melalui pusat bantuan Zefflow Studio.
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

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Columns3,
  Download,
  FileCheck2,
  GitBranch,
  HelpCircle,
  Image as ImageIcon,
  Keyboard,
  Layers,
  Lightbulb,
  MousePointer2,
  PanelLeft,
  Plus,
  Rows3,
  Sparkles,
  Square,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata = {
  title: "Panduan Penggunaan — Zefflow Studio",
  description:
    "Panduan lengkap langkah demi langkah menggunakan Zefflow untuk membuat diagram SOP swimlane, mengatur alur vertikal ke bawah, dan mengekspor dokumen resmi berlogo.",
};

export default function GuidePage() {
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
          <Link href="/features" className="hover:text-foreground transition-colors">Fitur Unggulan</Link>
          <Link href="/guide" className="text-foreground font-semibold">Panduan Aplikasi</Link>
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

      {/* Main Content with Sticky Chapter Index */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs text-muted-foreground shadow-sm">
            <HelpCircle className="h-3.5 w-3.5 text-violet-500" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
              Dokumentasi &amp; Panduan Praktis
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Panduan Menguasai Zefflow Studio
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Ikuti petunjuk lengkap di bawah ini untuk membuat diagram SOP standar operasional bisnis, mengelola alur lintas divisi, dan menghasilkan dokumen siap pakai.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Nav Sticky Index */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border/80 bg-card/70 p-4 backdrop-blur-xl space-y-1 text-xs font-medium text-muted-foreground">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground mb-3 px-2">
                Daftar Bab Panduan
              </p>
              <a href="#bab-1" className="block px-2.5 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                1. Memilih Arah Alur (Vertikal)
              </a>
              <a href="#bab-2" className="block px-2.5 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                2. Menambah &amp; Mengatur Lane
              </a>
              <a href="#bab-3" className="block px-2.5 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                3. Membuat Langkah &amp; Keputusan
              </a>
              <a href="#bab-4" className="block px-2.5 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                4. Menghubungkan Garis Panah
              </a>
              <a href="#bab-5" className="block px-2.5 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                5. Tombol 'Rapikan' Otomatis
              </a>
              <a href="#bab-6" className="block px-2.5 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                6. Logo Perusahaan &amp; Ekspor
              </a>
              <a href="#bab-7" className="block px-2.5 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                7. Panel Layers &amp; Shortcut
              </a>
            </div>
          </aside>

          {/* Guide Chapters Body */}
          <main className="lg:col-span-3 space-y-12">
            {/* Bab 1 */}
            <ChapterCard
              id="bab-1"
              number="01"
              title="Memilih Arah Alur: Vertikal (Ke Bawah) vs Horizontal (Ke Samping)"
              icon={<ArrowDown className="h-5 w-5 text-violet-500" />}
            >
              <p>
                Zefflow mendukung dua orientasi diagram swimlane:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Alur Ke Bawah (Vertikal):</strong> Sangat direkomendasikan untuk dokumen SOP modern. Setiap divisi berbentuk kolom dari kiri ke kanan, dan urutan aktivitas mengalir dari atas ke bawah.
                </li>
                <li>
                  <strong className="text-foreground">Alur Ke Samping (Horizontal):</strong> Ideal untuk pemetaan timeline Customer Journey memanjang ke samping.
                </li>
              </ul>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5 flex items-start gap-3 text-xs">
                <Lightbulb className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Cara Beralih:</strong> Cukup klik toggle switch <strong>"Ke bawah" / "Ke samping"</strong> yang berada di floating dock bawah layar. Diagram akan menyesuaikan posisinya secara otomatis!
                </div>
              </div>
            </ChapterCard>

            {/* Bab 2 */}
            <ChapterCard
              id="bab-2"
              number="02"
              title="Menambah &amp; Mengatur Jalur Divisi (Lane)"
              icon={<Columns3 className="h-5 w-5 text-sky-500" />}
            >
              <p>
                Lane mewakili satu entitas departemen, divisi, atau peran PIC dalam alur proses bisnis:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground">
                <li>Klik tombol <strong>+ Lane</strong> pada toolbar melayang di bawah layar.</li>
                <li>Pilih header lane untuk mengubah <em>Nama Divisi</em> dan <em>Warna Aksen</em> pada panel Inspector di kanan layar.</li>
                <li>Pada mode vertikal, geser handle di kanan atas header untuk memperlebar kolom, atau gunakan tombol panah untuk menukar urutan divisi ke kiri/kanan.</li>
              </ol>
            </ChapterCard>

            {/* Bab 3 */}
            <ChapterCard
              id="bab-3"
              number="03"
              title="Membuat Langkah Kerja, Titik Keputusan (Diamond), &amp; Terminal"
              icon={<Square className="h-5 w-5 text-amber-500" />}
            >
              <p>
                Ada 3 jenis elemen notasi standar BPMN yang tersedia:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="rounded-xl border border-border p-3 bg-muted/30">
                  <span className="font-bold text-sky-500 block mb-1">🟦 Langkah Kerja</span>
                  Tugas operasional standar. Dapat diisi detail durasi kerja, penanggung jawab (PIC), dan dokumen hasil.
                </div>
                <div className="rounded-xl border border-border p-3 bg-muted/30">
                  <span className="font-bold text-amber-500 block mb-1">🔶 Titik Keputusan</span>
                  Bentuk belah ketupat (diamond) untuk percabangan kondisi: Ya / Tidak / Revisi.
                </div>
                <div className="rounded-xl border border-border p-3 bg-muted/30">
                  <span className="font-bold text-emerald-500 block mb-1">🟢 Terminal</span>
                  Kapsul penanda titik Mulai (Start) dan Selesai (End) proses bisnis.
                </div>
              </div>
            </ChapterCard>

            {/* Bab 4 */}
            <ChapterCard
              id="bab-4"
              number="04"
              title="Menghubungkan Garis Panah (Smart Magnetic Snapping)"
              icon={<GitBranch className="h-5 w-5 text-emerald-500" />}
            >
              <p>
                Menghubungkan langkah di Zefflow sangat mudah dan tidak merepotkan:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                <li>Arahkan kursor ke langkah asal sampai muncul titik konektor (L/R/T/B).</li>
                <li>Tarik garis ke arah kotak langkah tujuan.</li>
                <li>
                  <strong className="text-foreground">Magnetic Auto-Snap:</strong> Anda tidak perlu tepat mengenai titik kecil! Cukup lepaskan kursor di atas badan kotak langkah tujuan, sistem akan otomatis memilih titik handle yang paling natural.
                </li>
                <li>Untuk memberi label (misal: "Ya" atau "Tidak"), klik garis panah lalu isi di panel kanan.</li>
              </ul>
            </ChapterCard>

            {/* Bab 5 */}
            <ChapterCard
              id="bab-5"
              number="05"
              title="Merapikan Diagram Otomatis dengan Tombol 'Rapikan' (✨)"
              icon={<Sparkles className="h-5 w-5 text-amber-500" />}
            >
              <p>
                Jika posisi langkah terasa berantakan setelah diedit atau dipindahkan:
              </p>
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Cukup klik tombol <strong>"Rapikan"</strong> di toolbar bawah.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Algoritma Zefflow akan mengelompokkan baris berdasarkan alur waktu, mengoptimalkan jarak antar baris berdasarkan tinggi teks aktual, serta menyejajarkan garis panah agar diagram tampak padat, profesional, dan siap dipresentasikan.
                </p>
              </div>
            </ChapterCard>

            {/* Bab 6 */}
            <ChapterCard
              id="bab-6"
              number="06"
              title="Menambahkan Logo Perusahaan &amp; Mengekspor Dokumen (PNG &amp; PDF)"
              icon={<ImageIcon className="h-5 w-5 text-rose-500" />}
            >
              <p>
                Jadikan diagram SOP beridentitas resmi korporat perusahaan Anda:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                <li>Pastikan tidak ada elemen terpilih di kanvas (atau klik area kosong kanvas).</li>
                <li>Panel kanan (Inspector) akan menampilkan <strong>Pengaturan Dokumen &amp; Logo</strong>.</li>
                <li>Unggah file logo perusahaan Anda (PNG, JPG, SVG) atau masukkan URL logo.</li>
                <li>Isi <strong>Nama Perusahaan</strong> dan <strong>Nomor Dokumen SOP</strong> (misal: <code>SOP-HR-002</code>).</li>
                <li>Klik tombol <strong>Ekspor</strong> di pojok kanan atas kanvas, pilih format <strong>PNG (Gambar 4K)</strong> atau <strong>PDF (Dokumen Resmi)</strong>.</li>
              </ol>
            </ChapterCard>

            {/* Bab 7 */}
            <ChapterCard
              id="bab-7"
              number="07"
              title="Menggunakan Panel Layers (Figma-Style) &amp; Shortcut Keyboard"
              icon={<Keyboard className="h-5 w-5 text-indigo-500" />}
            >
              <p>
                Bekerja lebih cepat dengan pintasan keyboard dan navigasi layer:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <ShortcutItem keys="Ctrl + B" desc="Buka / sembunyikan sidebar Layers" />
                <ShortcutItem keys="Ctrl + S" desc="Simpan perubahan manual seketika" />
                <ShortcutItem keys="Ctrl + Z" desc="Undo (kembalikan perubahan terakhir)" />
                <ShortcutItem keys="Ctrl + Shift + Z" desc="Redo (ulangi perubahan)" />
                <ShortcutItem keys="Backspace / Del" desc="Hapus elemen atau koneksi terpilih" />
                <ShortcutItem keys="Klik Layer Item" desc="Otomatis geser kamera fokus ke node" />
              </div>
            </ChapterCard>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card/40 py-10 text-center text-xs text-muted-foreground">
        <p>© 2026 Zefflow Studio. Butuh bantuan lebih lanjut? Hubungi tim kami di support@zefflow.app</p>
        <div className="mt-3 flex justify-center gap-4">
          <Link href="/" className="hover:text-foreground">Beranda</Link>
          <Link href="/features" className="hover:text-foreground">Fitur Lengkap</Link>
          <Link href="/login" className="hover:text-foreground">Masuk ke Studio</Link>
        </div>
      </footer>
    </div>
  );
}

function ChapterCard({
  id,
  number,
  title,
  icon,
  children,
}: {
  id: string;
  number: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article
      id={id}
      className="scroll-mt-24 rounded-3xl border border-border bg-card/90 p-6 sm:p-8 shadow-sm backdrop-blur-xl space-y-4"
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
          BAB {number}
        </span>
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted/80">
          {icon}
        </div>
      </div>

      <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight">
        {title}
      </h2>

      <div className="space-y-3 text-xs sm:text-sm text-foreground/90 leading-relaxed">
        {children}
      </div>
    </article>
  );
}

function ShortcutItem({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-muted/40">
      <span className="text-muted-foreground">{desc}</span>
      <kbd className="font-mono font-bold text-[10px] bg-card border border-border px-2 py-0.5 rounded shadow-sm text-foreground">
        {keys}
      </kbd>
    </div>
  );
}

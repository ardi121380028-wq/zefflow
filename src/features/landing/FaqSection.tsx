"use client";

import * as React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Apa perbedaan diagram Swimlane Zefflow dengan flowchart biasa?",
    a: "Flowchart konvensional hanya menunjukkan urutan langkah tanpa memperjelas siapa penanggung jawabnya. Zefflow menggunakan kanvas Swimlane berjalur per divisi (misalnya Sales, CS, IT, Finance) sehingga batas tanggung jawab, waktu siklus (SLA), dan serah terima deliverables antar departemen terlihat transparan tanpa kebingungan.",
  },
  {
    q: "Apakah Zefflow sesuai untuk audit ISO 9001:2015 dan BPMN 2.0?",
    a: "Ya. Setiap langkah kerja di Zefflow memiliki field terstruktur untuk Penanggung Jawab (PIC), Estimasi Durasi Waktu, Output Dokumen, serta gerbang keputusan (decision diamond) yang mematuhi konvensi audit kepatuhan mutu ISO 9001 dan Business Process Model and Notation (BPMN 2.0).",
  },
  {
    q: "Bagaimana kualitas ekspor gambar PNG dan dokumen PDF?",
    a: "Ekspor Zefflow dirancang dengan kualitas cetak tinggi (4K Sharp PNG dan Vector Quality PDF). Algoritma render kami menjamin teks tetap sangat tajam, bebas dari artefak kotak hitam maupun distorsi warna pelangi, siap dicetak pada kertas A4/A3 atau dilampirkan pada dokumen SOP resmi perusahaan.",
  },
  {
    q: "Apakah saya bisa membagikan diagram ke klien atau atasan tanpa mereka perlu login?",
    a: "Tentu saja. Anda dapat mengaktifkan fitur 'Bagikan Tautan Publik' yang menghasilkan tautan aman khusus view-only. Penerima tautan dapat memeriksa seluruh kanvas swimlane dan detail langkah tanpa perlu membuat akun atau mendaftar.",
  },
  {
    q: "Bagaimana Zefflow menjamin keamanan dan kerahasiaan data SOP kami?",
    a: "Setiap diagram Anda dienkripsi dan diisolasi menggunakan PostgreSQL Row Level Security (RLS) di tingkat database. Data proses bisnis Anda terisolasi secara mutlak dalam workspace Anda dan tidak pernah dibagikan atau dijual ke pihak ketiga.",
  },
  {
    q: "Apakah ada paket gratis untuk mencoba?",
    a: "Ya, Paket Starter Zefflow 100% gratis selamanya untuk hingga 3 diagram aktif. Anda bisa langsung mencoba merancang alur pertama Anda dalam hitungan detik tanpa perlu kartu kredit.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section id="faq" className="mt-28 text-left">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>PERTANYAAN UMUM</span>
        </div>
        <h2 className="mt-3 font-display text-2xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Frequently Asked Questions (FAQ)
        </h2>
        <p className="mt-2 max-w-xl text-xs sm:text-sm text-muted-foreground">
          Segala hal yang perlu Anda ketahui tentang perancangan alur swimlane dan standarisasi SOP di Zefflow.
        </p>
      </div>

      <div className="mt-12 max-w-3xl mx-auto space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-card transition-colors duration-150 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ml-3",
                    isOpen && "rotate-180 text-primary",
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50">
                  <p className="mt-3">{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

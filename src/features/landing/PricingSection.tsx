"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("yearly");

  return (
    <section id="pricing" className="mt-28 text-left">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-mono text-xs font-semibold text-violet-600 dark:text-violet-400">
          <Zap className="h-3.5 w-3.5" />
          <span>HARGA SPESIAL INDONESIA</span>
        </div>
        <h2 className="mt-3 font-display text-2xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Pilihan Paket Terjangkau untuk Bisnis Anda
        </h2>
        <p className="mt-2 max-w-xl text-xs sm:text-sm text-muted-foreground">
          Investasi terbaik untuk standarisasi operasional tim Anda. Transparan dalam Rupiah, tanpa biaya tersembunyi.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150",
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150",
              billingCycle === "yearly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Tahunan</span>
            <span className="rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase">
              Hemat 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
        {/* Tier 1: Starter (Gratis) */}
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-foreground">Starter</span>
              <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                Gratis Selamanya
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-3xl sm:text-4xl font-semibold text-foreground">Rp 0</span>
              <span className="text-xs text-muted-foreground">/ bulan</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Cocok untuk individu atau mahasiswa yang ingin belajar membuat diagram swimlane standar.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Hingga 3 Diagram Aktif</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Kanvas Swimlane Multi-Divisi</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Ekspor Gambar PNG Resolusi Standar</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Template Dasar SOP &amp; Journey</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" asChild className="w-full text-xs font-semibold">
              <Link href="/login">Mulai Gratis</Link>
            </Button>
          </div>
        </div>

        {/* Tier 2: Pro (Paling Populer) */}
        <div className="relative flex flex-col justify-between rounded-3xl border-2 border-violet-500 bg-card p-6 sm:p-7 shadow-[0_12px_40px_rgba(139,92,246,0.18)] transition-all duration-200 hover:-translate-y-1">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-0.5 text-[10px] font-semibold text-white shadow-md">
              <Sparkles className="h-3 w-3" /> PALING POPULER
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-foreground">Zefflow Pro</span>
              <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-600 dark:text-violet-400">
                Solo &amp; UMKM
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
                {billingCycle === "yearly" ? "Rp 39.000" : "Rp 49.000"}
              </span>
              <span className="text-xs text-muted-foreground">/ bulan</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {billingCycle === "yearly" ? "Ditagih Rp 468.000 / tahun (Hemat Rp 120.000)" : "Fleksibel ditagih bulanan"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Pilihan ideal untuk konsultan SOP, business owner, product manager, dan UMKM berkembang.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-foreground/90">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="font-medium">Diagram Swimlane Tanpa Batas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-500 shrink-0" />
                <span>Ekspor Gambar PNG 4K Ultra Sharp</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-500 shrink-0" />
                <span>Ekspor Dokumen PDF Vector (Anti-Pelangi)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-500 shrink-0" />
                <span>Bagikan Tautan Publik View-Only (Aman)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-500 shrink-0" />
                <span>Aksen Warna Divisi Solid Kustom</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-500 shrink-0" />
                <span>Autosave Cloud Realtime Tanpa Khawatir Hilang</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-border/60">
            <Button variant="brand" size="sm" asChild className="w-full text-xs font-semibold">
              <Link href="/login">Mulai Coba Pro</Link>
            </Button>
          </div>
        </div>

        {/* Tier 3: Business / Tim */}
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-foreground">Tim &amp; Bisnis</span>
              <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                Hingga 5 User
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
                {billingCycle === "yearly" ? "Rp 119.000" : "Rp 149.000"}
              </span>
              <span className="text-xs text-muted-foreground">/ bulan</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {billingCycle === "yearly" ? "Ditagih tahunan untuk seluruh tim" : "Ditagih bulanan per tim"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Didesain untuk standarisasi operasional perusahaan multi-divisi dan audit ISO terpadu.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Semua Fitur di Paket Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Kolaborasi Multi-User Lintas Departemen</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Isolasi PostgreSQL Row Level Security (RLS)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Akses REST API &amp; Webhook Terintegrasi</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Bantuan Prioritas WhatsApp Tim Zefflow</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" asChild className="w-full text-xs font-semibold">
              <Link href="/login">Hubungi Tim Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

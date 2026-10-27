"use client";

import * as React from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  FileOutput,
  GitBranch,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  User2,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepItem {
  id: string;
  laneId: string;
  title: string;
  type: "start" | "step" | "decision" | "end" | "alt";
  desc: string;
  duration?: string;
  pic?: string;
  output?: string;
  leftPx: number; // Staggered X position in canvas track
  topPx: number;  // Y position in canvas track
  widthPx: number;
  heightPx: number;
  buildStepRequired: number; // Minimal stage for this step to appear
}

interface ConnectorPath {
  id: string;
  fromStepId: string;
  toStepId: string;
  pathD: string;
  label?: string;
  labelX?: number;
  labelY?: number;
  labelVariant?: "default" | "yes" | "no";
  buildStepRequired: number;
}

interface LaneItem {
  id: string;
  name: string;
  dept: string;
  colorHex: string;
  dotClass: string;
  accentBarClass: string;
  badgeBg: string;
}

interface TemplatePreset {
  id: string;
  title: string;
  category: string;
  description: string;
  totalCanvasHeight: number;
  lanes: LaneItem[];
  steps: StepItem[];
  connectors: ConnectorPath[];
  buildStages: {
    step: number;
    title: string;
    description: string;
  }[];
}

const PRESETS: TemplatePreset[] = [
  {
    id: "isp-ftth",
    title: "Aktivasi Layanan Internet Dedicated & FTTH",
    category: "ISP & Telekomunikasi",
    description: "Alur standar registrasi pelanggan baru, survey lapangan, provisioning OLT, hingga penandatanganan Berita Acara (BAST).",
    totalCanvasHeight: 520, // 4 lanes x 130px
    buildStages: [
      { step: 1, title: "1. Setup 4 Jalur Swimlane", description: "Menyiapkan jalur divisi: Pelanggan, Sales, Teknisi NOC, dan Finance." },
      { step: 2, title: "2. Form Pelanggan Korporasi", description: "Menaruh formulir permohonan registrasi di jalur Pelanggan." },
      { step: 3, title: "3. Hubungkan Alur ke Sales", description: "Menghubungkan garis alur ke Sales untuk verifikasi coverage FAT/ODP." },
      { step: 4, title: "4. Evaluasi Keputusan NOC", description: "Menyisipkan belah ketupat keputusan redaman kabel fiber & latensi di NOC." },
      { step: 5, title: "5. BAST & Terhubung Selesai", description: "Menghubungkan cabang 'YA' ke Finance untuk rilis BAST & faktur." },
    ],
    lanes: [
      {
        id: "cust",
        name: "Pelanggan Korporasi",
        dept: "Customer / PIC B2B",
        colorHex: "#f43f5e",
        dotClass: "bg-rose-500 shadow-[0_0_8px_#f43f5e]",
        accentBarClass: "bg-rose-500",
        badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      },
      {
        id: "sales",
        name: "Sales & Account Executive",
        dept: "Commercial Enterprise",
        colorHex: "#0284c7",
        dotClass: "bg-sky-500 shadow-[0_0_8px_#0284c7]",
        accentBarClass: "bg-sky-500",
        badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      },
      {
        id: "noc",
        name: "Teknisi & NOC",
        dept: "Network Operations",
        colorHex: "#8b5cf6",
        dotClass: "bg-violet-500 shadow-[0_0_8px_#8b5cf6]",
        accentBarClass: "bg-violet-500",
        badgeBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      },
      {
        id: "finance",
        name: "Finance & Legal",
        dept: "Billing & Administration",
        colorHex: "#10b981",
        dotClass: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
        accentBarClass: "bg-emerald-500",
        badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      },
    ],
    steps: [
      {
        id: "s1",
        laneId: "cust",
        type: "start",
        title: "Permohonan Berlangganan",
        desc: "Klien mengisi formulir pendaftaran dan menyertakan NPWP / SIUP badan usaha.",
        duration: "10 Menit",
        pic: "PIC Klien",
        output: "Dokumen Registrasi",
        leftPx: 30,
        topPx: 26,
        widthPx: 220,
        heightPx: 78,
        buildStepRequired: 2,
      },
      {
        id: "s2",
        laneId: "sales",
        type: "step",
        title: "Verifikasi Lokasi & Coverage",
        desc: "Sales memeriksa ketersediaan port FAT/ODP terdekat dan membuat estimasi biaya penarikan.",
        duration: "2 Jam",
        pic: "Account Exec",
        output: "Form Kelaikan Lokasi",
        leftPx: 290,
        topPx: 156,
        widthPx: 220,
        heightPx: 78,
        buildStepRequired: 3,
      },
      {
        id: "s3",
        laneId: "noc",
        type: "decision",
        title: "Koneksi Stabil & Redaman OK?",
        desc: "Teknisi mengukur optical loss (-18 s/d -24 dBm) serta speedtest latensi gateway.",
        duration: "4 Jam",
        pic: "Teknisi Lapangan",
        output: "Hasil Test Redaman",
        leftPx: 550,
        topPx: 270,
        widthPx: 180,
        heightPx: 110,
        buildStepRequired: 4,
      },
      {
        id: "s3_alt",
        laneId: "noc",
        type: "alt",
        title: "Input Waiting List & Tiket FAT",
        desc: "Jalur alternatif jika redaman belum optimal, diteruskan ke tim ekspansi infrastruktur.",
        duration: "1 Hari",
        pic: "Project Fiber",
        output: "Tiket Penarikan Dropcore",
        leftPx: 770,
        topPx: 232,
        widthPx: 200,
        heightPx: 64,
        buildStepRequired: 4,
      },
      {
        id: "s4",
        laneId: "finance",
        type: "end",
        title: "Penerbitan BAST & Invoice",
        desc: "Tanda tangan serah terima Berita Acara dan penerbitan faktur deposit awal langganan.",
        duration: "1 Hari",
        pic: "Staf Billing",
        output: "BAST Resmi & Invoice",
        leftPx: 800,
        topPx: 416,
        widthPx: 220,
        heightPx: 78,
        buildStepRequired: 5,
      },
    ],
    connectors: [
      {
        id: "c1",
        fromStepId: "s1",
        toStepId: "s2",
        pathD: "M 250 65 L 266 65 Q 272 65 272 71 L 272 189 Q 272 195 278 195 L 290 195",
        buildStepRequired: 3,
      },
      {
        id: "c2",
        fromStepId: "s2",
        toStepId: "s3",
        pathD: "M 510 195 L 526 195 Q 532 195 532 201 L 532 319 Q 532 325 538 325 L 550 325",
        buildStepRequired: 4,
      },
      {
        id: "c3_no",
        fromStepId: "s3",
        toStepId: "s3_alt",
        pathD: "M 640 270 L 640 254 Q 640 248 646 248 L 770 248",
        label: "TIDAK",
        labelX: 648,
        labelY: 234,
        labelVariant: "no",
        buildStepRequired: 4,
      },
      {
        id: "c3_yes",
        fromStepId: "s3",
        toStepId: "s4",
        pathD: "M 640 380 L 640 447 Q 640 455 648 455 L 800 455",
        label: "YA",
        labelX: 652,
        labelY: 432,
        labelVariant: "yes",
        buildStepRequired: 5,
      },
    ],
  },
  {
    id: "hr-onboarding",
    title: "Onboarding Karyawan Baru Lintas Divisi",
    category: "SDM & Personalia",
    description: "Proses terkoordinasi antara HR, IT Helpdesk, dan Tim Mentor untuk menyambut staf baru.",
    totalCanvasHeight: 390, // 3 lanes x 130px
    buildStages: [
      { step: 1, title: "1. Setup 3 Jalur Swimlane", description: "Menyiapkan swimlane: HR & Talent, IT & Ops, serta Divisi Pengguna." },
      { step: 2, title: "2. Dokumen PKWT & NIP", description: "Pemberkasan kontrak kerja dan penerbitan nomor induk pegawai." },
      { step: 3, title: "3. Hubungkan ke IT Support", description: "Provisioning akun Google Workspace, lisensi Slack, dan laptop." },
      { step: 4, title: "4. Verifikasi Akun & Laptop", description: "Pengecekan enkripsi disk laptop dan akses VPN internal." },
      { step: 5, title: "5. Sesi 1-on-1 & Mentor Selesai", description: "Pengenalan roadmap 30 hari pertama oleh Team Lead divisi." },
    ],
    lanes: [
      {
        id: "hr",
        name: "Divisi HR & Talent",
        dept: "Departemen Personalia",
        colorHex: "#8b5cf6",
        dotClass: "bg-violet-500 shadow-[0_0_8px_#8b5cf6]",
        accentBarClass: "bg-violet-500",
        badgeBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      },
      {
        id: "it",
        name: "Divisi IT & Ops",
        dept: "Infrastructure & Security",
        colorHex: "#0284c7",
        dotClass: "bg-sky-500 shadow-[0_0_8px_#0284c7]",
        accentBarClass: "bg-sky-500",
        badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      },
      {
        id: "dept",
        name: "Divisi Pengguna (User)",
        dept: "Direct Team & Mentor",
        colorHex: "#10b981",
        dotClass: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
        accentBarClass: "bg-emerald-500",
        badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      },
    ],
    steps: [
      {
        id: "h1",
        laneId: "hr",
        type: "start",
        title: "Tanda Tangan PKWT & KTP",
        desc: "Pemberkasan dokumen legalitas karyawan, pembuatan nomor induk pegawai (NIP).",
        duration: "1 Hari",
        pic: "HR Officer",
        output: "Kontrak PKWT",
        leftPx: 30,
        topPx: 26,
        widthPx: 230,
        heightPx: 78,
        buildStepRequired: 2,
      },
      {
        id: "h2",
        laneId: "it",
        type: "step",
        title: "Provisioning Email & Laptop",
        desc: "Setup akun Google Workspace, lisensi Slack, VPN kantor, dan enkripsi disk laptop.",
        duration: "3 Jam",
        pic: "IT Support",
        output: "Akun & Laptop Siap",
        leftPx: 340,
        topPx: 156,
        widthPx: 230,
        heightPx: 78,
        buildStepRequired: 3,
      },
      {
        id: "h3",
        laneId: "dept",
        type: "end",
        title: "Sesi 1-on-1 & Mentor Assignment",
        desc: "Pengenalan roadmap produk, penunjukan mentor, dan review target sprint pertama.",
        duration: "2 Hari",
        pic: "Team Lead",
        output: "Rencana Kerja 30 Hari",
        leftPx: 680,
        topPx: 286,
        widthPx: 230,
        heightPx: 78,
        buildStepRequired: 5,
      },
    ],
    connectors: [
      {
        id: "hc1",
        fromStepId: "h1",
        toStepId: "h2",
        pathD: "M 260 65 L 295 65 Q 301 65 301 71 L 301 189 Q 301 195 307 195 L 340 195",
        buildStepRequired: 3,
      },
      {
        id: "hc2",
        fromStepId: "h2",
        toStepId: "h3",
        pathD: "M 570 195 L 620 195 Q 626 195 626 201 L 626 319 Q 626 325 632 325 L 680 325",
        buildStepRequired: 5,
      },
    ],
  },
  {
    id: "procurement",
    title: "SOP Pengadaan Barang & Pembelian",
    category: "Operasional Bisnis",
    description: "Standarisasi alur Purchase Request (PR) hingga persetujuan Direksi dan Purchase Order (PO).",
    totalCanvasHeight: 390,
    buildStages: [
      { step: 1, title: "1. Setup 3 Jalur Swimlane", description: "Menyiapkan swimlane: Pemohon, Purchasing, dan Manajemen." },
      { step: 2, title: "2. Form Purchase Request", description: "Pengajuan form kebutuhan barang & estimasi bujet kerja." },
      { step: 3, title: "3. Komparasi Vendor", description: "Purchasing membandingkan penawaran minimal 3 rekanan." },
      { step: 4, title: "4. Evaluasi Direksi (Decision)", description: "Evaluasi limit belanja modal dan margin cashflow." },
      { step: 5, title: "5. Rilis Purchase Order", description: "Penerbitan PO resmi ke vendor rekanan terpilih." },
    ],
    lanes: [
      {
        id: "req",
        name: "Divisi Pemohon",
        dept: "All Departments",
        colorHex: "#f59e0b",
        dotClass: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
        accentBarClass: "bg-amber-500",
        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      },
      {
        id: "purch",
        name: "Tim Purchasing",
        dept: "Supply Chain & Vendor",
        colorHex: "#0284c7",
        dotClass: "bg-sky-500 shadow-[0_0_8px_#0284c7]",
        accentBarClass: "bg-sky-500",
        badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      },
      {
        id: "mgmt",
        name: "Manajemen & Direksi",
        dept: "Commercial Approval",
        colorHex: "#8b5cf6",
        dotClass: "bg-violet-500 shadow-[0_0_8px_#8b5cf6]",
        accentBarClass: "bg-violet-500",
        badgeBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      },
    ],
    steps: [
      {
        id: "p1",
        laneId: "req",
        type: "start",
        title: "Pengajuan Purchase Request (PR)",
        desc: "Lampirkan spesifikasi teknis barang, estimasi anggaran, dan urgensi penggunaan.",
        duration: "1 Hari",
        pic: "Kepala Bagian",
        output: "Dokumen Form PR",
        leftPx: 30,
        topPx: 26,
        widthPx: 220,
        heightPx: 78,
        buildStepRequired: 2,
      },
      {
        id: "p2",
        laneId: "purch",
        type: "step",
        title: "Perbandingan 3 Vendor",
        desc: "Melakukan request for quotation (RFQ) minimal ke 3 rekanan distributor resmi.",
        duration: "3 Hari",
        pic: "Buyer / Purchasing",
        output: "Matriks Perbandingan",
        leftPx: 300,
        topPx: 156,
        widthPx: 220,
        heightPx: 78,
        buildStepRequired: 3,
      },
      {
        id: "p3",
        laneId: "mgmt",
        type: "decision",
        title: "Disetujui Direksi (>Rp 50jt)?",
        desc: "Evaluasi kesesuaian anggaran OPEX/CAPEX tahunan dan margin cashflow perusahaan.",
        duration: "1 Hari",
        pic: "Direktur Keuangan",
        output: "Lembar Persetujuan",
        leftPx: 570,
        topPx: 270,
        widthPx: 180,
        heightPx: 110,
        buildStepRequired: 4,
      },
      {
        id: "p4",
        laneId: "purch",
        type: "end",
        title: "Penerbitan Purchase Order (PO)",
        desc: "PO resmi ditandatangani dan diteruskan ke vendor untuk pengiriman barang.",
        duration: "1 Hari",
        pic: "Purchasing Lead",
        output: "Dokumen PO Final",
        leftPx: 820,
        topPx: 156,
        widthPx: 210,
        heightPx: 78,
        buildStepRequired: 5,
      },
    ],
    connectors: [
      {
        id: "pc1",
        fromStepId: "p1",
        toStepId: "p2",
        pathD: "M 250 65 L 270 65 Q 276 65 276 71 L 276 189 Q 276 195 282 195 L 300 195",
        buildStepRequired: 3,
      },
      {
        id: "pc2",
        fromStepId: "p2",
        toStepId: "p3",
        pathD: "M 520 195 L 540 195 Q 546 195 546 201 L 546 319 Q 546 325 552 325 L 570 325",
        buildStepRequired: 4,
      },
      {
        id: "pc3_yes",
        fromStepId: "p3",
        toStepId: "p4",
        pathD: "M 660 270 L 660 201 Q 660 195 666 195 L 820 195",
        label: "YA",
        labelX: 668,
        labelY: 220,
        labelVariant: "yes",
        buildStepRequired: 5,
      },
    ],
  },
];

export function InteractiveFlowShowcase() {
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>("isp-ftth");
  const [buildStep, setBuildStep] = React.useState<number>(5); // default full view
  const [isBuilding, setIsBuilding] = React.useState<boolean>(false);
  const [activeStepId, setActiveStepId] = React.useState<string>("s2");

  const preset: TemplatePreset = PRESETS.find((p) => p.id === selectedPresetId) ?? (PRESETS[0] as TemplatePreset);
  const activeStep: StepItem = preset.steps.find((s) => s.id === activeStepId) ?? (preset.steps[0] as StepItem);

  // Auto-play creation animation timer
  React.useEffect(() => {
    if (!isBuilding) return;

    const timer = setInterval(() => {
      setBuildStep((prev) => {
        if (prev >= 5) {
          setIsBuilding(false);
          return 5;
        }
        const next = prev + 1;
        const matchingStep = preset.steps.find((s) => s.buildStepRequired === next);
        if (matchingStep) {
          setActiveStepId(matchingStep.id);
        }
        return next;
      });
    }, 1900);

    return () => clearInterval(timer);
  }, [isBuilding, preset]);

  // Restart creation animation
  const startBuildAnimation = () => {
    setBuildStep(1);
    setIsBuilding(true);
    if (preset.steps[0]) {
      setActiveStepId(preset.steps[0].id);
    }
  };

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    setBuildStep(5);
    setIsBuilding(false);
    const target = PRESETS.find((p) => p.id === id);
    if (target && target.steps[0]) {
      setActiveStepId(target.steps[0].id);
    }
  };

  const currentStage = preset.buildStages.find((s) => s.step === buildStep) ?? preset.buildStages[preset.buildStages.length - 1];

  return (
    <div className="w-full">
      {/* Category Tab Bar & Simulation Controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => {
            const isSelected = p.id === selectedPresetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200",
                  isSelected
                    ? "bg-violet-600 text-white shadow-[0_0_18px_rgba(139,92,246,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-violet-400/40"
                    : "border border-border bg-card/70 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{p.category}</span>
              </button>
            );
          })}
        </div>

        {/* Animation Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (isBuilding) {
                setIsBuilding(false);
              } else if (buildStep >= 5) {
                startBuildAnimation();
              } else {
                setIsBuilding(true);
              }
            }}
            className={cn(
              "gap-2 text-xs font-semibold transition-all duration-200",
              isBuilding
                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.4)]"
                : "bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.4)]",
            )}
          >
            {isBuilding ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>Jeda Animasi</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{buildStep < 5 ? "Lanjutkan Buat Alur" : "Animasi Buat Swimlane"}</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={startBuildAnimation}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Ulangi simulasi dari tahap 1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ulangi</span>
          </Button>
        </div>
      </div>

      {/* Stepper Process Timeline Bar */}
      <div className="mb-4 rounded-2xl border border-border dark:border-white/[0.08] bg-card p-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono text-xs font-bold shrink-0">
              {buildStep}/5
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">
                {currentStage?.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {currentStage?.description}
              </p>
            </div>
          </div>

          {/* Timeline Step Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {preset.buildStages.map((stage) => {
              const isPastOrActive = buildStep >= stage.step;
              const isCurrent = buildStep === stage.step;

              return (
                <button
                  key={stage.step}
                  type="button"
                  onClick={() => {
                    setIsBuilding(false);
                    setBuildStep(stage.step);
                    const matching = preset.steps.find((s) => s.buildStepRequired === stage.step);
                    if (matching) setActiveStepId(matching.id);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0",
                    isCurrent
                      ? "bg-violet-600 text-white shadow-sm"
                      : isPastOrActive
                      ? "bg-muted text-foreground hover:bg-muted/80"
                      : "text-muted-foreground/60 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isCurrent
                        ? "bg-white animate-ping"
                        : isPastOrActive
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/40",
                    )}
                  />
                  <span>Tahap {stage.step}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(buildStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Studio Canvas Frame */}
      <div className="relative overflow-hidden rounded-3xl border border-border dark:border-white/[0.12] bg-card dark:bg-[#0B0C13] shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        {/* Top Window Bar */}
        <div className="flex h-12 items-center justify-between border-b border-border dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#0E0F17] px-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-none">
              zefflow-studio / {preset.id}.flow
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              ISO 9001 BPMN 2.0
            </span>
            <span className="hidden sm:inline-flex rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground border border-border">
              {buildStep >= 5 ? "Alur Lengkap & Terhubung" : `Tahap ${buildStep}/5`}
            </span>
          </div>
        </div>

        {/* Diagram Canvas Body (Horizontal Scroll Container) */}
        <div className="relative overflow-x-auto bg-slate-50/40 dark:bg-[#090A10]">
          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Canvas Wrapper with True Swimlane Height and Width */}
          <div
            className="relative flex min-w-[1060px]"
            style={{ height: preset.totalCanvasHeight }}
          >
            {/* Left Column: Fixed Swimlane Division Headers */}
            <div className="w-52 shrink-0 border-r border-border dark:border-white/[0.08] bg-card/90 dark:bg-[#0D0F17]/90 z-20 flex flex-col">
              {preset.lanes.map((lane, idx) => (
                <div
                  key={lane.id}
                  className={cn(
                    "relative flex flex-col justify-center px-4 border-b border-border/80 dark:border-white/[0.06] transition-all duration-300",
                    buildStep >= 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
                  )}
                  style={{
                    height: 130,
                    transitionDelay: `${idx * 80}ms`,
                  }}
                >
                  {/* Solid True-Color Accent Bar */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1.5 shadow-[0_0_10px_rgba(0,0,0,0.15)]",
                      lane.accentBarClass,
                    )}
                  />

                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", lane.dotClass)} />
                    <p className="font-display text-xs font-bold text-foreground dark:text-white tracking-tight truncate">
                      {lane.name}
                    </p>
                  </div>
                  <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground truncate">
                    {lane.dept}
                  </span>
                </div>
              ))}
            </div>

            {/* Right Area: Unified Canvas Track for Nodes & SVG Connectors */}
            <div className="relative flex-1" style={{ minWidth: 840 }}>
              {/* Lane Row Horizontal Background Strips */}
              {preset.lanes.map((lane, idx) => (
                <div
                  key={`track-${lane.id}`}
                  className="absolute left-0 right-0 border-b border-border/60 dark:border-white/[0.05]"
                  style={{
                    top: idx * 130,
                    height: 130,
                  }}
                />
              ))}

              {/* SVG Connector Lines Layer (Rendered below nodes) */}
              <svg
                className="absolute inset-0 h-full w-full pointer-events-none z-10 overflow-visible"
                style={{ width: "100%", height: "100%" }}
              >
                <defs>
                  {/* Arrow marker */}
                  <marker
                    id="flow-arrow"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8b5cf6" />
                  </marker>
                  <marker
                    id="flow-arrow-emerald"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                  </marker>
                  <marker
                    id="flow-arrow-amber"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
                  </marker>

                  <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>

                {preset.connectors.map((c) => {
                  const isVisible = buildStep >= c.buildStepRequired;
                  if (!isVisible) return null;

                  const isEmerald = c.labelVariant === "yes";
                  const isAmber = c.labelVariant === "no";
                  const strokeColor = isEmerald ? "#10b981" : isAmber ? "#f59e0b" : "#8b5cf6";
                  const markerId = isEmerald ? "url(#flow-arrow-emerald)" : isAmber ? "url(#flow-arrow-amber)" : "url(#flow-arrow)";

                  return (
                    <g key={c.id} className="animate-in fade-in duration-500">
                      {/* Glow Shadow Line */}
                      <path
                        d={c.pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="5"
                        strokeOpacity="0.2"
                        strokeLinecap="round"
                      />

                      {/* Main Flow Line */}
                      <path
                        d={c.pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeDasharray="6 4"
                        markerEnd={markerId}
                        className="animate-flow-dash"
                      />

                      {/* Branch Label Badge */}
                      {c.label && c.labelX && c.labelY && (
                        <g transform={`translate(${c.labelX}, ${c.labelY})`}>
                          <rect
                            x="-16"
                            y="-9"
                            width="32"
                            height="18"
                            rx="5"
                            fill={isEmerald ? "#064e3b" : "#78350f"}
                            stroke={isEmerald ? "#10b981" : "#f59e0b"}
                            strokeWidth="1.2"
                          />
                          <text
                            x="0"
                            y="3.5"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {c.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Nodes Layer (Positioned with Staggered X/Y coordinates) */}
              <div className="absolute inset-0 z-20 pointer-events-auto">
                {preset.steps.map((step) => {
                  const isVisible = buildStep >= step.buildStepRequired;
                  const isSelected = step.id === activeStepId;

                  if (!isVisible) {
                    return (
                      <div
                        key={step.id}
                        className="absolute flex items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 text-muted-foreground/40 text-[10px] font-mono transition-all"
                        style={{
                          left: step.leftPx,
                          top: step.topPx,
                          width: step.widthPx,
                          height: step.heightPx,
                        }}
                      >
                        Tahap {step.buildStepRequired}
                      </div>
                    );
                  }

                  if (step.type === "decision") {
                    return (
                      <div
                        key={step.id}
                        className="absolute flex items-center justify-center transition-all duration-300 animate-in fade-in zoom-in-95"
                        style={{
                          left: step.leftPx,
                          top: step.topPx,
                          width: step.widthPx,
                          height: step.heightPx,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveStepId(step.id);
                            setIsBuilding(false);
                          }}
                          className={cn(
                            "group relative flex items-center justify-center text-center transition-all duration-200 select-none",
                            isSelected ? "scale-105" : "hover:scale-[1.02]",
                          )}
                          style={{ width: 180, height: 110 }}
                        >
                          <svg
                            className={cn(
                              "absolute inset-0 h-full w-full overflow-visible transition-all duration-200",
                              isSelected
                                ? "drop-shadow-[0_0_22px_rgba(245,158,11,0.7)]"
                                : "drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_0_16px_rgba(245,158,11,0.4)]",
                            )}
                            viewBox="0 0 180 110"
                            fill="none"
                          >
                            <defs>
                              <linearGradient id={`previewDiamond-${step.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--diamond-stop-1)" />
                                <stop offset="50%" stopColor="var(--diamond-stop-2)" />
                                <stop offset="100%" stopColor="var(--diamond-stop-3)" />
                              </linearGradient>
                            </defs>
                            <polygon
                              points="90,4 174,55 90,106 6,55"
                              fill={`url(#previewDiamond-${step.id})`}
                              stroke="var(--diamond-stroke)"
                              strokeWidth={isSelected ? "2.5" : "1.8"}
                              className="transition-all duration-200"
                            />
                            <polyline
                              points="24,55 90,14 156,55"
                              stroke="var(--diamond-stroke)"
                              strokeOpacity="0.3"
                              strokeWidth="1.2"
                              fill="none"
                            />
                          </svg>

                          <div className="relative z-10 flex flex-col items-center justify-center px-3 max-w-[124px]">
                            <span className="mb-1 grid h-5 w-5 place-items-center rounded-md border border-amber-500/40 bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              <GitBranch className="h-3 w-3" />
                            </span>
                            <p className="text-[11px] font-bold text-[var(--diamond-text)] leading-tight text-center">
                              {step.title}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  }

                  if (step.type === "alt") {
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => {
                          setActiveStepId(step.id);
                          setIsBuilding(false);
                        }}
                        className={cn(
                          "absolute rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 p-2.5 text-left transition-all duration-200 animate-in fade-in zoom-in-95 hover:border-amber-500",
                          isSelected ? "ring-2 ring-amber-500 shadow-md" : "",
                        )}
                        style={{
                          left: step.leftPx,
                          top: step.topPx,
                          width: step.widthPx,
                          height: step.heightPx,
                        }}
                      >
                        <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                          Cabang Pending
                        </span>
                        <p className="font-display text-[10.5px] font-semibold text-foreground dark:text-white leading-tight truncate">
                          {step.title}
                        </p>
                      </button>
                    );
                  }

                  // Standard / Start / End Step Nodes
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        setActiveStepId(step.id);
                        setIsBuilding(false);
                      }}
                      className={cn(
                        "absolute rounded-2xl border p-3.5 text-left transition-all duration-300 animate-in fade-in zoom-in-95 shadow-sm",
                        isSelected
                          ? "border-violet-500 bg-card shadow-[0_0_24px_rgba(139,92,246,0.3)] ring-2 ring-violet-500/50"
                          : "border-border dark:border-white/[0.09] bg-card dark:bg-[#121420] hover:border-violet-500/40",
                      )}
                      style={{
                        left: step.leftPx,
                        top: step.topPx,
                        width: step.widthPx,
                        height: step.heightPx,
                      }}
                    >
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white shadow-md">
                          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-1">
                        <p className="font-display text-xs font-bold text-foreground dark:text-white leading-snug truncate">
                          {step.title}
                        </p>
                        {step.type === "end" && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {step.duration && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-100 text-slate-700 dark:bg-[#161824] dark:text-zinc-300 px-1.5 py-0.2 font-mono text-[9px]">
                            <Clock className="h-2.5 w-2.5 text-violet-500" />
                            {step.duration}
                          </span>
                        )}
                        {step.pic && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-100 text-slate-700 dark:bg-[#161824] dark:text-zinc-300 px-1.5 py-0.2 font-mono text-[9px]">
                            <User2 className="h-2.5 w-2.5 text-sky-500" />
                            {step.pic}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live Step Inspector Details Bottom Bar */}
        {activeStep && (
          <div className="border-t border-border dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#0E0F16] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xs font-bold text-foreground dark:text-white">
                    {activeStep.title}
                  </span>
                  <span className="rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[9px] font-mono text-violet-600 dark:text-violet-400 font-bold uppercase">
                    Aktif Terpilih
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xl">
                  {activeStep.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {activeStep.output && (
                <div className="flex items-center gap-1.5 rounded-xl border border-border dark:border-white/[0.08] bg-card px-3 py-1.5 text-xs text-foreground font-medium">
                  <FileOutput className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px] text-muted-foreground">Output:</span>
                  <span className="font-semibold">{activeStep.output}</span>
                </div>
              )}
              <Button variant="brand" size="sm" asChild className="text-xs">
                <a href="/login">
                  <span>Mulai Desain di Kanvas</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

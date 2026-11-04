import type { FlowDocument, LaneColor, Orientation } from "@/lib/validation/flow";
import { COL_GAP, FIRST_COL_X, LANE_DEFAULT_HEIGHT, LANE_DEFAULT_WIDTH, STEP_WIDTH, convertLayout, estimateNodeSize } from "@/features/canvas/lib/layout";

type StepSpec = { id: string; lane: number; col: number; type?: "step" | "decision" | "terminal"; title: string; description?: string; duration?: [number, "menit" | "jam" | "hari"]; output?: string; owner?: string };

type LinkSpec = [string, string, string?, ("l" | "r" | "t" | "b")?, ("l" | "r" | "t" | "b")?];

export interface FlowTemplate {
  id: string;
  title: string;
  description: string;
  kind: "sop" | "journey" | "architect";
  orientation?: Orientation;
  companyName?: string;
  docCode?: string;
  companyLogo?: string;
  wallpaper?: string;
  lanes: { title: string; division: string; color: LaneColor; icon?: string }[];
  steps: StepSpec[];
  links: LinkSpec[];
}

/** Template bawaan (di kode, bukan DB) → tidak perlu seeding & mudah di-versi. */
export const TEMPLATES: FlowTemplate[] = [
  {
    id: "customer-onboarding",
    title: "Onboarding Pelanggan Baru",
    description: "Perjalanan pelanggan dari pendaftaran hingga aktivasi, lintas Sales, CS, dan Finance.",
    kind: "journey",
    lanes: [
      { title: "Pelanggan", division: "Customer", color: "violet" },
      { title: "Sales", division: "Tim Penjualan", color: "sky" },
      { title: "Customer Success", division: "Tim Customer Success", color: "emerald" },
      { title: "Finance", division: "Keuangan", color: "amber" },
    ],
    steps: [
      { id: "a", lane: 0, col: 0, type: "terminal", title: "Mulai" },
      { id: "b", lane: 0, col: 1, title: "Mengisi form pendaftaran", duration: [10, "menit"], output: "Data pendaftaran" },
      { id: "c", lane: 1, col: 2, title: "Verifikasi & kualifikasi lead", owner: "Account Executive", duration: [1, "hari"] },
      { id: "d", lane: 3, col: 3, title: "Terbitkan invoice", output: "Invoice", duration: [2, "jam"] },
      { id: "e", lane: 0, col: 4, type: "decision", title: "Pembayaran diterima?" },
      { id: "f", lane: 2, col: 5, title: "Kickoff & setup akun", owner: "Customer Success", duration: [2, "hari"], output: "Akun aktif" },
      { id: "g", lane: 2, col: 6, type: "terminal", title: "Selesai" },
    ],
    links: [["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "f", "Ya"], ["f", "g"]],
  },
  {
    id: "procurement-sop",
    title: "SOP Pengadaan Barang",
    description: "Alur permintaan, persetujuan, dan pembelian barang antar divisi.",
    kind: "sop",
    lanes: [
      { title: "Pemohon", division: "Semua divisi", color: "sky" },
      { title: "Atasan", division: "Manajer", color: "violet" },
      { title: "Purchasing", division: "Pengadaan", color: "emerald" },
      { title: "Finance", division: "Keuangan", color: "amber" },
    ],
    steps: [
      { id: "a", lane: 0, col: 0, type: "terminal", title: "Mulai" },
      { id: "b", lane: 0, col: 1, title: "Buat Purchase Request", output: "Form PR", duration: [30, "menit"] },
      { id: "c", lane: 1, col: 2, type: "decision", title: "Disetujui atasan?" },
      { id: "d", lane: 2, col: 3, title: "Cari & bandingkan vendor", duration: [3, "hari"], owner: "Staf Purchasing" },
      { id: "e", lane: 2, col: 4, title: "Terbitkan Purchase Order", output: "PO" },
      { id: "f", lane: 3, col: 5, title: "Proses pembayaran", duration: [7, "hari"], output: "Bukti bayar" },
      { id: "g", lane: 3, col: 6, type: "terminal", title: "Selesai" },
    ],
    links: [["a", "b"], ["b", "c"], ["c", "d", "Ya"], ["d", "e"], ["e", "f"], ["f", "g"]],
  },
  {
    id: "isp-retail-flow",
    title: "Alur New Customer Retail (Zitline FTTH)",
    description: "SOP resmi aktivasi internet retail: registrasi pelanggan, input waiting list CRM, penjadwalan & instalasi ONT, billing tagihan finance, aktivasi PPPoE NOC, uji koneksi, BAST, arsip, dan serah terima akun.",
    kind: "sop",
    orientation: "horizontal",
    companyName: "ZITLINE Internet Service Provider",
    companyLogo: "/brand/zitline-logo.svg",
    docCode: "SOP-RETAIL-01",
    wallpaper: "solid-zitline",
    lanes: [
      { title: "Customer", division: "Pelanggan Residensial", color: "rose" },
      { title: "Sales", division: "Tim Penjualan / Pemasaran", color: "amber" },
      { title: "Customer Service", division: "Customer Service & Helpdesk", color: "violet" },
      { title: "Technical Support", division: "Teknisi Lapangan (Field Engineer)", color: "emerald" },
      { title: "Network Operation Center", division: "Monitoring & Core Network", color: "sky" },
      { title: "Finance", division: "Keuangan & Billing", color: "slate" },
    ],
    steps: [
      { id: "r1", lane: 0, col: 0, type: "terminal", title: "Registrasi Pelanggan Baru", description: "Pelanggan mengajukan pendaftaran pasang baru dan melengkapi data KTP serta share location rumah.", output: "Formulir Registrasi & KTP", owner: "Pelanggan" },
      { id: "r2", lane: 1, col: 0, type: "step", title: "Input Waiting List CRM", description: "Sales memvalidasi jangkauan ODP dan mencatat data pelanggan ke sistem CRM serta antrean instalasi.", output: "Tiket Waiting List CRM", owner: "Sales Officer" },
      { id: "r3", lane: 3, col: 0, type: "step", title: "Penjadwalan Kunjungan", description: "Technical Support mengonfirmasi kesediaan waktu pelanggan dan mengatur jadwal teknisi lapangan.", output: "Jadwal Kunjungan Teknisi", owner: "Technical Support" },
      { id: "r4", lane: 3, col: 1, type: "step", title: "Instalasi Drop Core & ONT", description: "Teknisi lapangan menarik kabel fiber optik drop core dari ODP ke rumah dan memasang perangkat ONT/modem.", output: "Kabel Drop Core & ONT Terpasang", owner: "Teknisi Lapangan" },
      { id: "r5", lane: 2, col: 2, type: "step", title: "Create Customer ID", description: "Customer Service menerbitkan Customer ID resmi di sistem billing & CRM berdasarkan barcode serial number ONT terpasang.", output: "Customer ID Resmi", owner: "Customer Service" },
      { id: "r6", lane: 5, col: 2, type: "step", title: "Penerbitan Tagihan", description: "Bagian Finance menerbitkan invoice pembayaran biaya registrasi/instalasi dan iuran paket internet pertama.", output: "Invoice Tagihan", owner: "Finance Billing" },
      { id: "r7", lane: 4, col: 3, type: "step", title: "Aktivasi Port & PPPoE", description: "NOC Engineer mendaftarkan serial number ONT di OLT serta mengaktifkan profil akun PPPoE dan alokasi IP.", output: "Port OLT & PPPoE Aktif", owner: "NOC Engineer" },
      { id: "r8", lane: 3, col: 3, type: "step", title: "Cek Redaman & Koneksi", description: "Teknisi mengukur optical loss (redaman optik) dan melakukan uji kecepatan serta kestabilan internet di lokasi.", output: "Hasil Redaman & Speedtest OK", owner: "Teknisi Lapangan" },
      { id: "r9", lane: 3, col: 4, type: "step", title: "Berita Acara (BAST)", description: "Teknisi dan pelanggan bersama-sama menandatangani Berita Acara Serah Terima (BAST) pekerjaan instalasi.", output: "BAST Fisik / Digital", owner: "Teknisi & Pelanggan" },
      { id: "r10", lane: 2, col: 4, type: "step", title: "Arsip Dokumen BAST", description: "Customer Service mengarsipkan salinan dokumen BAST dan memperbarui status layanan pelanggan menjadi Active.", output: "Dokumen BAST Terarsip", owner: "Customer Service" },
      { id: "r11", lane: 0, col: 4, type: "step", title: "Serah Terima Kredensial", description: "Customer Service menyerahkan informasi akun login pelanggan, kredensial WiFi, dan nomor kontak helpdesk resmi.", output: "Kredensial & Panduan Layanan", owner: "Customer Service" },
      { id: "r12", lane: 0, col: 5, type: "terminal", title: "Done (Internet Aktif)", description: "Layanan internet FTTH resmi beroperasi penuh dan siap dinikmati pelanggan.", output: "Layanan Internet Aktif", owner: "Pelanggan" },
    ],
    links: [
      ["r1", "r2", undefined, "b", "t"],
      ["r2", "r3", undefined, "b", "t"],
      ["r3", "r4", undefined, "r", "l"],
      ["r4", "r5", undefined, "t", "l"],
      ["r5", "r6", undefined, "b", "t"],
      ["r6", "r7", undefined, "r", "b"],
      ["r7", "r8", undefined, "t", "b"],
      ["r8", "r9", undefined, "r", "l"],
      ["r9", "r10", undefined, "t", "b"],
      ["r10", "r11", undefined, "t", "b"],
      ["r11", "r12", undefined, "r", "l"],
    ],
  },
  {
    id: "isp-corporate-flow",
    title: "Alur New Customer Corporate (ISP B2B Dedicated)",
    description: "SOP resmi internet dedicated korporat: site survey, BoQ, approval direksi, MOU kontrak di depan, pengadaan alat, instalasi Metro-E, uji latensi RFC-2544, BAST, dan billing siklus.",
    kind: "sop",
    orientation: "horizontal",
    companyName: "ZITLINE Internet Service Provider",
    companyLogo: "/brand/zitline-logo.svg",
    docCode: "SOP-CORP-01",
    wallpaper: "solid-zitline",
    lanes: [
      { title: "Customer", division: "PIC Perusahaan / Korporasi", color: "rose" },
      { title: "Sales", division: "Tim Penjualan / B2B Account Executive", color: "amber" },
      { title: "Network Engineer", division: "Technical & Field Engineer", color: "emerald" },
      { title: "Management", division: "Direksi / Commercial Approval", color: "slate" },
      { title: "Warehouse", division: "Logistik & Pengadaan Perangkat", color: "slate" },
      { title: "Customer Service & Finance", division: "Admin Kontrak & Penagihan", color: "violet" },
      { title: "Network Operation Center", division: "Monitoring & Core Network", color: "sky" },
    ],
    steps: [
      { id: "c1", lane: 0, col: 0, type: "terminal", title: "Permintaan Pasang Baru", description: "PIC Korporasi mengirim formulir permohonan bandwidth dedicated (1:1), alokasi IP Publik, dan kebutuhan SLA 99.5%.", output: "Formulir Permohonan & KTP PIC", owner: "PIC Korporasi" },
      { id: "c2", lane: 1, col: 0, type: "step", title: "Follow Up & Request Survey", description: "Sales menganalisis kebutuhan bandwidth klien, menentukan kelayakan awal, dan menerbitkan Work Order Site Survey.", output: "Work Order Survey CRM", duration: [2, "jam"], owner: "Account Executive" },
      { id: "c3", lane: 2, col: 0, type: "step", title: "Survey Kebutuhan & Jalur FO", description: "Network Engineer melakukan survey rute kabel fiber optik, Line of Sight (LOS), tiang tumpu, dan kapasitas OTB/switch.", output: "Laporan Teknis Survey", duration: [1, "hari"], owner: "Network Engineer" },
      { id: "c4", lane: 2, col: 1, type: "decision", title: "Hasil Survey Layak (RFS)?", description: "Apakah lokasi klien dapat dijangkau secara teknis dan margin biaya penarikan kabel masuk dalam standar investasi ISP?" },
      { id: "c_hold", lane: 1, col: 1, type: "step", title: "Hold Data Waiting List", description: "Sales menginformasikan kendala teknis kepada klien dan mencatat data ke antrean ekspansi jaringan.", output: "Status Hold CRM", owner: "Account Executive" },
      { id: "c5", lane: 2, col: 2, type: "step", title: "Informasi Kebutuhan & BoQ", description: "Engineer menyusun Bill of Quantity (BoQ) material kabel FO/radio link, estimasi biaya penarikan, dan diagram topologi.", output: "BoQ Material & Topologi", owner: "Network Engineer" },
      { id: "c6", lane: 1, col: 3, type: "step", title: "Buat Penawaran (Quotation)", description: "Sales menyusun surat penawaran harga resmi B2B, skema biaya instalasi, dan Service Level Agreement (SLA).", output: "Proposal Penawaran Resmi", owner: "Account Executive" },
      { id: "c7", lane: 3, col: 3, type: "decision", title: "Persetujuan Manajemen?", description: "Direksi meninjau kelayakan margin profit, diskon harga kontrak jangka panjang, dan jadwal pengadaan material." },
      { id: "c8", lane: 0, col: 4, type: "step", title: "Konfirmasi & Isi Form Langganan", description: "Klien mengonfirmasi persetujuan penawaran harga dan melengkapi berkas legalitas perusahaan (NIB/NPWP).", output: "Form Langganan & Legalitas", owner: "PIC Korporasi" },
      { id: "c_mou", lane: 1, col: 4, type: "step", title: "Buat & TTD MOU Kontrak", description: "Sales dan Klien menandatangani Kontrak Perjanjian Kerjasama (PKS/MOU) bermeterai sah sebelum eksekusi pengadaan.", output: "Kontrak PKS / MOU Sah", owner: "Account Executive" },
      { id: "c9", lane: 1, col: 5, type: "step", title: "Form Order Kebutuhan Alat", description: "Sales menerbitkan form order pengeluaran perangkat ke bagian gudang logistik sesuai spesifikasi BoQ.", output: "Form Order Pengeluaran Alat", owner: "Account Executive" },
      { id: "c10", lane: 4, col: 5, type: "step", title: "Pembelian / Alokasi Alat", description: "Warehouse menyiapkan Router Core, SFP module, media converter gigabit, dan perangkat wireless/switch.", output: "Perangkat Siap Pasang", duration: [1, "hari"], owner: "Warehouse Officer" },
      { id: "c11", lane: 5, col: 5, type: "step", title: "Create Customer ID", description: "Admin mendaftarkan akun korporat di CRM billing, menginput nomor kontrak, dan menyiapkan akun profil pelanggan.", output: "Customer ID Resmi", owner: "Customer Service" },
      { id: "c12", lane: 2, col: 6, type: "step", title: "Instalasi Jaringan On-Site", description: "Tim teknis melakukan penarikan kabel drop FO, splicing joint closure, terminasi OTB, dan mounting rack router.", output: "Kabel FO & Perangkat Terpasang", duration: [2, "hari"], owner: "Network Engineer" },
      { id: "c13", lane: 6, col: 6, type: "step", title: "Aktivasi Port & Routing BGP", description: "NOC mengonfigurasi IP Public statis, peering routing BGP/Static, alokasi bandwidth dedicated, dan monitoring MRTG.", output: "Port Core & BGP Aktif", duration: [3, "jam"], owner: "NOC Engineer" },
      { id: "c14", lane: 2, col: 7, type: "step", title: "Uji Koneksi & Latensi RFC-2544", description: "Engineer menguji stabilitas latensi, jitter, throughput 1:1 (RFC 2544), dan menyusun laporan commissioning test.", output: "Laporan Uji Koneksi RFC-2544", owner: "Network Engineer" },
      { id: "c15", lane: 2, col: 8, type: "step", title: "Berita Acara (BAST)", description: "Engineer menyusun Berita Acara Serah Terima (BAST) pekerjaan instalasi fisik dan commissioning.", output: "Draft Dokumen BAST", owner: "Network Engineer" },
      { id: "c16", lane: 0, col: 8, type: "step", title: "Validasi Layanan & TTD BAST", description: "PIC Klien memvalidasi koneksi internet dedicated dan menandatangani BAST serah terima resmi.", output: "BAST Sah Bertanda Tangan", owner: "PIC Korporasi" },
      { id: "c17", lane: 5, col: 9, type: "step", title: "Arsip Dokumen & Tagihan", description: "CS mengarsipkan BAST sah dan Finance menerbitkan invoice pembayaran bulan pertama serta biaya instalasi.", output: "Invoice Tagihan Resmi", duration: [1, "hari"], owner: "Finance Corporate" },
      { id: "c18", lane: 1, col: 9, type: "step", title: "Follow Up Tagihan", description: "Sales memastikan dokumen invoice dan faktur pajak telah diterima dengan baik oleh bagian Finance klien.", owner: "Account Executive" },
      { id: "c19", lane: 0, col: 9, type: "step", title: "Pembayaran Invoice", description: "Klien melakukan transfer pembayaran invoice langganan ke rekening giro perusahaan ISP.", output: "Bukti Transfer / Receipt", owner: "PIC Korporasi" },
      { id: "c20", lane: 0, col: 10, type: "terminal", title: "Done (Layanan Dedicated Aktif)", description: "Koneksi internet dedicated B2B resmi beroperasi penuh dengan jaminan SLA 99.5% dan dukungan NOC 24/7.", output: "Layanan Dedicated Aktif", owner: "PIC Korporasi" },
    ],
    links: [
      ["c1", "c2", undefined, "b", "t"],
      ["c2", "c3", undefined, "b", "t"],
      ["c3", "c4", undefined, "r", "l"],
      ["c4", "c_hold", "Tidak", "t", "b"],
      ["c4", "c5", "Ya", "r", "l"],
      ["c5", "c6", undefined, "r", "l"],
      ["c6", "c7", undefined, "b", "t"],
      ["c7", "c6", "Revisi", "l", "l"],
      ["c7", "c8", "Ya", "r", "l"],
      ["c8", "c_mou", undefined, "b", "t"],
      ["c_mou", "c9", undefined, "r", "l"],
      ["c9", "c10", undefined, "b", "t"],
      ["c10", "c11", undefined, "b", "t"],
      ["c11", "c12", undefined, "r", "l"],
      ["c12", "c13", undefined, "b", "t"],
      ["c13", "c14", undefined, "r", "l"],
      ["c14", "c15", undefined, "r", "l"],
      ["c15", "c16", undefined, "t", "b"],
      ["c16", "c17", undefined, "r", "l"],
      ["c17", "c18", undefined, "t", "b"],
      ["c18", "c19", undefined, "t", "b"],
      ["c19", "c20", undefined, "r", "l"],
    ],
  },
  {
    id: "isp-trouble-ticket-flow",
    title: "Alur Penanganan Pelanggan Gangguan (ISP Incident & Restorasi)",
    description: "SOP resmi eskalasi tiket gangguan internet: skrining helpdesk, diagnostik NOC, serta 3 cabang spesialisasi (Backbone FO Cut, Fishbone LOS, dan Network Engineer Corporate/POP).",
    kind: "sop",
    orientation: "horizontal",
    companyName: "ZITLINE Internet Service Provider",
    companyLogo: "/brand/zitline-logo.svg",
    docCode: "SOP-GANGGUAN-01",
    wallpaper: "solid-zitline",
    lanes: [
      { title: "Customer", division: "Pelanggan Residensial & Korporat", color: "rose" },
      { title: "Customer Service", division: "Helpdesk & Customer Support", color: "amber" },
      { title: "Network Operation Center", division: "Monitoring & Core Network", color: "sky" },
      { title: "Backbone", division: "Tim Splicer & FO Cut Backbone", color: "violet" },
      { title: "Fishbone", division: "Tim Feeder & Distribusi Last-Mile LOS", color: "emerald" },
      { title: "Network Engineer", division: "Tim Engineer POP & Corporate Dedicated", color: "sky" },
    ],
    steps: [
      // Col 0: Pelaporan Awal
      {
        id: "g1",
        lane: 0,
        col: 0,
        type: "terminal",
        title: "Info Gangguan",
        description: "Pelanggan melaporkan gangguan layanan (koneksi mati, lampu indikator LOS merah, atau degradasi throughput) ke Helpdesk.",
        output: "Laporan Gangguan Masuk",
        owner: "Pelanggan",
      },
      {
        id: "g2",
        lane: 1,
        col: 0,
        type: "step",
        title: "FU Gangguan Awal",
        description: "Customer Service memverifikasi nomor pelanggan/kontrak, memeriksa status billing, dan memandu pemeriksaan fisik dasar perangkat modem.",
        output: "Log Skrining Awal",
        owner: "Customer Service",
      },

      // Col 1: Delegasi & Diagnostik Sistem
      {
        id: "g3",
        lane: 1,
        col: 1,
        type: "step",
        title: "Delegasi",
        description: "Customer Service menginput tiket keluhan ke sistem CRM dan mendelegasikan eskalasi teknis ke tim NOC.",
        output: "Tiket Delegasi CRM",
        owner: "Customer Service",
      },
      {
        id: "g4",
        lane: 2,
        col: 1,
        type: "step",
        title: "Pengecekan by System",
        description: "NOC melakukan diagnostik remote melalui NMS: memeriksa status OLT, telemetry optical power (dBm), alarm BGP, dan sesi radius.",
        output: "Hasil Telemetri NMS",
        owner: "NOC Engineer",
      },

      // Col 2: Decision Klasifikasi 3 Gangguan
      {
        id: "g5",
        lane: 2,
        col: 2,
        type: "decision",
        title: "Jenis Gangguan (Open Tiket)",
        description: "NOC mengidentifikasi akar masalah: apakah Indikasi FO Cut kabel utama, Indikasi LOS pelanggan, atau Gangguan POP/Corporate?",
      },

      // Col 3: Indikasi 3 Cabang
      {
        id: "g_fo",
        lane: 3,
        col: 3,
        type: "step",
        title: "Indikasi FO Cut",
        description: "NOC mendeteksi putusnya kabel fiber optik utama backbone antar-POP/gardu dan mendisposisikan ke Tim Backbone.",
        output: "Tiket Gangguan Backbone",
        owner: "Tim Backbone",
      },
      {
        id: "g_los",
        lane: 4,
        col: 3,
        type: "step",
        title: "Indikasi LOS",
        description: "NOC mengidentifikasi loss of signal pada kabel feeder distribusi atau drop cable pelanggan (Loss of Signal / LOS).",
        output: "Disposisi Tim Fishbone",
        owner: "Tim Fishbone",
      },
      {
        id: "g_corp",
        lane: 5,
        col: 3,
        type: "step",
        title: "Indikasi Gangguan POP/Corp.",
        description: "NOC mendeteksi kendala pada link B2B Dedicated Corporate atau gardu POP (Point of Presence).",
        output: "Disposisi Network Engineer",
        owner: "Network Engineer",
      },

      // Col 4: Penjadwalan
      {
        id: "g_fo_jadwal",
        lane: 3,
        col: 4,
        type: "step",
        title: "Penjadwalan Perbaikan",
        description: "Tim Backbone menjadwalkan mobilisasi tim lapangan, alat ukur OTDR jarak jauh, dan mesin Fusion Splicer.",
        output: "Jadwal Penanganan FO",
        owner: "Tim Backbone",
      },
      {
        id: "g_los_jadwal",
        lane: 4,
        col: 4,
        type: "step",
        title: "Penjadwalan Perbaikan",
        description: "Tim Fishbone menyiapkan surat perintah kerja dan alokasi teknisi last-mile.",
        output: "SPK Lapangan",
        owner: "Tim Fishbone",
      },
      {
        id: "g_corp_jadwal",
        lane: 5,
        col: 4,
        type: "step",
        title: "Penjadwalan Perbaikan",
        description: "Network Engineer menyiapkan modul SFP cadangan, router/switch manage, dan peralatan pengujian RFC-2544.",
        output: "Jadwal & Spare Part Siap",
        owner: "Network Engineer",
      },

      // Col 5: Kunjungan / Komunikasi
      {
        id: "g_fo_kunj",
        lane: 3,
        col: 5,
        type: "step",
        title: "Kunjungan ke Lokasi Gangguan",
        description: "Tim Splicer Backbone meluncur ke koordinat titik putus sesuai hasil pengukuran OTDR.",
        output: "Tim Tiba di Lokasi",
        owner: "Tim Backbone",
      },
      {
        id: "g_los_kom",
        lane: 4,
        col: 5,
        type: "step",
        title: "Komunikasi dengan Pelanggan",
        description: "Teknisi menghubungi pelanggan untuk konfirmasi ketersediaan di tempat dan perkiraan waktu tiba.",
        output: "Konfirmasi Janji Temu",
        owner: "Tim Fishbone",
      },
      {
        id: "g_corp_kom",
        lane: 5,
        col: 5,
        type: "step",
        title: "Komunikasi dengan Pelanggan",
        description: "Engineer berkoordinasi langsung dengan PIC IT Korporasi untuk maintenance window atau inspeksi gardu POP.",
        output: "Koordinasi PIC Selesai",
        owner: "Network Engineer",
      },

      // Col 6: Eskalasi 1 / Kunjungan Lapangan
      {
        id: "g_fo_esk1",
        lane: 3,
        col: 6,
        type: "step",
        title: "Eskalasi Gangguan Ke-1",
        description: "Laporan ditemukan titik gangguan fisik di lapangan (misal: kabel tertabrak kendaraan / galian utilitas).",
        output: "Laporan Titik Gangguan",
        owner: "Tim Backbone",
      },
      {
        id: "g_cs_upd1",
        lane: 1,
        col: 6,
        type: "step",
        title: "Update Eskalasi Perbaikan",
        description: "Customer Service mencatat temuan titik gangguan di tiket CRM.",
        output: "Update Tiket CRM",
        owner: "Customer Service",
      },
      {
        id: "g_cust_inf1",
        lane: 0,
        col: 6,
        type: "step",
        title: "Menerima Informasi Gangguan",
        description: "Pelanggan menerima update bahwa titik gangguan telah ditemukan.",
        output: "Notifikasi Pelanggan",
        owner: "Pelanggan",
      },
      {
        id: "g_los_kunj",
        lane: 4,
        col: 6,
        type: "step",
        title: "Kunjungan ke Rumah Pelanggan",
        description: "Teknisi tiba di lokasi pelanggan dan melakukan inspeksi visual tiang ODP serta kabel drop core.",
        output: "Inspeksi Fisik ODP & ONT",
        owner: "Tim Fishbone",
      },
      {
        id: "g_corp_kunj",
        lane: 5,
        col: 6,
        type: "step",
        title: "Kunjungan ke Lokasi Gangguan",
        description: "Engineer tiba di ruang server klien atau shelter POP untuk memeriksa perangkat aktif dan power.",
        output: "Pemeriksaan Rack/Shelter",
        owner: "Network Engineer",
      },

      // Col 7: Eskalasi 2 / Perbaikan Fisik
      {
        id: "g_fo_esk2",
        lane: 3,
        col: 7,
        type: "step",
        title: "Eskalasi Gangguan Ke-2",
        description: "Laporan progress perbaikan: penarikan kabel pengganti dan proses penyambungan core (splicing closure).",
        output: "Laporan Progress Splicing",
        owner: "Tim Backbone",
      },
      {
        id: "g_cs_upd2",
        lane: 1,
        col: 7,
        type: "step",
        title: "Update Progress Perbaikan",
        description: "Customer Service memperbarui estimasi selesai pekerjaan di CRM.",
        output: "Status Progres CRM",
        owner: "Customer Service",
      },
      {
        id: "g_cust_inf2",
        lane: 0,
        col: 7,
        type: "step",
        title: "Menerima Informasi Gangguan",
        description: "Pelanggan menerima update estimasi pemulihan sambungan kabel.",
        output: "Notifikasi Pelanggan",
        owner: "Pelanggan",
      },
      {
        id: "g_los_perb",
        lane: 4,
        col: 7,
        type: "step",
        title: "Perbaikan",
        description: "Penggantian fast connector, splicing ulang drop wire, atau penggantian unit adaptor/modem ONT.",
        output: "Sinyal Optik Pulih (dBm)",
        owner: "Tim Fishbone",
      },
      {
        id: "g_corp_perb",
        lane: 5,
        col: 7,
        type: "step",
        title: "Perbaikan",
        description: "Penggantian unit switch/SFP, perbaikan power supply UPS, atau re-konfigurasi routing BGP/VLAN.",
        output: "Link B2B Aktif UP",
        owner: "Network Engineer",
      },

      // Col 8: Eskalasi 3 / Dokumentasi Perbaikan
      {
        id: "g_fo_esk3",
        lane: 3,
        col: 8,
        type: "step",
        title: "Eskalasi Gangguan Ke-3",
        description: "Laporan perbaikan selesai: seluruh core optik selesai disambung dan redaman kembali normal.",
        output: "Laporan Perbaikan Selesai",
        owner: "Tim Backbone",
      },
      {
        id: "g_cs_upd3",
        lane: 1,
        col: 8,
        type: "step",
        title: "Update Perbaikan Selesai",
        description: "Customer Service mengonfirmasi pekerjaan fisik telah selesai sepenuhnya.",
        output: "Status Selesai Lapangan",
        owner: "Customer Service",
      },
      {
        id: "g_cust_inf3",
        lane: 0,
        col: 8,
        type: "step",
        title: "Menerima Informasi Selesai",
        description: "Pelanggan menerima notifikasi bahwa perbaikan telah rampung.",
        output: "Notifikasi Pemulihan",
        owner: "Pelanggan",
      },
      {
        id: "g_los_dok",
        lane: 4,
        col: 8,
        type: "step",
        title: "Dokumentasi Perbaikan",
        description: "Teknisi mengambil foto hasil pengukuran redaman Power Meter dan meminta konfirmasi penyelesaian.",
        output: "Dokumentasi Foto & BAST",
        owner: "Tim Fishbone",
      },
      {
        id: "g_corp_dok",
        lane: 5,
        col: 8,
        type: "step",
        title: "Dokumentasi Perbaikan",
        description: "Engineer menyusun laporan uji latensi RFC-2544, grafik MRTG normal, dan BAST pekerjaan korporat.",
        output: "Laporan Teknis & BAST",
        owner: "Network Engineer",
      },

      // Col 9: Close Tiket & Done
      {
        id: "g_close",
        lane: 1,
        col: 9,
        type: "step",
        title: "Close Tiket",
        description: "Customer Service memverifikasi status normal dari seluruh divisi dan menutup tiket gangguan di sistem CRM.",
        output: "Tiket Status Closed",
        owner: "Customer Service",
      },
      {
        id: "g_done",
        lane: 0,
        col: 9,
        type: "terminal",
        title: "Done",
        description: "Layanan internet pelanggan aktif dan beroperasi normal kembali 100%.",
        output: "Layanan Normal 100%",
        owner: "Pelanggan",
      },
    ],
    links: [
      ["g1", "g2", undefined, "b", "t"],
      ["g2", "g3", undefined, "r", "l"],
      ["g3", "g4", undefined, "b", "t"],
      ["g4", "g5", undefined, "r", "l"],

      // 3 Cabang dari Decision
      ["g5", "g_fo", "FO Cut", "b", "l"],
      ["g5", "g_los", "LOS", "b", "l"],
      ["g5", "g_corp", "POP/Corp", "b", "l"],

      // Cabang 1: Backbone FO Cut
      ["g_fo", "g_fo_jadwal", undefined, "r", "l"],
      ["g_fo_jadwal", "g_fo_kunj", undefined, "r", "l"],
      ["g_fo_kunj", "g_fo_esk1", undefined, "r", "l"],
      ["g_fo_esk1", "g_cs_upd1", undefined, "t", "b"],
      ["g_cs_upd1", "g_cust_inf1", undefined, "t", "b"],
      ["g_fo_esk1", "g_fo_esk2", undefined, "r", "l"],
      ["g_fo_esk2", "g_cs_upd2", undefined, "t", "b"],
      ["g_cs_upd2", "g_cust_inf2", undefined, "t", "b"],
      ["g_fo_esk2", "g_fo_esk3", undefined, "r", "l"],
      ["g_fo_esk3", "g_cs_upd3", undefined, "t", "b"],
      ["g_cs_upd3", "g_cust_inf3", undefined, "t", "b"],
      ["g_fo_esk3", "g_close", undefined, "r", "l"],

      // Cabang 2: Fishbone LOS
      ["g_los", "g_los_jadwal", undefined, "r", "l"],
      ["g_los_jadwal", "g_los_kom", undefined, "r", "l"],
      ["g_los_kom", "g_los_kunj", undefined, "r", "l"],
      ["g_los_kunj", "g_los_perb", undefined, "r", "l"],
      ["g_los_perb", "g_los_dok", undefined, "r", "l"],
      ["g_los_dok", "g_close", undefined, "r", "l"],

      // Cabang 3: Network Engineer Corporate/POP
      ["g_corp", "g_corp_jadwal", undefined, "r", "l"],
      ["g_corp_jadwal", "g_corp_kom", undefined, "r", "l"],
      ["g_corp_kom", "g_corp_kunj", undefined, "r", "l"],
      ["g_corp_kunj", "g_corp_perb", undefined, "r", "l"],
      ["g_corp_perb", "g_corp_dok", undefined, "r", "l"],
      ["g_corp_dok", "g_close", undefined, "r", "l"],

      // Penutupan
      ["g_close", "g_done", undefined, "t", "b"],
    ],
  },
  {
    id: "hr-overshift-flow",
    title: "Alur Pengajuan Over Shift (Zitline Talenta)",
    description: "SOP resmi pengajuan tukar shift/lembur over shift: konfirmasi awal ke SPV, input pengajuan di Talenta (wajib menyertakan rekan pengganti), peninjauan SPV, validasi HRD, dan approval Direksi.",
    kind: "sop",
    orientation: "horizontal",
    companyName: "ZITLINE Internet Service Provider",
    companyLogo: "/brand/zitline-logo.svg",
    docCode: "SOP-HR-OVERSHIFT-01",
    wallpaper: "solid-zitline",
    lanes: [
      { title: "Personal", division: "Karyawan / Pemohon Shift", color: "rose" },
      { title: "SPV", division: "Supervisor Operasional", color: "sky" },
      { title: "HRD", division: "Human Resources & Payroll", color: "violet" },
      { title: "Direksi", division: "Direksi / Management Approval", color: "emerald" },
    ],
    steps: [
      { id: "os_start", lane: 0, col: 0, type: "terminal", title: "Pengajuan Over Shift", description: "Personal mengajukan permohonan pertukaran/penambahan jam kerja shift operasional." },
      { id: "os_hub_spv", lane: 0, col: 1, type: "step", title: "Menghubungi SPV", description: "Personal wajib mengonfirmasi dan meminta izin kepada SPV terlebih dahulu serta memastikan rekan pengganti shift sudah sepakat.", owner: "Personal", output: "Izin Lisan / Chat SPV" },
      { id: "os_talenta", lane: 0, col: 2, type: "step", title: "Pengajuan di Talenta", description: "Personal menginput permohonan Over Shift pada aplikasi Talenta (wajib menyertakan rekan pengganti dari tim terkait).", owner: "Personal", output: "Tiket Over Shift Talenta" },
      { id: "os_spv_dec", lane: 1, col: 3, type: "decision", title: "Peninjauan SPV?", description: "SPV meninjau kesiapan rekan pengganti dan memastikan pengajuan sudah berkoordinasi sebelumnya." },
      { id: "os_spv_rej", lane: 1, col: 2, type: "step", title: "Reject Pengajuan", description: "SPV berhak menolak jika pengajuan dilakukan tanpa konfirmasi terlebih dahulu atau tidak ada rekan pengganti.", owner: "SPV", output: "Tiket Status Rejected" },
      { id: "os_spv_app", lane: 1, col: 4, type: "step", title: "Approve SPV", description: "SPV menyetujui pengajuan over shift di Talenta dan meneruskan proses ke HRD.", owner: "SPV", output: "Status Approved SPV" },
      { id: "os_hrd_dec", lane: 2, col: 4, type: "decision", title: "Peninjauan HRD?", description: "HRD memvalidasi batas akumulasi jam lembur bulanan dan kepatuhan roster shift." },
      { id: "os_hrd_rev", lane: 2, col: 3, type: "step", title: "Konfirmasi Ulang ke SPV", description: "HRD mengembalikan tiket ke SPV jika terdapat bentrok jadwal atau batas jam lembur terlampaui.", owner: "HRD", output: "Catatan Klarifikasi HRD" },
      { id: "os_dir_dec", lane: 3, col: 4, type: "decision", title: "Peninjauan Direksi?", description: "Direksi meninjau permohonan kompensasi biaya over shift." },
      { id: "os_dir_rej", lane: 3, col: 3, type: "step", title: "Reject Direksi", description: "Direksi menolak permohonan over shift operasional.", owner: "Direksi", output: "Tiket Status Rejected" },
      { id: "os_dir_app", lane: 3, col: 5, type: "step", title: "Approve Direksi", description: "Direksi memberikan persetujuan final di sistem Talenta.", owner: "Direksi", output: "Approval Sah Direksi" },
      { id: "os_done", lane: 0, col: 6, type: "terminal", title: "Over Shift Resmi Terjadwal", description: "Jadwal over shift resmi aktif di roster dan tercatat otomatis pada kalkulasi payroll.", owner: "Personal & HRD", output: "Roster Shift Final" },
    ],
    links: [
      ["os_start", "os_hub_spv", undefined, "r", "l"],
      ["os_hub_spv", "os_talenta", undefined, "r", "l"],
      ["os_talenta", "os_spv_dec", undefined, "r", "t"],
      ["os_spv_dec", "os_spv_rej", "No", "l", "r"],
      ["os_spv_dec", "os_spv_app", "Yes", "r", "l"],
      ["os_spv_app", "os_hrd_dec", undefined, "b", "t"],
      ["os_hrd_dec", "os_hrd_rev", "No", "l", "r"],
      ["os_hrd_rev", "os_spv_dec", undefined, "t", "b"],
      ["os_hrd_dec", "os_dir_dec", "Yes", "b", "t"],
      ["os_dir_dec", "os_dir_rej", "No", "l", "r"],
      ["os_dir_dec", "os_dir_app", "Yes", "r", "l"],
      ["os_dir_app", "os_done", undefined, "r", "l"],
    ],
  },
  {
    id: "hr-sakit-flow",
    title: "Alur Pengajuan Izin Sakit (Zitline Talenta)",
    description: "SOP resmi pengajuan cuti sakit: koordinasi awal ke SPV, input di Talenta wajib melampirkan surat dokter/bidan asli untuk pribadi (bukan keluarga), review SPV, validasi HRD, dan approval Direksi.",
    kind: "sop",
    orientation: "horizontal",
    companyName: "ZITLINE Internet Service Provider",
    companyLogo: "/brand/zitline-logo.svg",
    docCode: "SOP-HR-SAKIT-02",
    wallpaper: "solid-zitline",
    lanes: [
      { title: "Personal", division: "Karyawan / Pasien", color: "rose" },
      { title: "SPV", division: "Supervisor Divisi", color: "sky" },
      { title: "HRD", division: "Human Resources & Medis", color: "violet" },
      { title: "Direksi", division: "Direksi / Management Approval", color: "emerald" },
    ],
    steps: [
      { id: "s_start", lane: 0, col: 0, type: "terminal", title: "Pengajuan Cuti Sakit", description: "Personal berhalangan hadir bekerja karena kondisi sakit." },
      { id: "s_hub_spv", lane: 0, col: 1, type: "step", title: "Menghubungi SPV", description: "Personal wajib mengabari SPV sebelum jam shift dimulai bahwa yang bersangkutan sakit.", owner: "Personal", output: "Notifikasi Sakit Awal" },
      { id: "s_talenta", lane: 0, col: 2, type: "step", title: "Pengajuan di Talenta (Surat Dokter)", description: "Personal menginput izin sakit di Talenta dengan WAJIB melampirkan surat dokter/bidan asli (khusus pribadi karyawan, bukan keluarga).", owner: "Personal", output: "Lampiran Surat Dokter Asli" },
      { id: "s_spv_dec", lane: 1, col: 3, type: "decision", title: "Peninjauan SPV?", description: "SPV meninjau apakah pengajuan telah dikonfirmasi dan bukti surat dokter terlampir." },
      { id: "s_spv_rej", lane: 1, col: 2, type: "step", title: "Reject Pengajuan", description: "SPV berhak menolak jika pengajuan tanpa konfirmasi terlebih dahulu atau surat dokter tidak valid.", owner: "SPV", output: "Tiket Status Rejected" },
      { id: "s_spv_app", lane: 1, col: 4, type: "step", title: "Approve SPV", description: "SPV menyetujui izin sakit di Talenta dan meneruskan berkas ke HRD.", owner: "SPV", output: "Status Approved SPV" },
      { id: "s_hrd_dec", lane: 2, col: 4, type: "decision", title: "Peninjauan HRD?", description: "HRD memverifikasi keaslian surat dokter/bidan dan memastikan hanya untuk pribadi karyawan." },
      { id: "s_hrd_rev", lane: 2, col: 3, type: "step", title: "Konfirmasi Ulang ke SPV", description: "HRD meminta klarifikasi ke SPV jika masa istirahat dokter berbeda dengan tanggal absen.", owner: "HRD", output: "Catatan Klarifikasi HRD" },
      { id: "s_dir_dec", lane: 3, col: 4, type: "decision", title: "Peninjauan Direksi?", description: "Direksi meninjau rekapitulasi izin sakit karyawan." },
      { id: "s_dir_rej", lane: 3, col: 3, type: "step", title: "Reject Direksi", description: "Direksi menolak permohonan izin sakit.", owner: "Direksi", output: "Tiket Status Rejected" },
      { id: "s_dir_app", lane: 3, col: 5, type: "step", title: "Approve Direksi", description: "Direksi memberikan persetujuan resmi izin sakit pada sistem Talenta.", owner: "Direksi", output: "Approval Sah Direksi" },
      { id: "s_done", lane: 0, col: 6, type: "terminal", title: "Izin Sakit Terverifikasi", description: "Izin sakit tercatat resmi di Talenta tanpa memotong saldo cuti tahunan.", owner: "Personal & HRD", output: "Status Sakit Terverifikasi" },
    ],
    links: [
      ["s_start", "s_hub_spv", undefined, "r", "l"],
      ["s_hub_spv", "s_talenta", undefined, "r", "l"],
      ["s_talenta", "s_spv_dec", undefined, "r", "t"],
      ["s_spv_dec", "s_spv_rej", "No", "l", "r"],
      ["s_spv_dec", "s_spv_app", "Yes", "r", "l"],
      ["s_spv_app", "s_hrd_dec", undefined, "b", "t"],
      ["s_hrd_dec", "s_hrd_rev", "No", "l", "r"],
      ["s_hrd_rev", "s_spv_dec", undefined, "t", "b"],
      ["s_hrd_dec", "s_dir_dec", "Yes", "b", "t"],
      ["s_dir_dec", "s_dir_rej", "No", "l", "r"],
      ["s_dir_dec", "s_dir_app", "Yes", "r", "l"],
      ["s_dir_app", "s_done", undefined, "r", "l"],
    ],
  },
  {
    id: "hr-cuti-tahunan-flow",
    title: "Alur Pengajuan Cuti Tahunan (Zitline Talenta)",
    description: "SOP resmi pengajuan cuti tahunan: izin/konfirmasi awal ke SPV (maksimal 2 orang per divisi bersamaan agar operasional aman), pengajuan di Talenta, peninjauan SPV, validasi sisa kuota HRD, dan approval Direksi.",
    kind: "sop",
    orientation: "horizontal",
    companyName: "ZITLINE Internet Service Provider",
    companyLogo: "/brand/zitline-logo.svg",
    docCode: "SOP-HR-CUTI-03",
    wallpaper: "solid-zitline",
    lanes: [
      { title: "Personal", division: "Karyawan / Pemohon Cuti", color: "rose" },
      { title: "SPV", division: "Supervisor Operasional", color: "sky" },
      { title: "HRD", division: "Human Resources & Kuota Cuti", color: "violet" },
      { title: "Direksi", division: "Direksi / Management Approval", color: "emerald" },
    ],
    steps: [
      { id: "c_start", lane: 0, col: 0, type: "terminal", title: "Pengajuan Cuti Tahunan", description: "Personal mengajukan hak cuti tahunan dengan tetap menjaga kelancaran operasional." },
      { id: "c_hub_spv", lane: 0, col: 1, type: "step", title: "Menghubungi SPV", description: "Personal wajib konfirmasi ke SPV terlebih dahulu dikarenakan menyangkut jadwal agenda operasional perusahaan.", owner: "Personal", output: "Kesepakatan Tanggal Cuti" },
      { id: "c_talenta", lane: 0, col: 2, type: "step", title: "Pengajuan di Talenta", description: "Personal mengajukan cuti tahunan di aplikasi Talenta sesuai tanggal yang telah dikonfirmasi.", owner: "Personal", output: "Tiket Cuti Talenta" },
      { id: "c_spv_dec", lane: 1, col: 3, type: "decision", title: "Peninjauan SPV?", description: "SPV memeriksa jadwal (berhak menolak jika pengajuan lebih dari 2 orang dalam 1 divisi di waktu bersamaan)." },
      { id: "c_spv_rej", lane: 1, col: 2, type: "step", title: "Reject Pengajuan", description: "SPV menolak cuti karena kuota divisi penuh (>2 orang cuti bersamaan) atau tanpa konfirmasi terlebih dahulu.", owner: "SPV", output: "Tiket Status Rejected" },
      { id: "c_spv_app", lane: 1, col: 4, type: "step", title: "Approve SPV", description: "SPV menyetujui pengajuan cuti di Talenta dan meneruskan ke HRD.", owner: "SPV", output: "Status Approved SPV" },
      { id: "c_hrd_dec", lane: 2, col: 4, type: "decision", title: "Peninjauan HRD?", description: "HRD memeriksa saldo sisa cuti tahunan karyawan dan masa kerja aktif." },
      { id: "c_hrd_rev", lane: 2, col: 3, type: "step", title: "Konfirmasi Ulang ke SPV", description: "HRD mengonfirmasi ke SPV jika sisa kuota cuti karyawan tidak mencukupi atau ada perubahan jadwal.", owner: "HRD", output: "Catatan Klarifikasi HRD" },
      { id: "c_dir_dec", lane: 3, col: 4, type: "decision", title: "Peninjauan Direksi?", description: "Direksi meninjau permohonan cuti tahunan." },
      { id: "c_dir_rej", lane: 3, col: 3, type: "step", title: "Reject Direksi", description: "Direksi menolak permohonan cuti tahunan.", owner: "Direksi", output: "Tiket Status Rejected" },
      { id: "c_dir_app", lane: 3, col: 5, type: "step", title: "Approve Direksi", description: "Direksi menyetujui permohonan cuti tahunan di sistem Talenta.", owner: "Direksi", output: "Approval Sah Direksi" },
      { id: "c_done", lane: 0, col: 6, type: "terminal", title: "Cuti Disetujui (Done)", description: "Status cuti resmi aktif di sistem Talenta dan kuota cuti tahunan karyawan terpotong otomatis.", owner: "Personal & HRD", output: "Status Cuti Sah Aktif" },
    ],
    links: [
      ["c_start", "c_hub_spv", undefined, "r", "l"],
      ["c_hub_spv", "c_talenta", undefined, "r", "l"],
      ["c_talenta", "c_spv_dec", undefined, "r", "t"],
      ["c_spv_dec", "c_spv_rej", "No", "l", "r"],
      ["c_spv_dec", "c_spv_app", "Yes", "r", "l"],
      ["c_spv_app", "c_hrd_dec", undefined, "b", "t"],
      ["c_hrd_dec", "c_hrd_rev", "No", "l", "r"],
      ["c_hrd_rev", "c_spv_dec", undefined, "t", "b"],
      ["c_hrd_dec", "c_dir_dec", "Yes", "b", "t"],
      ["c_dir_dec", "c_dir_rej", "No", "l", "r"],
      ["c_dir_dec", "c_dir_app", "Yes", "r", "l"],
      ["c_dir_app", "c_done", undefined, "r", "l"],
    ],
  },
  {
    id: "saas-database-erd",
    title: "Skema Database & ERD SaaS (PostgreSQL / Prisma)",
    description: "Arsitektur database relasional multi-tenant: Users, Workspaces, Memberships, Subscriptions, dan Audit Logs dengan Foreign Keys siap diekspor ke SQL DDL.",
    kind: "architect",
    lanes: [],
    steps: [
      {
        id: "users",
        lane: 0,
        col: 0,
        title: "users",
        description: "id (UUID PK)\nemail (VARCHAR)\npassword_hash (VARCHAR)\nfull_name (VARCHAR)\ncreated_at (TIMESTAMP)",
        output: "Primary User Table",
      },
      {
        id: "sessions",
        lane: 1,
        col: 0,
        title: "sessions",
        description: "id (UUID PK)\nuser_id (UUID FK)\ntoken (VARCHAR)\nexpires_at (TIMESTAMP)",
        output: "Auth Session Tokens",
      },
      {
        id: "workspaces",
        lane: 0,
        col: 1,
        title: "workspaces",
        description: "id (UUID PK)\nname (VARCHAR)\nslug (VARCHAR)\nowner_id (UUID FK)\ncreated_at (TIMESTAMP)",
        output: "Tenant Workspace",
      },
      {
        id: "memberships",
        lane: 1,
        col: 1,
        title: "memberships",
        description: "id (UUID PK)\nworkspace_id (UUID FK)\nuser_id (UUID FK)\nrole (VARCHAR)\njoined_at (TIMESTAMP)",
        output: "RBAC Access Control",
      },
      {
        id: "subscriptions",
        lane: 0,
        col: 2,
        title: "subscriptions",
        description: "id (UUID PK)\nworkspace_id (UUID FK)\nplan (VARCHAR)\nstatus (VARCHAR)\ncurrent_period_end (TIMESTAMP)",
        output: "Billing Subscriptions",
      },
      {
        id: "audit_logs",
        lane: 1,
        col: 2,
        title: "audit_logs",
        description: "id (UUID PK)\nworkspace_id (UUID FK)\nuser_id (UUID FK)\naction (VARCHAR)\nip_address (VARCHAR)\ncreated_at (TIMESTAMP)",
        output: "Security Audit Trail",
      },
    ],
    links: [
      ["users", "sessions", "1:N (user_id)"],
      ["users", "workspaces", "1:N (owner_id)"],
      ["workspaces", "memberships", "1:N (workspace_id)"],
      ["users", "memberships", "1:N (user_id)"],
      ["workspaces", "subscriptions", "1:1 (workspace_id)"],
      ["workspaces", "audit_logs", "1:N (workspace_id)"],
    ],
  },
  {
    id: "billing-subscription-erd",
    title: "Database & ERD Billing SaaS (Subscriptions & Invoicing)",
    description: "Skema relasional lengkap untuk mesin billing aplikasi SaaS: Plans, Customers, Subscriptions, Invoices, Payments, dan Usage Records.",
    kind: "architect",
    lanes: [],
    steps: [
      {
        id: "plans",
        lane: 0,
        col: 0,
        title: "plans",
        description: "id (UUID PK)\ncode (VARCHAR)\nname (VARCHAR)\nprice_monthly (INTEGER)\ncurrency (VARCHAR)\nis_active (BOOLEAN)",
        output: "Catalog Pricing Plans",
      },
      {
        id: "customers",
        lane: 0,
        col: 1,
        title: "customers",
        description: "id (UUID PK)\nuser_id (UUID FK)\ngateway_customer_id (VARCHAR)\nbilling_email (VARCHAR)\ntax_id (VARCHAR)\ncreated_at (TIMESTAMP)",
        output: "Billing Customers",
      },
      {
        id: "payment_methods",
        lane: 0,
        col: 2,
        title: "payment_methods",
        description: "id (UUID PK)\ncustomer_id (UUID FK)\ntype (VARCHAR)\nbrand (VARCHAR)\nlast4 (VARCHAR)\nis_default (BOOLEAN)",
        output: "Saved Payment Cards",
      },
      {
        id: "subscriptions",
        lane: 1,
        col: 0,
        title: "subscriptions",
        description: "id (UUID PK)\ncustomer_id (UUID FK)\nplan_id (UUID FK)\nstatus (VARCHAR)\ncurrent_period_start (TIMESTAMP)\ncurrent_period_end (TIMESTAMP)\ncancel_at_period_end (BOOLEAN)",
        output: "Active Subscriptions",
      },
      {
        id: "usage_records",
        lane: 1,
        col: 1,
        title: "usage_records",
        description: "id (UUID PK)\nsubscription_id (UUID FK)\nmetric_name (VARCHAR)\nunits_consumed (INTEGER)\nrecorded_at (TIMESTAMP)",
        output: "Metered Consumption",
      },
      {
        id: "invoices",
        lane: 2,
        col: 0,
        title: "invoices",
        description: "id (UUID PK)\nsubscription_id (UUID FK)\ncustomer_id (UUID FK)\ninvoice_number (VARCHAR)\nsubtotal_amount (INTEGER)\ntax_amount (INTEGER)\ntotal_due (INTEGER)\nstatus (VARCHAR)\ndue_date (TIMESTAMP)",
        output: "Tax Invoices",
      },
      {
        id: "payments",
        lane: 2,
        col: 1,
        title: "payments",
        description: "id (UUID PK)\ninvoice_id (UUID FK)\namount_paid (INTEGER)\npayment_method (VARCHAR)\ngateway_charge_id (VARCHAR)\nstatus (VARCHAR)\npaid_at (TIMESTAMP)",
        output: "Settled Transactions",
      },
    ],
    links: [
      ["plans", "subscriptions", "1:N (plan_id)"],
      ["customers", "subscriptions", "1:N (customer_id)"],
      ["customers", "payment_methods", "1:N (customer_id)"],
      ["subscriptions", "invoices", "1:N (subscription_id)"],
      ["subscriptions", "usage_records", "1:N (subscription_id)"],
      ["invoices", "payments", "1:N (invoice_id)"],
    ],
  },
  {
    id: "microservice-architecture",
    title: "Arsitektur Microservices & Event Stream",
    description: "Desain sistem terdistribusi modern: API Gateway, Auth Service, Order Service, Kafka Broker, Redis Cache, dan PostgreSQL Database.",
    kind: "architect",
    lanes: [],
    steps: [
      { id: "client", lane: 0, col: 0, type: "terminal", title: "Web / Mobile Client", description: "Next.js Client & Flutter App" },
      { id: "gateway", lane: 0, col: 1, title: "API Gateway (Kong / Envoy)", description: "Rate limiting, JWT verify, & request routing" },
      { id: "auth_svc", lane: 0, col: 2, title: "Auth Service", description: "OAuth2, session tokens, & user RBAC" },
      { id: "order_svc", lane: 1, col: 1, title: "Order & Billing Service", description: "Checkout orchestration, Stripe webhooks" },
      { id: "kafka", lane: 1, col: 2, type: "decision", title: "Kafka Event Stream", description: "Topics: order.created, payment.succeeded" },
      { id: "redis", lane: 0, col: 3, title: "Redis Cluster", description: "Session cache, rate limit store, & idempotency" },
      { id: "notif_svc", lane: 1, col: 3, title: "Notification Service", description: "Transactional email (Resend), WhatsApp, & Push" },
      { id: "db_postgres", lane: 2, col: 2, type: "terminal", title: "PostgreSQL Database", description: "ACID transactions & relational persistence" },
    ],
    links: [
      ["client", "gateway", "HTTPS / WSS"],
      ["gateway", "auth_svc", "gRPC Verify"],
      ["gateway", "order_svc", "REST / gRPC"],
      ["order_svc", "kafka", "Publish Event"],
      ["kafka", "notif_svc", "Consume Event"],
      ["auth_svc", "redis", "Cache Session"],
      ["order_svc", "db_postgres", "ACID Write"],
    ],
  },
];

const TEMPLATE_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));
const BUILT_DOC_CACHE = new Map<string, FlowDocument>();

export function getTemplate(id: string) {
  return TEMPLATE_BY_ID.get(id);
}

/** Bangun dokumen diagram dari template (di-memoize di memori & di-clone agar bebas kalkulasi ulang). */
export function buildDocument(t: FlowTemplate, orientation?: Orientation): FlowDocument {
  const chosenOrientation = orientation ?? t.orientation ?? "vertical";
  const cacheKey = `${t.id}:${chosenOrientation}`;
  const cached = BUILT_DOC_CACHE.get(cacheKey);
  if (cached) return structuredClone(cached);
  const built = buildDocumentUncached(t, chosenOrientation);
  BUILT_DOC_CACHE.set(cacheKey, built);
  return structuredClone(built);
}

function buildDocumentUncached(t: FlowTemplate, orientation: Orientation = "vertical"): FlowDocument {
  // STUDIO 2 ARCHITECT: FREEFORM INFINITE CANVAS (TANPA JALUR SWIMLANE)
  if (t.kind === "architect" || t.lanes.length === 0) {
    const steps = t.steps.map((s, i) => {
      const data = {
        title: s.title,
        description: s.description ?? "",
        durationValue: s.duration?.[0] ?? null,
        durationUnit: s.duration?.[1] ?? ("menit" as const),
        output: s.output ?? "",
        owner: s.owner ?? "",
      };

      // Posisi 2D schema grid yang seimbang dan proporsional
      const col = s.col ?? (i % 3);
      const row = s.lane ?? Math.floor(i / 3);

      return {
        id: `n_${s.id}`,
        type: s.type ?? ("step" as const),
        position: {
          x: 80 + col * 600,
          y: 60 + row * 560,
        },
        data,
      };
    });

    const edges = t.links.map(([from, to, label, sourceHandle, targetHandle], i) => ({
      id: `e_${i}`,
      source: `n_${from}`,
      target: `n_${to}`,
      sourceHandle: sourceHandle ?? "r",
      targetHandle: targetHandle ?? "l",
      ...(label ? { label } : {}),
    }));

    return {
      version: 1,
      orientation: "horizontal",
      nodes: steps,
      edges,
    } as FlowDocument;
  }

  // STUDIO 1: SWIMLANE SOP DENGAN JALUR DIVISI
  const maxCol = Math.max(...t.steps.map((s) => s.col), 5);
  const calculatedWidth = Math.max(LANE_DEFAULT_WIDTH, FIRST_COL_X + maxCol * COL_GAP + STEP_WIDTH + 140);

  // Hitung estimasi ukuran tiap step terlebih dahulu agar tinggi tiap lane selalu muat untuk skala 2x
  const preparedSteps = t.steps.map((s) => {
    const data = {
      title: s.title,
      description: s.description ?? "",
      durationValue: null,
      durationUnit: "menit" as const,
      output: s.output ?? "",
      owner: s.owner ?? "",
    };
    const { w, h } = estimateNodeSize(s.type, data);
    return { spec: s, data, w, h };
  });

  const maxStepHeightByLane = new Map<number, number>();
  for (const item of preparedSteps) {
    const prev = maxStepHeightByLane.get(item.spec.lane) ?? 0;
    if (item.h > prev) maxStepHeightByLane.set(item.spec.lane, item.h);
  }

  let currentLaneY = 0;
  const laneHeights: number[] = [];
  const lanes = t.lanes.map((l, i) => {
    const laneH = Math.max(LANE_DEFAULT_HEIGHT, (maxStepHeightByLane.get(i) ?? 0) + 56);
    laneHeights[i] = laneH;
    const node = {
      id: `lane_${i}`,
      type: "lane" as const,
      position: { x: 0, y: currentLaneY },
      width: calculatedWidth,
      height: laneH,
      data: { title: l.title, division: l.division, color: l.color, icon: l.icon },
    };
    currentLaneY += laneH;
    return node;
  });

  const steps = preparedSteps.map(({ spec: s, data, w, h }) => {
    const laneH = laneHeights[s.lane] ?? LANE_DEFAULT_HEIGHT;
    return {
      id: `n_${s.id}`,
      type: s.type ?? ("step" as const),
      parentId: `lane_${s.lane}`,
      position: {
        x: FIRST_COL_X + s.col * COL_GAP + Math.round((STEP_WIDTH - w) / 2),
        y: Math.max(20, Math.round((laneH - h) / 2)),
      },
      data: {
        ...data,
        col: s.col,
      },
    };
  });

  const edges = t.links.map(([from, to, label, sourceHandle, targetHandle], i) => ({
    id: `e_${i}`,
    source: `n_${from}`,
    target: `n_${to}`,
    sourceHandle: sourceHandle ?? "r",
    targetHandle: targetHandle ?? "l",
    ...(label ? { label } : {}),
  }));

  const horizontal = {
    nodes: [...lanes, ...steps],
    edges,
    companyLogo: t.companyLogo ?? "",
    companyName: t.companyName ?? "",
    docCode: t.docCode ?? "",
    wallpaper: t.wallpaper ?? "default",
  };
  if (orientation === "horizontal") return { version: 1, orientation, ...horizontal } as FlowDocument;

  const converted = convertLayout(horizontal.nodes, horizontal.edges, "horizontal", "vertical");
  return {
    version: 1,
    orientation,
    companyLogo: t.companyLogo ?? "",
    companyName: t.companyName ?? "",
    docCode: t.docCode ?? "",
    wallpaper: t.wallpaper ?? "default",
    ...converted,
  } as FlowDocument;
}

import type { FlowDocument, LaneColor, Orientation } from "@/lib/validation/flow";
import { COL_GAP, FIRST_COL_X, LANE_DEFAULT_HEIGHT, LANE_DEFAULT_WIDTH, STEP_WIDTH, convertLayout, estimateNodeSize } from "@/features/canvas/lib/layout";

type StepSpec = { id: string; lane: number; col: number; type?: "step" | "decision" | "terminal"; title: string; description?: string; duration?: [number, "menit" | "jam" | "hari"]; output?: string; owner?: string };

type LinkSpec = [string, string, string?, ("l" | "r" | "t" | "b")?, ("l" | "r" | "t" | "b")?];

export interface FlowTemplate {
  id: string;
  title: string;
  description: string;
  kind: "sop" | "journey";
  lanes: { title: string; division: string; color: LaneColor }[];
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
      { title: "Customer Success", division: "CS", color: "emerald" },
      { title: "Finance", division: "Keuangan", color: "amber" },
    ],
    steps: [
      { id: "a", lane: 0, col: 0, type: "terminal", title: "Mulai" },
      { id: "b", lane: 0, col: 1, title: "Mengisi form pendaftaran", duration: [10, "menit"], output: "Data pendaftaran" },
      { id: "c", lane: 1, col: 2, title: "Verifikasi & kualifikasi lead", owner: "Account Exec", duration: [1, "hari"] },
      { id: "d", lane: 3, col: 3, title: "Terbitkan invoice", output: "Invoice", duration: [2, "jam"] },
      { id: "e", lane: 0, col: 4, type: "decision", title: "Pembayaran diterima?" },
      { id: "f", lane: 2, col: 5, title: "Kickoff & setup akun", owner: "CSM", duration: [2, "hari"], output: "Akun aktif" },
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
    title: "Alur New Customer Retail (ISP FTTH)",
    description: "SOP resmi aktivasi internet residensial: registrasi pelanggan, validasi ODP, penarikan kabel drop core, aktivasi OLT, uji redaman, BAST, dan billing.",
    kind: "sop",
    lanes: [
      { title: "Customer", division: "Pelanggan Residensial", color: "rose" },
      { title: "Sales", division: "Tim Pemasaran", color: "sky" },
      { title: "Cust. Service", division: "Customer Service & Helpdesk", color: "violet" },
      { title: "T. Support", division: "Teknisi Lapangan (Field Engineer)", color: "emerald" },
      { title: "NOC", division: "Network Operations Center", color: "amber" },
      { title: "Finance", division: "Keuangan & Penagihan", color: "slate" },
    ],
    steps: [
      { id: "r1", lane: 0, col: 0, type: "terminal", title: "Kirim Data Registrasi", description: "Pelanggan mengisi formulir registrasi & share location rumah", output: "Form Registrasi & KTP" },
      { id: "r2", lane: 1, col: 1, title: "Input & Cek Coverage ODP", description: "Sales mengecek ketersediaan port ODP terdekat dan input data ke CRM", duration: [30, "menit"], owner: "Sales Officer" },
      { id: "r3", lane: 1, col: 2, type: "decision", title: "Port ODP Tersedia?", description: "Validasi apakah ada kapasitas port fiber optik dalam radius 150m" },
      { id: "r_hold", lane: 1, col: 3, title: "Input Waiting List", description: "Simpan data pelanggan dalam waiting list ekspansi jaringan & beri notifikasi", output: "Status Waiting List" },
      { id: "r4", lane: 2, col: 3, title: "Create Customer ID", description: "CS membuat identitas pelanggan resmi di sistem billing & CRM", duration: [15, "menit"], output: "Customer ID", owner: "Customer Service" },
      { id: "r5", lane: 3, col: 4, title: "Penjadwalan & Installasi", description: "Teknisi menjadwalkan kunjungan, penarikan kabel drop core, dan pasang ONT", duration: [2, "jam"], owner: "Teknisi Lapangan" },
      { id: "r6", lane: 4, col: 5, title: "Aktivasi Port OLT & PPPoE", description: "NOC mendaftarkan serial number ONT ke OLT & membuat profil akun PPPoE", duration: [15, "menit"], owner: "NOC Engineer", output: "IP & Akun Aktif" },
      { id: "r7", lane: 3, col: 6, title: "Cek Redaman & Koneksi", description: "Teknisi mengukur optical power loss (maks -23 dBm) dan speed test", duration: [20, "menit"], owner: "Teknisi Lapangan" },
      { id: "r8", lane: 3, col: 7, type: "decision", title: "Koneksi Stabil & Redaman OK?", description: "Verifikasi kestabilan koneksi internet dan kualitas sinyal fiber optik" },
      { id: "r9", lane: 3, col: 8, title: "Tanda Tangan Berita Acara", description: "Pelanggan dan teknisi menandatangani Berita Acara Serah Terima (BAST)", output: "Form BAST Fisik/Digital" },
      { id: "r10", lane: 2, col: 9, title: "Arsip Berkas BAST", description: "CS mengarsipkan BAST fisik/digital dan update status menjadi Active", output: "Arsip Terverifikasi" },
      { id: "r11", lane: 5, col: 10, title: "Penerbitan Tagihan (Invoice)", description: "Finance menerbitkan tagihan biaya pemasangan & prorata iuran pertama", duration: [1, "jam"], output: "Invoice Pemasangan", owner: "Finance Billing" },
      { id: "r12", lane: 0, col: 11, title: "Penerimaan Layanan & Pembayaran", description: "KOREKSI DARI GAMBAR ASLI: Pelanggan menerima layanan aktif dan membayar tagihan (bukan kirim data ulang!)", output: "Bukti Pembayaran" },
      { id: "r13", lane: 0, col: 12, type: "terminal", title: "Done (Internet Aktif)", description: "Pelanggan dapat berselancar di internet dengan koneksi stabil." },
    ],
    links: [
      ["r1", "r2"],
      ["r2", "r3"],
      ["r3", "r_hold", "Tidak", "t", "l"],
      ["r3", "r4", "Ya", "b", "l"],
      ["r4", "r5"],
      ["r5", "r6"],
      ["r6", "r7"],
      ["r7", "r8"],
      ["r8", "r7", "Tidak (Splicing Ulang)", "b", "b"],
      ["r8", "r9", "Ya", "r", "l"],
      ["r9", "r10"],
      ["r10", "r11"],
      ["r11", "r12"],
      ["r12", "r13"],
    ],
  },
  {
    id: "isp-corporate-flow",
    title: "Alur New Customer Corporate (ISP B2B Dedicated)",
    description: "SOP internet korporat/dedicated: site survey, approval margin direksi, MOU kontrak di depan, pengadaan alat, instalasi Metro-E, uji latensi RFC-2544, BAST, dan billing siklus.",
    kind: "sop",
    lanes: [
      { title: "Customer", division: "PIC Perusahaan / Korporasi", color: "rose" },
      { title: "Sales", division: "B2B Account Executive", color: "sky" },
      { title: "Network Engineer", division: "Technical & Field Survey", color: "emerald" },
      { title: "Management", division: "Direksi / Commercial Approval", color: "amber" },
      { title: "Warehouse", division: "Logistik & Pengadaan Alat", color: "slate" },
      { title: "CS & Finance", division: "Admin Kontrak & Penagihan", color: "violet" },
      { title: "NOC", division: "Core Network Operations", color: "sky" },
    ],
    steps: [
      { id: "c1", lane: 0, col: 0, type: "terminal", title: "Permintaan Pasang Baru", description: "PIC Korporasi mengirim permintaan bandwidth dedicated (1:1), IP publik, dan garansi SLA 99.5%" },
      { id: "c2", lane: 1, col: 1, title: "Follow Up & Request Survey", description: "Sales menganalisis kebutuhan klien dan menerbitkan Work Order Site Survey", duration: [2, "jam"], owner: "Account Executive" },
      { id: "c3", lane: 2, col: 2, title: "Survey Kebutuhan Customer", description: "Network Engineer melakukan survey rute FO, Line of Sight (LOS), dan kapasitas switch", duration: [1, "hari"], owner: "Network Engineer" },
      { id: "c4", lane: 2, col: 3, type: "decision", title: "Hasil Survey Layak (RFS)?", description: "Apakah lokasi dapat dijangkau secara teknis dan ekonomis?" },
      { id: "c_hold", lane: 1, col: 4, title: "Hold Data Waiting List", description: "Sales menginformasikan kendala teknis atau mencari solusi alternatif", output: "Status Hold" },
      { id: "c5", lane: 2, col: 4, title: "Informasi Kebutuhan & BoQ", description: "Engineer menyusun Bill of Quantity (BoQ) material dan estimasi biaya penarikan kabel", output: "BoQ & Topologi" },
      { id: "c6", lane: 1, col: 5, title: "Buat Penawaran (Quotation)", description: "Sales menyusun surat penawaran harga resmi lengkap dengan spesifikasi SLA", output: "Proposal Penawaran" },
      { id: "c7", lane: 3, col: 6, type: "decision", title: "Persetujuan Manajemen?", description: "Direksi meninjau kelayakan margin profit dan diskon harga kontrak" },
      { id: "c8", lane: 0, col: 7, title: "Konfirmasi & Isi Form Langganan", description: "Klien mengonfirmasi persetujuan penawaran dan melengkapi form pemesanan", output: "Form Langganan" },
      { id: "c_mou", lane: 1, col: 8, title: "Buat & TTD MOU Kontrak", description: "KOREKSI UTAMA: Penandatanganan kontrak/MOU dilakukan di awal SEBELUM pembelian alat berbiaya tinggi!", output: "MOU / Kontrak Sah" },
      { id: "c9", lane: 1, col: 9, title: "Form Order Kebutuhan Alat", description: "Sales menerbitkan form order pengambilan alat ke gudang sesuai BoQ", output: "Form Order Alat" },
      { id: "c10", lane: 4, col: 10, title: "Pembelian / Alokasi Alat", description: "Warehouse menyiapkan Router Core, SFP module, dan perangkat radio/switch", duration: [1, "hari"], owner: "Warehouse Officer" },
      { id: "c11", lane: 5, col: 11, title: "Create Customer ID", description: "Admin mendaftarkan akun korporat dan konfigurasi profil billing", output: "Customer ID" },
      { id: "c12", lane: 2, col: 12, title: "Instalasi Jaringan On-Site", description: "Tim teknis melakukan penarikan kabel FO/Radio, terminasi OTB, dan mounting rack", duration: [2, "hari"], owner: "Network Engineer" },
      { id: "c13", lane: 6, col: 13, title: "Aktivasi Port & Routing BGP", description: "NOC mengonfigurasi IP Public, routing BGP/Static, VLAN, dan monitoring MRTG", duration: [3, "jam"], owner: "NOC Engineer" },
      { id: "c14", lane: 2, col: 14, title: "Cek Koneksi & Report Instalasi", description: "Uji latensi, jitter, throughput (RFC 2544) dan penyusunan laporan teknis", output: "Laporan Uji Koneksi" },
      { id: "c15", lane: 2, col: 15, title: "Berita Acara Serah Terima", description: "Engineer menyusun Berita Acara (BAST) untuk diserahterimakan ke PIC klien", output: "BAST Draft" },
      { id: "c16", lane: 0, col: 16, title: "Validasi Layanan & TTD BAST", description: "PIC Klien menguji koneksi internet dedicated dan menandatangani BAST", output: "BAST Bertanda Tangan" },
      { id: "c17", lane: 5, col: 17, title: "Arsip Dokumen & Tagihan", description: "CS mengarsipkan BAST sah dan Finance menerbitkan tagihan invoice bulanan", duration: [1, "hari"], output: "Invoice Tagihan", owner: "Finance Corporate" },
      { id: "c18", lane: 1, col: 18, title: "Follow Up Tagihan", description: "Sales memastikan invoice diterima oleh bagian Accounting klien", owner: "Account Executive" },
      { id: "c19", lane: 0, col: 19, title: "Pembayaran Invoice", description: "Klien melakukan transfer pembayaran langganan ke rekening perusahaan", output: "Bukti Transfer" },
      { id: "c20", lane: 0, col: 20, type: "terminal", title: "Done (Layanan Dedicated Aktif)", description: "Koneksi internet dedicated B2B resmi beroperasi penuh sesuai SLA." },
    ],
    links: [
      ["c1", "c2"],
      ["c2", "c3"],
      ["c3", "c4"],
      ["c4", "c_hold", "Tidak", "t", "l"],
      ["c4", "c5", "Ya", "r", "l"],
      ["c5", "c6"],
      ["c6", "c7"],
      ["c7", "c8", "Ya", "r", "l"],
      ["c7", "c6", "Revisi", "b", "b"],
      ["c8", "c_mou"],
      ["c_mou", "c9"],
      ["c9", "c10"],
      ["c10", "c11"],
      ["c11", "c12"],
      ["c12", "c13"],
      ["c13", "c14"],
      ["c14", "c15"],
      ["c15", "c16"],
      ["c16", "c17"],
      ["c17", "c18"],
      ["c18", "c19"],
      ["c19", "c20"],
    ],
  },
];

export function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id);
}

/** Bangun dokumen diagram dari template dengan kalkulasi posisi & perataan node. Default: alur ke bawah. */
export function buildDocument(t: FlowTemplate, orientation: Orientation = "vertical"): FlowDocument {
  // Hitung max col untuk menentukan lebar dinamis lane agar tidak terpotong
  const maxCol = Math.max(...t.steps.map((s) => s.col), 7);
  const calculatedWidth = Math.max(LANE_DEFAULT_WIDTH, FIRST_COL_X + (maxCol + 1) * COL_GAP + 300);

  const lanes = t.lanes.map((l, i) => ({
    id: `lane_${i}`,
    type: "lane" as const,
    position: { x: 0, y: i * LANE_DEFAULT_HEIGHT },
    width: calculatedWidth,
    height: LANE_DEFAULT_HEIGHT,
    data: { title: l.title, division: l.division, color: l.color },
  }));

  const steps = t.steps.map((s) => {
    const data = {
      title: s.title,
      description: s.description ?? "",
      durationValue: s.duration?.[0] ?? null,
      durationUnit: s.duration?.[1] ?? ("menit" as const),
      output: s.output ?? "",
      owner: s.owner ?? "",
    };
    const { w, h } = estimateNodeSize(s.type, data);

    return {
      id: `n_${s.id}`,
      type: s.type ?? ("step" as const),
      parentId: `lane_${s.lane}`,
      position: {
        x: FIRST_COL_X + s.col * COL_GAP + Math.round((STEP_WIDTH - w) / 2),
        y: Math.round((LANE_DEFAULT_HEIGHT - h) / 2),
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

  const horizontal = { nodes: [...lanes, ...steps], edges };
  if (orientation === "horizontal") return { version: 1, orientation, ...horizontal } as FlowDocument;

  const converted = convertLayout(horizontal.nodes, horizontal.edges, "horizontal", "vertical");
  return { version: 1, orientation, ...converted } as FlowDocument;
}

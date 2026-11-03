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
      { title: "NOC", division: "Network Operations Center", color: "sky" },
      { title: "Finance", division: "Keuangan & Billing", color: "slate" },
    ],
    steps: [
      { id: "r1", lane: 0, col: 0, type: "step", title: "Registrasi Pelanggan Baru", description: "Pelanggan mengajukan pendaftaran pasang baru dan melengkapi data KTP serta share location rumah.", output: "Formulir Registrasi & KTP", owner: "Pelanggan" },
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
      { title: "NOC", division: "Network Operations Center", color: "sky" },
    ],
    steps: [
      { id: "c1", lane: 0, col: 0, type: "terminal", title: "Permintaan Pasang Baru", description: "PIC Korporasi mengirim formulir permohonan bandwidth dedicated (1:1), alokasi IP Publik, dan kebutuhan SLA 99.5%.", output: "Formulir Permohonan & KTP PIC", owner: "PIC Korporasi" },
      { id: "c2", lane: 1, col: 0, type: "step", title: "Follow Up & Request Survey", description: "Sales menganalisis kebutuhan bandwidth klien, menentukan kelayakan awal, dan menerbitkan Work Order Site Survey.", output: "Work Order Survey CRM", duration: [2, "jam"], owner: "Account Executive" },
      { id: "c3", lane: 2, col: 0, type: "step", title: "Survey Kebutuhan & Jalur FO", description: "Network Engineer melakukan survey rute kabel fiber optik, Line of Sight (LOS), tiang tumpu, dan kapasitas OTB/switch.", output: "Laporan Teknis Survey", duration: [1, "hari"], owner: "Network Engineer" },
      { id: "c4", lane: 2, col: 1, type: "decision", title: "Hasil Survey Layak (RFS)?", description: "Apakah lokasi klien dapat dijangkau secara teknis dan margin biaya penarikan kabel masuk dalam standar investasi ISP?" },
      { id: "c_hold", lane: 1, col: 1, type: "step", title: "Hold Data Waiting List", description: "Sales menginformasikan kendala teknis kepada klien dan mencatat data ke antrean ekspansi jaringan.", output: "Status Hold CRM", owner: "Account Executive" },
      { id: "c5", lane: 2, col: 2, type: "step", title: "Informasi Kebutuhan & BoQ", description: "Engineer menyusun Bill of Quantity (BoQ) material kabel FO/radio link, estimasi biaya penarikan, dan diagram topologi.", output: "BoQ Material & Topologi", owner: "Network Engineer" },
      { id: "c6", lane: 1, col: 2, type: "step", title: "Buat Penawaran (Quotation)", description: "Sales menyusun surat penawaran harga resmi B2B, skema biaya instalasi, dan Service Level Agreement (SLA).", output: "Proposal Penawaran Resmi", owner: "Account Executive" },
      { id: "c7", lane: 3, col: 2, type: "decision", title: "Persetujuan Manajemen?", description: "Direksi meninjau kelayakan margin profit, diskon harga kontrak jangka panjang, dan jadwal pengadaan material." },
      { id: "c8", lane: 0, col: 3, type: "step", title: "Konfirmasi & Isi Form Langganan", description: "Klien mengonfirmasi persetujuan penawaran harga dan melengkapi berkas legalitas perusahaan (NIB/NPWP).", output: "Form Langganan & Legalitas", owner: "PIC Korporasi" },
      { id: "c_mou", lane: 1, col: 3, type: "step", title: "Buat & TTD MOU Kontrak", description: "Sales dan Klien menandatangani Kontrak Perjanjian Kerjasama (PKS/MOU) bermeterai sah sebelum eksekusi pengadaan.", output: "Kontrak PKS / MOU Sah", owner: "Account Executive" },
      { id: "c9", lane: 1, col: 4, type: "step", title: "Form Order Kebutuhan Alat", description: "Sales menerbitkan form order pengeluaran perangkat ke bagian gudang logistik sesuai spesifikasi BoQ.", output: "Form Order Pengeluaran Alat", owner: "Account Executive" },
      { id: "c10", lane: 4, col: 4, type: "step", title: "Pembelian / Alokasi Alat", description: "Warehouse menyiapkan Router Core, SFP module, media converter gigabit, dan perangkat wireless/switch.", output: "Perangkat Siap Pasang", duration: [1, "hari"], owner: "Warehouse Officer" },
      { id: "c11", lane: 5, col: 4, type: "step", title: "Create Customer ID", description: "Admin mendaftarkan akun korporat di CRM billing, menginput nomor kontrak, dan menyiapkan akun profil pelanggan.", output: "Customer ID Resmi", owner: "Customer Service" },
      { id: "c12", lane: 2, col: 5, type: "step", title: "Instalasi Jaringan On-Site", description: "Tim teknis melakukan penarikan kabel drop FO, splicing joint closure, terminasi OTB, dan mounting rack router.", output: "Kabel FO & Perangkat Terpasang", duration: [2, "hari"], owner: "Network Engineer" },
      { id: "c13", lane: 6, col: 5, type: "step", title: "Aktivasi Port & Routing BGP", description: "NOC mengonfigurasi IP Public statis, peering routing BGP/Static, alokasi bandwidth dedicated, dan monitoring MRTG.", output: "Port Core & BGP Aktif", duration: [3, "jam"], owner: "NOC Engineer" },
      { id: "c14", lane: 2, col: 6, type: "step", title: "Uji Koneksi & Latensi RFC-2544", description: "Engineer menguji stabilitas latensi, jitter, throughput 1:1 (RFC 2544), dan menyusun laporan commissioning test.", output: "Laporan Uji Koneksi RFC-2544", owner: "Network Engineer" },
      { id: "c15", lane: 2, col: 7, type: "step", title: "Berita Acara (BAST)", description: "Engineer menyusun Berita Acara Serah Terima (BAST) pekerjaan instalasi fisik dan commissioning.", output: "Draft Dokumen BAST", owner: "Network Engineer" },
      { id: "c16", lane: 0, col: 7, type: "step", title: "Validasi Layanan & TTD BAST", description: "PIC Klien memvalidasi koneksi internet dedicated dan menandatangani BAST serah terima resmi.", output: "BAST Sah Bertanda Tangan", owner: "PIC Korporasi" },
      { id: "c17", lane: 5, col: 8, type: "step", title: "Arsip Dokumen & Tagihan", description: "CS mengarsipkan BAST sah dan Finance menerbitkan invoice pembayaran bulan pertama serta biaya instalasi.", output: "Invoice Tagihan Resmi", duration: [1, "hari"], owner: "Finance Corporate" },
      { id: "c18", lane: 1, col: 8, type: "step", title: "Follow Up Tagihan", description: "Sales memastikan dokumen invoice dan faktur pajak telah diterima dengan baik oleh bagian Finance klien.", owner: "Account Executive" },
      { id: "c19", lane: 0, col: 8, type: "step", title: "Pembayaran Invoice", description: "Klien melakukan transfer pembayaran invoice langganan ke rekening giro perusahaan ISP.", output: "Bukti Transfer / Receipt", owner: "PIC Korporasi" },
      { id: "c20", lane: 0, col: 9, type: "terminal", title: "Done (Layanan Dedicated Aktif)", description: "Koneksi internet dedicated B2B resmi beroperasi penuh dengan jaminan SLA 99.5% dan dukungan NOC 24/7.", output: "Layanan Dedicated Aktif", owner: "PIC Korporasi" },
    ],
    links: [
      ["c1", "c2", undefined, "b", "t"],
      ["c2", "c3", undefined, "b", "t"],
      ["c3", "c4", undefined, "r", "l"],
      ["c4", "c_hold", "Tidak", "t", "b"],
      ["c4", "c5", "Ya", "r", "l"],
      ["c5", "c6", undefined, "t", "b"],
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
      data: { title: l.title, division: l.division, color: l.color },
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

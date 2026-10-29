import { toPng } from "html-to-image";
import type { Orientation } from "@/lib/validation/flow";
import type { AppNode } from "../types";
import { useCanvasStore } from "../store/canvas-store";
import { LANE_DEFAULT_HEIGHT, LANE_DEFAULT_WIDTH, LANE_V_DEFAULT_LENGTH, LANE_V_WIDTH, absRect } from "./layout";

export type ExportFormat = "png" | "pdf";

const PADDING = 40;
const MAX_SIDE = 16000;
const MAX_PIXELS = 40_000_000;

export interface BrandingInfo {
  companyLogo?: string | null;
  companyName?: string | null;
  docCode?: string | null;
}

interface DiagramBounds {
  width: number;
  height: number;
}

/**
 * Menghitung area diagram dari seluruh lane + langkah (koordinat absolut).
 * - horizontal: lebar dipangkas sampai langkah terjauh (+ margin) agar tidak ada ruang kosong panjang.
 * - vertical  : tinggi dipangkas sampai langkah terbawah (+ margin).
 */
function computeDiagramBounds(nodes: AppNode[], orientation: Orientation): DiagramBounds {
  const lanes = nodes.filter((n) => n.type === "lane");
  const laneById = new Map<string, AppNode>(lanes.map((l) => [l.id, l]));
  const steps = nodes.filter((n) => n.type !== "lane");

  let lanesRight = 0;
  let lanesBottom = 0;
  for (const l of lanes) {
    const w = l.width ?? (orientation === "vertical" ? LANE_V_WIDTH : LANE_DEFAULT_WIDTH);
    const h = l.height ?? (orientation === "vertical" ? LANE_V_DEFAULT_LENGTH : LANE_DEFAULT_HEIGHT);
    lanesRight = Math.max(lanesRight, l.position.x + w);
    lanesBottom = Math.max(lanesBottom, l.position.y + h);
  }

  let contentRight = 0;
  let contentBottom = 0;
  for (const s of steps) {
    const r = absRect(s, laneById);
    contentRight = Math.max(contentRight, r.x + r.w);
    contentBottom = Math.max(contentBottom, r.y + r.h);
  }

  if (orientation === "vertical") {
    const h = contentBottom > 0 ? Math.min(lanesBottom, contentBottom + 64) : lanesBottom;
    return { width: Math.ceil(lanesRight), height: Math.ceil(Math.max(h, 320)) };
  }
  const w = contentRight > 0 ? Math.min(lanesRight, contentRight + 96) : lanesRight;
  return { width: Math.ceil(Math.max(w, 640)), height: Math.ceil(lanesBottom) };
}

interface Rendered {
  canvas: HTMLCanvasElement;
  width: number; // ukuran logis (px CSS) termasuk banner
  height: number;
  bgColor: string;
}

/** Render viewport React Flow ke canvas beresolusi tinggi + banner judul & logo perusahaan. */
async function render(
  nodes: AppNode[],
  title: string,
  orientation: Orientation,
  branding?: BrandingInfo,
): Promise<Rendered> {
  const viewportEl = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!viewportEl) throw new Error("Kanvas belum siap diekspor.");
  if (nodes.length === 0) throw new Error("Diagram masih kosong.");

  const bounds = computeDiagramBounds(nodes, orientation);
  const width = bounds.width + PADDING * 2;
  const height = bounds.height + PADDING * 2;

  const isLight = document.documentElement.classList.contains("light");
  const bgColor = isLight ? "#FFFFFF" : "#08090C";
  const fg = isLight ? "#0F172A" : "#F4F4F5";
  const muted = isLight ? "#64748B" : "#8B8D98";
  const line = isLight ? "#E2E8F0" : "#23252D";

  // Resolusi adaptif: setajam mungkin tanpa melewati batas canvas browser.
  const maxSide = Math.max(width, height);
  const pixelRatio = Math.max(1, Math.min(3, MAX_SIDE / maxSide, Math.sqrt(MAX_PIXELS / (width * height))));

  const dataUrl = await toPng(viewportEl, {
    width,
    height,
    pixelRatio,
    backgroundColor: bgColor,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${PADDING}px, ${PADDING}px) scale(1)`,
    },
    filter: (el) => {
      if (!(el instanceof HTMLElement)) return true;
      const c = el.classList;
      return (
        !c.contains("react-flow__resize-control") &&
        !c.contains("react-flow__handle") &&
        !c.contains("react-flow__controls") &&
        !c.contains("react-flow__minimap")
      );
    },
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Gagal memuat gambar hasil render."));
    img.src = dataUrl;
  });

  // Banner judul agar hasil ekspor langsung informatif dan beridentitas resmi.
  const bannerH = Math.max(104, Math.round(Math.min(width, 1800) * 0.065));
  const totalH = height + bannerH;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(totalH * pixelRatio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal menginisialisasi 2D canvas.");

  ctx.scale(pixelRatio, pixelRatio);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, totalH);

  const family = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const titleSize = Math.round(bannerH * 0.32);
  ctx.textBaseline = "middle";
  ctx.fillStyle = fg;
  ctx.font = `600 ${titleSize}px ${family}`;
  ctx.fillText(title || "Diagram SOP", PADDING, bannerH * 0.38, width - PADDING * 2 - 240);

  ctx.fillStyle = muted;
  ctx.font = `500 ${Math.round(titleSize * 0.48)}px ${family}`;
  const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  ctx.fillText(`Dibuat dengan Zefflow  ·  ${date}`, PADDING, bannerH * 0.72);

  // Gambar Logo dan Identitas Perusahaan di sisi kanan banner
  if (branding?.companyLogo) {
    try {
      const logoImg = new Image();
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => resolve();
        logoImg.src = branding.companyLogo!;
      });
      if (logoImg.naturalWidth > 0) {
        const maxLogoH = Math.min(52, bannerH * 0.52);
        const maxLogoW = 160;
        const ratio = Math.min(maxLogoH / logoImg.naturalHeight, maxLogoW / logoImg.naturalWidth);
        const logoW = Math.round(logoImg.naturalWidth * ratio);
        const logoH = Math.round(logoImg.naturalHeight * ratio);
        const logoX = width - PADDING - logoW;
        const logoY = Math.round((bannerH - logoH) / 2) - 4;
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);

        if (branding.companyName || branding.docCode) {
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.font = `600 11px ${family}`;
          ctx.fillStyle = muted;
          if (branding.docCode) {
            ctx.fillText(branding.docCode, width - PADDING, bannerH - 12);
          }
          ctx.textAlign = "left";
        }
      }
    } catch {
      // Abaikan jika gambar gagal
    }
  } else if (branding?.companyName || branding?.docCode) {
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    if (branding.companyName) {
      ctx.font = `600 13px ${family}`;
      ctx.fillStyle = fg;
      ctx.fillText(branding.companyName, width - PADDING, bannerH * 0.38);
    }
    if (branding.docCode) {
      ctx.font = `500 11px ${family}`;
      ctx.fillStyle = muted;
      ctx.fillText(branding.docCode, width - PADDING, bannerH * 0.72);
    }
    ctx.textAlign = "left";
  } else {
    // Default identitas Zefflow resmi di kanan atas hasil ekspor bila user belum mengatur logo perusahaan
    try {
      const brandLogo = new Image();
      await new Promise<void>((resolve) => {
        brandLogo.onload = () => resolve();
        brandLogo.onerror = () => resolve();
        brandLogo.src = isLight ? "/brand/logo-light.png" : "/brand/logo-dark.png";
      });
      if (brandLogo.naturalWidth > 0) {
        const targetH = Math.min(34, Math.round(bannerH * 0.34));
        const targetW = Math.round((brandLogo.naturalWidth / brandLogo.naturalHeight) * targetH);
        const logoX = width - PADDING - targetW;
        const logoY = Math.round((bannerH - targetH) / 2);
        ctx.drawImage(brandLogo, logoX, logoY, targetW, targetH);
      }
    } catch {
      // Abaikan bila aset gagal dimuat
    }
  }

  // Garis pemisah banner
  ctx.fillStyle = line;
  ctx.fillRect(PADDING, bannerH - 2, width - PADDING * 2, 1);

  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, bannerH, width, height);

  return { canvas, width, height: totalH, bgColor };
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "flow";

function waitNextFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function exportDiagram(
  nodes: AppNode[],
  format: ExportFormat,
  title: string,
  orientation: Orientation = "horizontal",
  branding?: BrandingInfo,
) {
  // Nonaktifkan sementara virtualisasi viewport agar 100% node & edge ikut ter-render utuh ke PNG/PDF.
  const store = useCanvasStore.getState();
  const needsFullMount = nodes.length > 40;
  if (needsFullMount) {
    store.setExporting(true);
    await waitNextFrames();
  }

  try {
    const { canvas, width, height } = await render(nodes, title, orientation, branding);
    const name = slug(title);

    if (format === "png") {
      return download(canvas.toDataURL("image/png"), `${name}.png`);
    }

    // PDF: canvas sudah solid (tanpa alpha) → encode JPEG 24-bit agar bebas bug warna pelangi jsPDF pada PNG RGBA.
    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.98);

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: width >= height ? "l" : "p",
      unit: "px",
      format: [width, height],
      compress: true,
    });

    pdf.addImage(jpegDataUrl, "JPEG", 0, 0, width, height, undefined, "FAST");
    pdf.save(`${name}.pdf`);
  } finally {
    if (needsFullMount) {
      useCanvasStore.getState().setExporting(false);
    }
  }
}

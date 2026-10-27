import { toPng } from "html-to-image";
import type { AppNode } from "../types";
import { LANE_DEFAULT_HEIGHT, LANE_DEFAULT_WIDTH, LANE_HEADER_WIDTH, STEP_EST_HEIGHT, STEP_WIDTH } from "./layout";

export type ExportFormat = "png" | "pdf";

const PADDING = 48;
const MAX_SIDE = 8000;

interface DiagramBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Menghitung bounding box akurat dari semua lane dan langkah di kanvas.
 * Langkah (child nodes) memiliki posisi relatif terhadap lane parent.
 * Kita hitung posisi absolut sebenarnya agar tidak ada elemen yang terpotong saat ekspor.
 */
function computeDiagramBounds(nodes: AppNode[]): DiagramBounds {
  const lanes = nodes.filter((n) => n.type === "lane");
  const steps = nodes.filter((n) => n.type !== "lane");

  const laneMap = new Map<string, { x: number; y: number; width: number; height: number }>();
  let totalLaneHeight = 0;

  for (const lane of lanes) {
    const lx = lane.position.x;
    const ly = lane.position.y;
    const lw = lane.width ?? LANE_DEFAULT_WIDTH;
    const lh = lane.height ?? LANE_DEFAULT_HEIGHT;
    laneMap.set(lane.id, { x: lx, y: ly, width: lw, height: lh });
    totalLaneHeight = Math.max(totalLaneHeight, ly + lh);
  }

  // Cari batas x dan y terjauh dari seluruh step
  let maxStepX = LANE_HEADER_WIDTH + 320;
  let maxStepY = totalLaneHeight;

  for (const step of steps) {
    const parent = step.parentId ? laneMap.get(step.parentId) : undefined;
    const parentX = parent ? parent.x : 0;
    const parentY = parent ? parent.y : 0;

    const absX = parentX + step.position.x;
    const absY = parentY + step.position.y;

    const stepW = step.type === "decision" ? 180 : step.type === "terminal" ? 150 : (step.width ?? STEP_WIDTH);
    const stepH = step.type === "decision" ? 130 : step.type === "terminal" ? 44 : (step.height ?? STEP_EST_HEIGHT);

    maxStepX = Math.max(maxStepX, absX + stepW);
    maxStepY = Math.max(maxStepY, absY + stepH);
  }

  // Lebar diagram: mulai dari x=0 (header lane) sampai step paling kanan + margin bernapas
  const contentWidth = Math.max(1000, Math.ceil(maxStepX + 96));
  const contentHeight = Math.max(totalLaneHeight, Math.ceil(maxStepY + 40));

  return {
    x: 0,
    y: 0,
    width: Math.min(contentWidth, MAX_SIDE),
    height: Math.min(contentHeight, MAX_SIDE),
  };
}

/** Render viewport React Flow ke data-URL PNG pada resolusi tinggi (Retina / 4K Crisp) */
async function renderPng(nodes: AppNode[]): Promise<{ dataUrl: string; width: number; height: number; bgColor: string }> {
  const viewportEl = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!viewportEl) throw new Error("Kanvas belum siap diekspor.");
  if (nodes.length === 0) throw new Error("Diagram masih kosong.");

  const bounds = computeDiagramBounds(nodes);
  const width = bounds.width + PADDING * 2;
  const height = bounds.height + PADDING * 2;

  // Deteksi mode tema aktif untuk background ekspor yang bersih
  const isLight = document.documentElement.classList.contains("light");
  const bgColor = isLight ? "#F8FAFC" : "#08090C";

  // Pixel ratio 2.5 - 3x agar font, border, dan detail langkah sangat tajam & terbaca
  const totalPixels = width * height;
  const pixelRatio = totalPixels > 12_000_000 ? 1.75 : 2.5;

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

  return { dataUrl, width, height, bgColor };
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

export async function exportDiagram(nodes: AppNode[], format: ExportFormat, title: string) {
  const { dataUrl, width, height, bgColor } = await renderPng(nodes);
  const name = slug(title);

  if (format === "png") {
    return download(dataUrl, `${name}.png`);
  }

  // Ekspor Dokumen PDF:
  // BUG FIX PELANGI (Rainbow chromatic aberration):
  // jsPDF memiliki bug internal decoding PNG 32-bit RGBA (transparency/flate offset)
  // yang menyebabkan pergeseran kanal warna R/G/B sehingga timbul efek pelangi di PDF.
  // SOLUSI PASTI: Gambar diratakan ke canvas 2D offscreen dengan solid background
  // dan di-encode ke JPEG 24-bit berkualitas 0.98. Format JPEG diproses jsPDF lewat DCTDecode murni,
  // 100% bebas dari efek pelangi dan teks tetap ultra tajam.
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Gagal memuat gambar untuk pembuatan PDF"));
    img.src = dataUrl;
  });

  const offscreen = document.createElement("canvas");
  offscreen.width = img.naturalWidth;
  offscreen.height = img.naturalHeight;
  const ctx = offscreen.getContext("2d");
  if (!ctx) throw new Error("Gagal menginisialisasi 2D canvas untuk PDF.");

  // Ratakan background ke solid color (menghilangkan channel alpha/transparansi)
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, offscreen.width, offscreen.height);
  ctx.drawImage(img, 0, 0);

  const jpegDataUrl = offscreen.toDataURL("image/jpeg", 0.98);

  const { jsPDF } = await import("jspdf");
  const orientation = width >= height ? "l" : "p";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [width, height],
    compress: true,
  });

  pdf.addImage(jpegDataUrl, "JPEG", 0, 0, width, height, undefined, "FAST");
  pdf.save(`${name}.pdf`);
}

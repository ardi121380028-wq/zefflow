"use client";

import { memo } from "react";
import { BaseEdge, getSmoothStepPath, useStore, type EdgeProps } from "@xyflow/react";
import { useCanvasStore } from "../store/canvas-store";

/**
 * Custom Edge dengan SVG badge pill untuk label alur (mis. "Ya", "Tidak").
 * Menggunakan elemen SVG native murni (tanpa foreignObject / EdgeLabelRenderer)
 * sehingga 100% konsisten ter-render saat ekspor PNG & PDF, tidak menimbulkan kotak hitam.
 */
function CustomEdgeImpl({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  selected,
}: EdgeProps) {
  // 1. Deteksi aliran horizontal dan vertikal
  const isHorizontalFlow =
    (sourcePosition === "right" && targetPosition === "left") ||
    (sourcePosition === "left" && targetPosition === "right");
  const isVerticalFlow =
    (sourcePosition === "bottom" && targetPosition === "top") ||
    (sourcePosition === "top" && targetPosition === "bottom");

  let edgePath = "";
  let labelX = (sourceX + targetX) / 2;
  let labelY = (sourceY + targetY) / 2;

  // Garis lurus horizontal murni bila selisih Y kecil (< 20px) — mencegah S-kink/lekukan nyangkut
  if (isHorizontalFlow && Math.abs(sourceY - targetY) < 20) {
    const snapY = Math.round((sourceY + targetY) / 2);
    edgePath = `M ${sourceX} ${snapY} L ${targetX} ${snapY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = snapY;
  }
  // Garis lurus vertikal murni bila selisih X kecil (< 20px) — lurus sempurna tanpa jog
  else if (isVerticalFlow && Math.abs(sourceX - targetX) < 20) {
    const snapX = Math.round((sourceX + targetX) / 2);
    edgePath = `M ${snapX} ${sourceY} L ${snapX} ${targetY}`;
    labelX = snapX;
    labelY = (sourceY + targetY) / 2;
  }
  // Belokan bertingkat antar-lane: radius dan offset adaptif proporsional jarak aktual
  else {
    const dx = Math.abs(targetX - sourceX);
    const dy = Math.abs(targetY - sourceY);
    const dynamicRadius = Math.max(4, Math.min(16, Math.floor(dx / 3), Math.floor(dy / 3)));
    const dynamicOffset = Math.max(8, Math.min(24, Math.floor(dx / 3), Math.floor(dy / 3)));

    const [computedPath, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: dynamicRadius,
      offset: dynamicOffset,
    });
    edgePath = computedPath;
    labelX = lx;
    labelY = ly;
  }

  const isExporting = useCanvasStore((s) => s.isExporting);
  const wallpaper = useCanvasStore((s) => s.wallpaper);
  const isSolidZitline = wallpaper === "solid-zitline";
  const hideBadgeAtFarZoom = useStore((s) => s.transform[2] < 0.08);
  const labelText = typeof label === "string" ? label.trim() : "";
  const showLabel = Boolean(labelText) && (isExporting || selected || !hideBadgeAtFarZoom);
  const labelLength = labelText.length;
  // Skala badge pill 2x — jelas terbaca dari kejauhan maupun hasil ekspor
  const badgeWidth = Math.max(92, labelLength * 18 + 44);
  const badgeHeight = 50;
  const rx = badgeHeight / 2;

  const defaultEdgeStroke = isSolidZitline ? "#1D4ED8" : "hsl(var(--edge-stroke))";
  const selectedEdgeStroke = isSolidZitline ? "#DC2626" : "hsl(var(--primary))";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? (isSolidZitline ? 6.25 : 5.75) : (isSolidZitline ? 5 : 4.5),
          stroke: selected ? selectedEdgeStroke : defaultEdgeStroke,
          ...style,
        }}
      />
      {showLabel && (
        <g
          transform={`translate(${labelX}, ${labelY})`}
          className="pointer-events-none select-none"
        >
          {/* Badge Background — Explicit fill and stroke to prevent black rect during html-to-image export */}
          <rect
            x={-badgeWidth / 2}
            y={-badgeHeight / 2}
            width={badgeWidth}
            height={badgeHeight}
            rx={rx}
            ry={rx}
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="1.75"
            className="fill-card stroke-border"
          />

          {/* Label Text — Explicit fill for guaranteed export rendering */}
          <text
            x={0}
            y={1.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            className="font-sans text-[25px] font-extrabold tracking-wide uppercase select-none fill-foreground"
          >
            {labelText}
          </text>
        </g>
      )}
    </>
  );
}

export const CustomEdge = memo(CustomEdgeImpl);

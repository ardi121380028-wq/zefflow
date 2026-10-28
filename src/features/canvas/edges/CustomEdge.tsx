"use client";

import { memo } from "react";
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 18,
    offset: 28,
  });

  const labelText = typeof label === "string" ? label.trim() : "";
  const labelLength = labelText.length;
  // Dynamic badge pill geometry — lebih besar, modern, dan terbaca jelas
  const badgeWidth = Math.max(52, labelLength * 10.5 + 28);
  const badgeHeight = 30;
  const rx = badgeHeight / 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 3 : 2.25,
          stroke: selected ? "hsl(var(--primary))" : "hsl(var(--edge-stroke))",
          ...style,
        }}
      />
      {labelText && (
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
            strokeWidth="1.25"
            className="fill-card stroke-border"
          />

          {/* Label Text — Explicit fill for guaranteed export rendering */}
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            className="font-sans text-[13px] font-bold tracking-wide uppercase select-none fill-foreground"
          >
            {labelText}
          </text>
        </g>
      )}
    </>
  );
}

export const CustomEdge = memo(CustomEdgeImpl);

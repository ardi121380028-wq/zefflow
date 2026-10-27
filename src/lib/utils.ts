import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan class Tailwind tanpa konflik (pola standar shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "2 jam lalu" — formatter relatif ringan tanpa dependensi tambahan. */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"], [60, "minute"], [24, "hour"], [7, "day"], [4.345, "week"], [12, "month"], [Infinity, "year"],
  ];
  let value = diff;
  for (const [limit, unit] of steps) {
    if (Math.abs(value) < limit) return rtf.format(-Math.round(value), unit);
    value /= limit;
  }
  return d.toLocaleDateString("id");
}

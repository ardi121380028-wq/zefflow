import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan class Tailwind tanpa konflik (pola standar shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RTF_ID = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
const TIME_STEPS: readonly [number, Intl.RelativeTimeFormatUnit][] = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.345, "week"],
  [12, "month"],
  [Infinity, "year"],
];

/** "2 jam lalu" — formatter relatif ringan dengan singleton Intl (tanpa alokasi ulang per kartu). */
export function timeAgo(date: Date | string): string {
  const ms = typeof date === "string" ? Date.parse(date) : date.getTime();
  if (Number.isNaN(ms)) return "";
  let value = (Date.now() - ms) / 1000;
  for (const [limit, unit] of TIME_STEPS) {
    if (Math.abs(value) < limit) return RTF_ID.format(-Math.round(value), unit);
    value /= limit;
  }
  return new Date(ms).toLocaleDateString("id");
}

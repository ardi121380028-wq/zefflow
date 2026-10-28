import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { serverEnv } from "@/env";
import * as schema from "./schema";

/**
 * Singleton koneksi (dipertahankan di globalThis agar HMR & warm Vercel Function tetap memakai soket TLS hangat).
 * - `prepare: false` wajib untuk Supabase Supavisor Transaction Pooler (:6543).
 * - `idle_timeout: 180` + `keep_alive: 30` menjaga soket TLS ke Seoul tetap hangat saat jeda baca user,
 *   menghilangkan penalti cold TCP+TLS handshake (~800ms) antar klik!
 */
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

function resolveDatabaseUrl(rawUrl: string): string {
  if (!process.env.VERCEL) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    // Di Vercel Serverless, pastikan Supavisor memakai Transaction Mode (:6543, kapasitas 200+ koneksi)
    // alih-alih Session Mode (:5432, batas ~15 koneksi yang mudah penuh/timeout saat trafik naik).
    if (parsed.hostname.endsWith(".pooler.supabase.com") && (parsed.port === "5432" || parsed.port === "")) {
      parsed.port = "6543";
      return parsed.toString();
    }
  } catch {
    // Gunakan rawUrl apa adanya bila gagal di-parse
  }
  return rawUrl;
}

function getClient() {
  if (!globalForDb.pg) {
    const isServerless = Boolean(process.env.VERCEL);
    const defaultMax = isServerless ? 5 : 10;
    const poolMax = Math.max(2, Math.min(20, Number(process.env.DATABASE_POOL_MAX) || defaultMax));
    globalForDb.pg = postgres(resolveDatabaseUrl(serverEnv().DATABASE_URL), {
      prepare: false,
      max: poolMax,
      idle_timeout: isServerless ? 60 : 180,
      max_lifetime: 60 * 30,
      connect_timeout: 8,
      keep_alive: 30,
    });
  }
  return globalForDb.pg;
}

export const db: PostgresJsDatabase<typeof schema> = drizzle(getClient(), { schema });

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Eksekusi transaksi dengan konteks RLS `authenticated` (`auth.uid()` = userId).
 * Untuk jalur panas (dashboard, buat template, buka flow, autosave), gunakan RPC `public.zf_*` (1 round-trip).
 */
export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const claims = JSON.stringify({ sub: userId, role: "authenticated" });
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${claims}, true), set_config('role', 'authenticated', true)`,
    );
    return fn(tx);
  });
}

export { schema };

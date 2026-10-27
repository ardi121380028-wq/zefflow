import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { serverEnv } from "@/env";
import * as schema from "./schema";

/**
 * Singleton koneksi (dipertahankan di globalThis agar HMR dev tidak membocorkan koneksi).
 * `prepare: false` wajib untuk Supabase pooler (transaction mode).
 */
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

function getClient() {
  if (!globalForDb.pg) {
    globalForDb.pg = postgres(serverEnv().DATABASE_URL, { prepare: false, max: 10 });
  }
  return globalForDb.pg;
}

export const db: PostgresJsDatabase<typeof schema> = drizzle(getClient(), { schema });

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * PENTING: koneksi Drizzle memakai role `postgres` yang MEM-BYPASS RLS.
 * Untuk query atas nama pengguna, jalankan di dalam `withUser` agar
 * Postgres mengeksekusi sebagai role `authenticated` dengan `auth.uid()` = userId,
 * sehingga policy RLS benar-benar berlaku (defense in depth).
 */
export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const claims = JSON.stringify({ sub: userId, role: "authenticated" });
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`);
    await tx.execute(sql`set local role authenticated`);
    return fn(tx);
  });
}

export { schema };

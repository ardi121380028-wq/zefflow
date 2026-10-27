import { ZodError } from "zod";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "INTERNAL";

/** Error domain yang aman ditampilkan ke pengguna. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fieldErrors?: Record<string, string[] | undefined> } };

/**
 * Bungkus server action: tidak pernah melempar mentah ke klien.
 * - AppError / ZodError  -> pesan terstruktur
 * - Error lain           -> di-log di server, klien hanya menerima pesan generik
 * - NEXT_REDIRECT / NEXT_NOT_FOUND tetap dilempar ulang (mekanisme internal Next)
 */
export async function safeAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    const digest = (err as { digest?: string } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_")) throw err;

    if (err instanceof AppError) {
      return { ok: false, error: { code: err.code, message: err.message, fieldErrors: err.fieldErrors } };
    }
    if (err instanceof ZodError) {
      return {
        ok: false,
        error: { code: "VALIDATION", message: "Data tidak valid.", fieldErrors: err.flatten().fieldErrors },
      };
    }
    console.error("[action:error]", err);
    return { ok: false, error: { code: "INTERNAL", message: "Terjadi kesalahan pada server. Coba lagi." } };
  }
}

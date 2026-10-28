"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail, Sparkles, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [magicSent, setMagicSent] = React.useState(false);

  const supabase = createClient();

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Harap isi email dan kata sandi.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        toast.success("Akun berhasil dibuat! Silakan cek email Anda untuk konfirmasi.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Berhasil masuk!");
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      toast.error((err as Error).message || "Terjadi kesalahan saat otentikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Masukkan email terlebih dahulu untuk menerima tautan masuk.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setMagicSent(true);
      toast.success("Tautan login terkirim ke email Anda!");
    } catch (err) {
      toast.error((err as Error).message || "Gagal mengirimkan tautan masuk.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error((err as Error).message || "Gagal masuk dengan Google.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-background px-3 py-8 sm:px-4 sm:py-12 transition-colors duration-200">
      {/* Decorative ambient gradients (zero-cost radial-gradient tanpa beban GPU filter blur) */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[540px] w-[720px]"
        style={{
          background: "radial-gradient(closest-side, rgba(124, 58, 237, 0.18) 0%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-1/4 h-[460px] w-[580px]"
        style={{
          background: "radial-gradient(closest-side, rgba(79, 70, 229, 0.14) 0%, transparent 100%)",
        }}
      />

      {/* Top Bar Navigation */}
      <div className="relative z-20 mb-4 sm:mb-6 flex w-full max-w-md items-center justify-between px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Beranda</span>
        </Link>
        <ThemeToggle />
      </div>

      <div
        className="relative z-10 w-full max-w-md rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-xl dark:shadow-[0_16px_50px_rgba(0,0,0,0.8)]"
      >
        {/* Brand logo & header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-fuchsia-600 shadow-[0_0_24px_rgba(139,92,246,0.4)]">
            <Workflow className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            {isSignUp ? "Daftar Akun Zefflow" : "Masuk ke Zefflow"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Platform SaaS visualisasi SOP & Customer Journey lintas divisi
          </p>
        </div>

        {/* Google OAuth Login Button (Primary) */}
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full text-xs font-semibold py-2.5 h-auto flex items-center justify-center gap-2.5 border-violet-500/40 bg-violet-500/[0.06] hover:bg-violet-500/15 hover:border-violet-500/70 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Lanjutkan dengan Google</span>
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold">atau dengan email</span>
            </div>
          </div>
        </div>

        {magicSent ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 p-5 text-center animate-scale-in">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Cek Email Anda</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Kami telah mengirimkan tautan masuk instan ke <strong className="text-foreground">{email}</strong>.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMagicSent(false)}
              className="mt-4 text-xs"
            >
              Coba metode lain
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePasswordAuth} className="mt-5 space-y-3.5">
            <div>
              <Label>Email Kerja</Label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Kata Sandi</Label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-8 text-xs"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="brand"
              loading={loading}
              className="w-full text-xs font-semibold mt-2"
            >
              <span>{isSignUp ? "Daftar Sekarang" : "Masuk"}</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase">
                <span className="bg-card px-2 text-muted-foreground">atau</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleMagicLink}
              className="w-full text-xs font-medium"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5 text-violet-500" />
              <span>Kirim Tautan Magic Link</span>
            </Button>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              {isSignUp ? "Sudah memiliki akun? " : "Belum punya akun? "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-primary hover:underline"
              >
                {isSignUp ? "Masuk di sini" : "Daftar gratis"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </React.Suspense>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Lock, Mail, Sparkles, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { enableDemoModeAction } from "@/features/flows/actions";

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

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#08090C] px-4 py-12 selection:bg-violet-600/30">
      {/* Decorative ambient gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-violet-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[400px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />

      <div
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0E0F15]/90 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        style={{ boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 20px 60px rgba(0, 0, 0, 0.85)" }}
      >
        {/* Brand logo & header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-fuchsia-600 shadow-[0_0_24px_rgba(139,92,246,0.5)]">
            <Workflow className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-white">
            {isSignUp ? "Daftar Akun Zefflow" : "Masuk ke Zefflow"}
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400">
            Platform SaaS visualisasi SOP & Customer Journey lintas divisi
          </p>
        </div>

        {/* Demo Mode Instant Access Banner */}
        <div className="mt-6 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-zinc-900/60 to-purple-950/20 p-4 text-center">
          <p className="text-xs font-semibold text-white">Ingin langsung menguji coba kanvas?</p>
          <p className="mt-0.5 text-[11px] text-zinc-400 leading-relaxed">
            Masuk instan tanpa konfigurasi akun Supabase / PostgreSQL.
          </p>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => enableDemoModeAction()}
            className="mt-3 w-full text-xs font-semibold"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
            Masuk Mode Demo (Uji Coba Langsung)
          </Button>
        </div>

        {magicSent ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-5 text-center animate-scale-in">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <h3 className="mt-2 text-sm font-semibold text-white">Cek Email Anda</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Kami telah mengirimkan tautan masuk instan ke <strong className="text-white">{email}</strong>.
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
          <form onSubmit={handlePasswordAuth} className="mt-6 space-y-4">
            <div>
              <Label>Email Kerja</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
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
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
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
              variant="secondary"
              loading={loading}
              className="w-full text-xs font-semibold mt-1"
            >
              <span>{isSignUp ? "Daftar Sekarang" : "Masuk"}</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase">
                <span className="bg-[#0E0F15] px-2 text-zinc-500">atau</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={handleMagicLink}
              className="w-full text-xs"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5 text-violet-400" />
              Kirim Tautan Magic Link ke Email
            </Button>

            <div className="pt-2 text-center text-xs text-zinc-500">
              {isSignUp ? "Sudah memiliki akun? " : "Belum punya akun? "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
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
    <React.Suspense fallback={<div className="min-h-screen bg-[#08090C]" />}>
      <LoginForm />
    </React.Suspense>
  );
}

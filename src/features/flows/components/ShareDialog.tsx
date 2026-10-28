"use client";

import * as React from "react";
import {
  Check,
  Clock,
  Code,
  Copy,
  ExternalLink,
  Globe2,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { setFlowShareAction } from "../actions";

interface ShareDialogProps {
  flowId: string;
  flowTitle: string;
  initialShareEnabled: boolean;
  initialShareToken?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareUpdated?: (enabled: boolean, token?: string) => void;
}

type TabType = "invite" | "public" | "security";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "commenter" | "viewer";
  status: "active" | "invited";
  avatarColor: string;
}

export function ShareDialog({
  flowId,
  flowTitle,
  initialShareEnabled,
  initialShareToken,
  open,
  onOpenChange,
  onShareUpdated,
}: ShareDialogProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("invite");
  const [enabled, setEnabled] = React.useState(initialShareEnabled);
  const [token, setToken] = React.useState(initialShareToken);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedEmbed, setCopiedEmbed] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"editor" | "commenter" | "viewer">("editor");
  const [isSendingInvite, setIsSendingInvite] = React.useState(false);

  // Daftar kolaborator dokumen
  const [collaborators, setCollaborators] = React.useState<Collaborator[]>([
    {
      id: "owner-1",
      name: "Anda (Pemilik)",
      email: "owner@workspace.io",
      role: "owner",
      status: "active",
      avatarColor: "bg-violet-600 text-white",
    },
    {
      id: "collab-2",
      name: "Sarah Lestari",
      email: "sarah@zefflow.io",
      role: "editor",
      status: "active",
      avatarColor: "bg-emerald-600 text-white",
    },
    {
      id: "collab-3",
      name: "Budi Pratama (Audit)",
      email: "budi@enterprise.co.id",
      role: "viewer",
      status: "invited",
      avatarColor: "bg-amber-600 text-white",
    },
  ]);

  React.useEffect(() => {
    setEnabled(initialShareEnabled);
    setToken(initialShareToken);
  }, [initialShareEnabled, initialShareToken]);

  const shareUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/share/${token}`
      : "";

  const embedSnippet = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;

  const handleToggleShare = async () => {
    setIsUpdating(true);
    const nextState = !enabled;
    try {
      const res = await setFlowShareAction({ flowId, enabled: nextState });
      if (res.ok) {
        setEnabled(res.data.enabled);
        if (res.data.token) setToken(res.data.token);
        onShareUpdated?.(res.data.enabled, res.data.token ?? undefined);
        toast.success(
          nextState
            ? "Tautan berbagi publik telah diaktifkan."
            : "Tautan berbagi telah dinonaktifkan.",
        );
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("Gagal mengubah pengaturan berbagi.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Tautan publik disalin ke clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    if (!embedSnippet) return;
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    toast.success("Kode iframe disalin!");
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@") || !email.includes(".")) {
      toast.error("Masukkan alamat email yang valid");
      return;
    }

    if (collaborators.some((c) => c.email === email)) {
      toast.error("Email tersebut sudah ada dalam daftar kolaborator.");
      return;
    }

    setIsSendingInvite(true);
    setTimeout(() => {
      const newCollab: Collaborator = {
        id: `collab-${Date.now()}`,
        name: email.split("@")[0] || email,
        email,
        role: inviteRole,
        status: "invited",
        avatarColor: "bg-sky-600 text-white",
      };
      setCollaborators((prev) => [...prev, newCollab]);
      setInviteEmail("");
      setIsSendingInvite(false);
      toast.success(`Undangan berhasil dikirim ke ${email}!`);
    }, 450);
  };

  const handleRemoveCollaborator = (id: string, name: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
    toast.success(`Akses kolaborasi untuk ${name} dicabut.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-6 sm:top-10 md:top-12 translate-y-0 max-w-xl p-0 overflow-hidden rounded-3xl border border-border/80 dark:border-white/[0.08] bg-card text-foreground shadow-2xl flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5rem)]">
        {/* Header Dialog */}
        <div className="p-4 pb-2.5 sm:p-4.5 sm:pb-3 border-b border-border/70 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#11121C] shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]">
              <Users className="h-3.5 w-3.5" />
            </span>
            <span>Kolaborasi & Berbagi Diagram</span>
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-[11px] text-muted-foreground truncate">
            Kerjakan SOP <strong className="text-foreground font-semibold">"{flowTitle}"</strong> bersama tim atau bagikan tautan baca ke luar.
          </DialogDescription>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-3">
            <button
              type="button"
              onClick={() => setActiveTab("invite")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all",
                activeTab === "invite"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Undang Tim</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("public")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all",
                activeTab === "public"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Tautan Publik</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all",
                activeTab === "security"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Keamanan RBAC</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: UNDANG KOLABORATOR (MULTIPLAYER REALTIME)
           ========================================================================= */}
        {activeTab === "invite" && (
          <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto no-scrollbar flex-1 max-h-[min(55vh,400px)]">
            {/* Banner Fitur Pro Kolaborasi Realtime (Compact) */}
            <div className="flex items-center gap-2.5 rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent p-2.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-600 text-white shrink-0 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-foreground truncate">Multiplayer Live (Fitur Pro)</p>
                  <span className="rounded-full bg-violet-500/20 px-1.5 py-0.2 font-mono text-[8px] font-bold text-violet-600 dark:text-violet-400">
                    LIVE SYNC
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  Kolaborasi SOP real-time dengan kursor rekan tim di kanvas seperti Figma.
                </p>
              </div>
            </div>

            {/* Form Input Email & Role (Compact) */}
            <form onSubmit={handleSendInvite} className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground">Kirim Undangan ke Rekan Kerja</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="nama@perusahaan.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-8 w-full rounded-xl border border-border/80 bg-background/80 pl-8 pr-3 text-xs font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="h-8 rounded-xl border border-border/80 bg-background px-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="editor">Editor (Bisa Edit)</option>
                    <option value="commenter">Reviewer (Beri Catatan)</option>
                    <option value="viewer">Viewer (Lihat Saja)</option>
                  </select>

                  <Button
                    type="submit"
                    variant="brand"
                    size="sm"
                    loading={isSendingInvite}
                    className="h-8 px-3 text-xs font-semibold shrink-0"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Undang
                  </Button>
                </div>
              </div>
            </form>

            {/* Daftar Kolaborator (Compact Scrollable) */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                <span>Anggota Tim ({collaborators.length})</span>
                <span>Peran</span>
              </div>

              <div className="max-h-[170px] overflow-y-auto no-scrollbar space-y-1">
                {collaborators.map((c) => {
                  const isOwner = c.role === "owner";
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2.5 p-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "grid h-7 w-7 place-items-center rounded-lg font-bold text-[10px] uppercase shrink-0",
                            c.avatarColor,
                          )}
                        >
                          {c.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOwner ? (
                          <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold font-mono text-violet-600 dark:text-violet-400">
                            PEMILIK
                          </span>
                        ) : (
                          <>
                            <span
                              className={cn(
                                "rounded-lg px-2 py-0.5 text-[10px] font-semibold font-mono",
                                c.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                              )}
                            >
                              {c.status === "active" ? "ONLINE" : "TERKIRIM"}
                            </span>

                            <select
                              value={c.role}
                              onChange={(e) => {
                                const nextRole = e.target.value as any;
                                setCollaborators((prev) =>
                                  prev.map((item) =>
                                    item.id === c.id ? { ...item, role: nextRole } : item,
                                  ),
                                );
                                toast.success(`Peran ${c.name} diubah menjadi ${nextRole}.`);
                              }}
                              className="h-7 rounded-lg border border-border bg-background px-2 text-[11px] font-medium text-foreground focus:outline-none"
                            >
                              <option value="editor">Editor</option>
                              <option value="commenter">Reviewer</option>
                              <option value="viewer">Viewer</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRemoveCollaborator(c.id, c.name)}
                              title="Cabut akses kolaborator"
                              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: TAUTAN PUBLIK (VIEW-ONLY)
           ========================================================================= */}
        {activeTab === "public" && (
          <div className="p-3.5 sm:p-4 space-y-3 max-h-[min(55vh,400px)] overflow-y-auto no-scrollbar flex-1">
            {/* Status Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-border dark:border-white/[0.08] bg-muted/40 dark:bg-[#12141F] p-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl border transition-colors",
                    enabled
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "border-border dark:border-white/[0.08] bg-muted dark:bg-zinc-900 text-muted-foreground",
                  )}
                >
                  {enabled ? <Globe2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {enabled ? "Tautan Publik Aktif" : "Diagram Bersifat Privat"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {enabled
                      ? "Siapa saja dengan tautan bisa melihat (view-only)"
                      : "Hanya anggota yang diundang yang bisa mengakses"}
                  </p>
                </div>
              </div>

              <Button
                variant={enabled ? "outline" : "brand"}
                size="sm"
                loading={isUpdating}
                onClick={handleToggleShare}
                className="text-xs font-semibold h-8"
              >
                {enabled ? "Matikan" : "Aktifkan"}
              </Button>
            </div>

            {/* Copy Link Input */}
            {enabled && shareUrl && (
              <div className="space-y-3 animate-fade-up">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Tautan Publik
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 truncate rounded-xl border border-border dark:border-white/[0.08] bg-card dark:bg-[#0A0B10] px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                    />
                    <Button variant="secondary" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs font-semibold">
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedLink ? "Tersalin" : "Salin"}
                    </Button>
                    <Button variant="outline" size="sm" asChild className="px-2.5 text-xs" title="Buka pratinjau publik">
                      <a href={shareUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Embed Iframe Code */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="h-3 w-3" />
                    <span>Sematan Iframe (Notion / Confluence / Intranet)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={embedSnippet}
                      className="flex-1 truncate rounded-xl border border-border dark:border-white/[0.08] bg-card dark:bg-[#0A0B10] px-3 py-2 text-xs font-mono text-muted-foreground focus:outline-none"
                    />
                    <Button variant="outline" size="sm" onClick={handleCopyEmbed} className="gap-1.5 text-xs">
                      {copiedEmbed ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>Salin Iframe</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: KEAMANAN & RBAC (ENTERPRISE GRADE)
           ========================================================================= */}
        {activeTab === "security" && (
          <div className="p-3.5 sm:p-4 space-y-3 max-h-[min(55vh,400px)] overflow-y-auto no-scrollbar flex-1">
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <p className="leading-relaxed">
                Diagram dienkripsi menggunakan protokol <strong>TLS 1.3</strong> saat transit dan AES-256 saat
                tersimpan di cloud database.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">Kontrol Akses Peran (RBAC)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-xl border border-border/70 p-3 bg-muted/20">
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400">Editor</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    Bisa membuat alur, mengubah bentuk, menghapus langkah, dan mengubah durasi SOP.
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 p-3 bg-muted/20">
                  <p className="text-xs font-bold text-sky-600 dark:text-sky-400">Reviewer</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    Bisa menyematkan komentar dan catatan perbaikan tanpa merusak tata letak diagram.
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 p-3 bg-muted/20">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Viewer</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    Hanya melihat kanvas, navigasi pan/zoom, dan mencetak dokumen resmi PDF/PNG.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 p-3.5 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Proteksi Watermark Perusahaan</p>
                  <p className="text-[10px] text-muted-foreground">Sematkan nama pengakses saat ekspor untuk mencegah kebocoran SOP internal</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-600">
                  AKTIF
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Dialog (Compact) */}
        <div className="flex items-center justify-between border-t border-border/70 dark:border-white/[0.08] px-4 py-2.5 sm:px-5 bg-slate-50/60 dark:bg-[#11121C] shrink-0">
          <span className="text-[11px] text-muted-foreground font-mono">
            {collaborators.length} kolaborator aktif
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

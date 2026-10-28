"use client";

import * as React from "react";
import { Users2, UserPlus, Trash2, Mail, Shield, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  getWorkspaceMembersAction,
  inviteWorkspaceMemberAction,
  removeWorkspaceMemberAction,
} from "@/features/flows/actions";

interface MemberItem {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: string;
}

export function TeamManagementModal({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  currentUserRole,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  currentUserRole: string;
}) {
  const [members, setMembers] = React.useState<MemberItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"admin" | "editor" | "viewer">("editor");
  const [inviting, setInviting] = React.useState(false);

  const fetchMembers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWorkspaceMembersAction(workspaceId);
      if (res.ok) {
        setMembers(res.data as MemberItem[]);
      }
    } catch {
      toast.error("Gagal memuat daftar anggota tim.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  React.useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Masukkan alamat email rekan tim.");
      return;
    }

    setInviting(true);
    try {
      const res = await inviteWorkspaceMemberAction({
        workspaceId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      if (!res.ok) {
        toast.error(res.error.message || "Gagal mengundang anggota.");
      } else {
        toast.success(`Undangan berhasil dikirim ke ${inviteEmail}!`);
        setInviteEmail("");
        fetchMembers();
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengundang.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string, name: string | null) => {
    if (confirm(`Yakin ingin mencabut akses ${name || "anggota ini"} dari workspace?`)) {
      try {
        const res = await removeWorkspaceMemberAction({ workspaceId, userId });
        if (!res.ok) {
          toast.error(res.error.message || "Gagal menghapus anggota.");
        } else {
          toast.success("Akses anggota berhasil dicabut.");
          setMembers((prev) => prev.filter((m) => m.id !== userId));
        }
      } catch {
        toast.error("Terjadi kesalahan.");
      }
    }
  };

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-card border-border shadow-2xl">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-3">
            <Users2 className="h-5 w-5" />
          </div>
          <DialogTitle className="font-display text-lg font-bold">
            Kelola Tim & Akses Workspace
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Atur anggota yang dapat merancang, meninjau, dan mengekspor alur di workspace <strong className="text-foreground">{workspaceName}</strong>.
          </DialogDescription>
        </div>

        {/* Invite Form */}
        {canManage && (
          <form onSubmit={handleInvite} className="mt-4 rounded-xl border border-border/80 bg-muted/30 p-3">
            <p className="text-[11px] font-semibold text-foreground mb-2">Undang Anggota Baru</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@perusahaan.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="h-8 rounded-xl border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>

                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  loading={inviting}
                  className="h-8 px-3 text-xs font-semibold shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Undang
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Members List */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-1">
            <span>Daftar Anggota ({members.length})</span>
            <span>Peran</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 no-scrollbar pr-0.5">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Memuat anggota tim...
              </div>
            ) : members.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Belum ada anggota lain di workspace ini.
              </div>
            ) : (
              members.map((m) => {
                const isOwner = m.role === "owner";
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-xs uppercase shrink-0 shadow-sm">
                        {(m.name || m.email).slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {m.name || m.email.split("@")[0]}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold uppercase",
                          isOwner
                            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                            : m.role === "admin"
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {m.role}
                      </span>

                      {!isOwner && canManage && (
                        <button
                          type="button"
                          onClick={() => handleRemove(m.id, m.name)}
                          title="Hapus dari tim"
                          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

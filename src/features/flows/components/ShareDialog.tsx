"use client";

import * as React from "react";
import { Check, Copy, ExternalLink, Globe2, Lock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function ShareDialog({
  flowId,
  flowTitle,
  initialShareEnabled,
  initialShareToken,
  open,
  onOpenChange,
  onShareUpdated,
}: ShareDialogProps) {
  const [enabled, setEnabled] = React.useState(initialShareEnabled);
  const [token, setToken] = React.useState(initialShareToken);
  const [copied, setCopied] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    setEnabled(initialShareEnabled);
    setToken(initialShareToken);
  }, [initialShareEnabled, initialShareToken]);

  const shareUrl = typeof window !== "undefined" && token
    ? `${window.location.origin}/share/${token}`
    : "";

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

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Tautan disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Bagikan Diagram
        </DialogTitle>
        <DialogDescription>
          Siapa pun yang memiliki tautan dapat melihat diagram{" "}
          <strong className="text-foreground font-semibold">"{flowTitle}"</strong> dalam mode
          hanya-baca (view-only).
        </DialogDescription>

        <div className="mt-4 space-y-4">
          {/* Status Banner */}
          <div className="flex items-center justify-between rounded-2xl border border-border dark:border-white/[0.08] bg-muted/40 dark:bg-[#12141F] p-4">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl border ${
                  enabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border dark:border-white/[0.08] bg-muted dark:bg-zinc-900 text-muted-foreground"
                }`}
              >
                {enabled ? <Globe2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {enabled ? "Tautan Publik Aktif" : "Diagram Bersifat Privat"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {enabled
                    ? "Siapa saja dengan tautan bisa melihat"
                    : "Hanya anggota workspace yang bisa melihat"}
                </p>
              </div>
            </div>

            <Button
              variant={enabled ? "outline" : "default"}
              size="sm"
              loading={isUpdating}
              onClick={handleToggleShare}
              className="text-xs"
            >
              {enabled ? "Matikan" : "Aktifkan"}
            </Button>
          </div>

          {/* Copy Link Input */}
          {enabled && shareUrl && (
            <div className="space-y-2 animate-fade-up">
              <label className="text-[11px] font-medium text-muted-foreground">
                Tautan Publik (View-Only)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 truncate rounded-xl border border-border dark:border-white/[0.08] bg-card dark:bg-[#0A0B10] px-3 py-2 text-xs text-foreground focus:outline-none"
                />
                <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Tersalin" : "Salin"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="px-2.5 text-xs"
                  title="Buka pratinjau publik"
                >
                  <a href={shareUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

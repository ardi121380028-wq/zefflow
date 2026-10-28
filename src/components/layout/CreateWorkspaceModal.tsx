"use client";

import * as React from "react";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/field";
import { createWorkspaceAction } from "@/features/flows/actions";

export function CreateWorkspaceModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama workspace tidak boleh kosong.");
      return;
    }

    setLoading(true);
    try {
      const res = await createWorkspaceAction({ name: name.trim() });
      if (!res.ok) {
        toast.error(res.error.message || "Gagal membuat workspace.");
      } else {
        toast.success(`Workspace "${name.trim()}" berhasil dibuat!`);
        setName("");
        onOpenChange(false);
        window.location.href = "/dashboard";
      }
    } catch {
      toast.error("Terjadi kesalahan saat membuat workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-card border-border shadow-2xl">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Building2 className="h-5 w-5" />
          </div>
          <DialogTitle className="font-display text-lg font-bold">
            Buat Workspace Baru
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Kelola SOP, customer journey, dan anggota tim secara terpisah untuk divisi atau klien lain.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="ws-name">Nama Workspace / Perusahaan</Label>
            <Input
              id="ws-name"
              placeholder="Contoh: PT Inovasi Maju atau Divisi Operasional"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 text-xs"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              loading={loading}
              className="text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buat Workspace</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

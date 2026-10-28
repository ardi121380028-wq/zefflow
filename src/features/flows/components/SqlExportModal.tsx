"use client";

import * as React from "react";
import { Check, Copy, Database, Download, FileCode, Sparkles, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AppNode, AppEdge } from "@/features/canvas/types";

interface SqlExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: AppNode[];
  edges: AppEdge[];
  flowTitle: string;
}

type Dialect = "postgres" | "mysql" | "prisma";

/**
 * Generator Skrip SQL & Schema Database (Developer Suite Zefflow)
 * Mengonversi diagram alur / tabel relasional kanvas menjadi DDL SQL siap pakai.
 */
export function SqlExportModal({
  open,
  onOpenChange,
  nodes,
  edges,
  flowTitle,
}: SqlExportModalProps) {
  const [dialect, setDialect] = React.useState<Dialect>("postgres");
  const [copied, setCopied] = React.useState(false);

  // Ambil semua node yang bukan lane sebagai entitas tabel
  const stepNodes = React.useMemo(() => nodes.filter((n) => n.type !== "lane"), [nodes]);

  // Hasilkan kode skema berdasarkan dialek
  const generatedCode = React.useMemo(() => {
    const sanitizeName = (str: string) =>
      (str || "entity")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "") || "item";

    const tables = stepNodes.map((n) => {
      const rawTitle = n.data?.title || "table";
      const tableName = sanitizeName(rawTitle);

      // Cari relasi foreign key dari edges yang terhubung ke node ini
      const incomingEdges = edges.filter((e) => e.target === n.id);
      const foreignKeys = incomingEdges.map((e) => {
        const sourceNode = stepNodes.find((sn) => sn.id === e.source);
        const refTable = sourceNode ? sanitizeName(sourceNode.data.title) : "parent_table";
        const fkCol = `${refTable}_id`;
        return { col: fkCol, refTable, label: e.label };
      });

      // Parse kolom dari deskripsi atau generate kolom standar profesional
      const descLines = (n.data?.description || "").split("\n").filter(Boolean);
      const customCols: { name: string; type: string; isPk?: boolean; isFk?: boolean }[] = [];

      for (const line of descLines) {
        const match = line.match(/^[-*•]?\s*([a-zA-Z0-9_]+)\s*[:(]?\s*([a-zA-Z0-9_()]+)?/);
        if (match && match[1]) {
          const colName = sanitizeName(match[1]);
          const colType = (match[2] || "VARCHAR(255)").toUpperCase();
          if (colName && colName !== "id") {
            customCols.push({ name: colName, type: colType });
          }
        }
      }

      return {
        id: n.id,
        rawTitle,
        tableName,
        owner: n.data?.owner,
        foreignKeys,
        customCols,
      };
    });

    if (dialect === "postgres") {
      let sql = `-- ====================================================================\n`;
      sql += `-- Database Schema DDL: ${flowTitle || "Zefflow Architecture"}\n`;
      sql += `-- Dialek: PostgreSQL 14+ / Supabase\n`;
      sql += `-- Dibuat otomatis oleh Zefflow Developer Studio\n`;
      sql += `-- ====================================================================\n\n`;
      sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;

      for (const t of tables) {
        sql += `-- Tabel: ${t.rawTitle}\n`;
        sql += `CREATE TABLE IF NOT EXISTS "${t.tableName}" (\n`;
        sql += `  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n`;

        // Foreign keys
        for (const fk of t.foreignKeys) {
          sql += `  "${fk.col}" UUID REFERENCES "${fk.refTable}"("id") ON DELETE CASCADE,\n`;
        }

        // Custom columns
        if (t.customCols.length > 0) {
          for (const col of t.customCols) {
            sql += `  "${col.name}" ${col.type},\n`;
          }
        } else {
          // Default columns if none specified
          sql += `  "name" VARCHAR(255) NOT NULL,\n`;
          sql += `  "status" VARCHAR(50) DEFAULT 'active',\n`;
        }

        if (t.owner) {
          sql += `  "pic_owner" VARCHAR(100) DEFAULT '${t.owner}',\n`;
        }

        sql += `  "created_at" TIMESTAMPTZ DEFAULT NOW(),\n`;
        sql += `  "updated_at" TIMESTAMPTZ DEFAULT NOW()\n`;
        sql += `);\n\n`;
      }

      return sql;
    }

    if (dialect === "mysql") {
      let sql = `-- ====================================================================\n`;
      sql += `-- Database Schema DDL: ${flowTitle || "Zefflow Architecture"}\n`;
      sql += `-- Dialek: MySQL 8.0+ / MariaDB\n`;
      sql += `-- ====================================================================\n\n`;

      for (const t of tables) {
        sql += `CREATE TABLE IF NOT EXISTS \`${t.tableName}\` (\n`;
        sql += `  \`id\` VARCHAR(36) PRIMARY KEY,\n`;

        for (const fk of t.foreignKeys) {
          sql += `  \`${fk.col}\` VARCHAR(36),\n`;
        }

        if (t.customCols.length > 0) {
          for (const col of t.customCols) {
            sql += `  \`${col.name}\` ${col.type},\n`;
          }
        } else {
          sql += `  \`name\` VARCHAR(255) NOT NULL,\n`;
          sql += `  \`status\` VARCHAR(50) DEFAULT 'active',\n`;
        }

        sql += `  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
        sql += `  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;

        // Foreign key constraints
        const fkClauses = t.foreignKeys.map(
          (fk) =>
            `  CONSTRAINT \`fk_${t.tableName}_${fk.refTable}\` FOREIGN KEY (\`${fk.col}\`) REFERENCES \`${fk.refTable}\`(\`id\`) ON DELETE CASCADE`,
        );

        if (fkClauses.length > 0) {
          sql += `${fkClauses.join(",\n")}\n`;
        } else {
          sql = sql.replace(/,\n$/, "\n");
        }

        sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      }

      return sql;
    }

    // Prisma Schema Dialect
    let prisma = `// ====================================================================\n`;
    prisma += `// Prisma Schema: ${flowTitle || "Zefflow Architecture"}\n`;
    prisma += `// ====================================================================\n\n`;
    prisma += `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n`;
    prisma += `generator client {\n  provider = "prisma-client-js"\n}\n\n`;

    for (const t of tables) {
      const modelName = t.tableName
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");

      prisma += `model ${modelName} {\n`;
      prisma += `  id        String   @id @default(uuid())\n`;

      for (const fk of t.foreignKeys) {
        const refModel = fk.refTable
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join("");
        prisma += `  ${fk.col}   String\n`;
        prisma += `  ${fk.refTable}   ${refModel} @relation(fields: [${fk.col}], references: [id], onDelete: Cascade)\n`;
      }

      if (t.customCols.length > 0) {
        for (const col of t.customCols) {
          prisma += `  ${col.name}  String?\n`;
        }
      } else {
        prisma += `  name      String\n`;
        prisma += `  status    String?  @default("active")\n`;
      }

      prisma += `  createdAt DateTime @default(now())\n`;
      prisma += `  updatedAt DateTime @updatedAt\n`;
      prisma += `}\n\n`;
    }

    return prisma;
  }, [stepNodes, edges, flowTitle, dialect]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("Skrip database berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = dialect === "prisma" ? "prisma" : "sql";
    const filename = `${(flowTitle || "schema").toLowerCase().replace(/[^a-z0-9]/g, "-")}.${ext}`;
    const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`File ${filename} berhasil diunduh!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-6 sm:top-10 md:top-12 translate-y-0 max-w-2xl p-0 overflow-hidden rounded-3xl border border-border/80 dark:border-white/[0.08] bg-card text-foreground shadow-2xl flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5rem)]">
        {/* Header Modal */}
        <div className="p-4 pb-2.5 sm:p-5 sm:pb-3 border-b border-border/70 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#11121C] shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-600 text-white shadow-[0_0_12px_rgba(2,132,199,0.5)]">
                <Database className="h-4 w-4" />
              </span>
              <span>Generator Skema Database &amp; SQL DDL</span>
            </DialogTitle>
          </div>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            Konversi tabel dan relasi alur diagram menjadi skrip DDL SQL siap eksekusi di Supabase, PostgreSQL, MySQL, atau Prisma.
          </DialogDescription>

          {/* Dialect Selector Tabs */}
          <div className="flex items-center gap-1.5 mt-3">
            <button
              type="button"
              onClick={() => setDialect("postgres")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                dialect === "postgres"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>PostgreSQL / Supabase</span>
            </button>
            <button
              type="button"
              onClick={() => setDialect("mysql")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                dialect === "mysql"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Database className="h-3.5 w-3.5" />
              <span>MySQL 8.0</span>
            </button>
            <button
              type="button"
              onClick={() => setDialect("prisma")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                dialect === "prisma"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Prisma ORM</span>
            </button>
          </div>
        </div>

        {/* Code Block Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-hidden flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono text-[11px] font-semibold">
              {stepNodes.length} tabel terdeteksi • {edges.length} relasi foreign key
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Tersalin!" : "Salin Kode"}</span>
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={handleDownload}
                className="h-8 gap-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh File</span>
              </Button>
            </div>
          </div>

          <div className="relative flex-1 rounded-2xl border border-border/80 dark:border-white/[0.08] bg-[#0A0B10] p-4 overflow-y-auto no-scrollbar font-mono text-xs text-zinc-200 leading-relaxed shadow-inner max-h-[380px]">
            <pre className="whitespace-pre-wrap">{generatedCode}</pre>
          </div>

          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0 mt-0.5" />
            <span>
              <strong>Tip Developer:</strong> Hubungkan garis antar bentuk di kanvas untuk otomatis membuat relasi Foreign Key (<code>REFERENCES</code>) di skrip SQL.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/70 dark:border-white/[0.08] px-4 py-2.5 sm:px-5 bg-slate-50/60 dark:bg-[#11121C] shrink-0">
          <span className="text-[11px] text-muted-foreground font-mono">
            Dialek Aktif: {dialect.toUpperCase()}
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

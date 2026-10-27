import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zefflow — Pembuat Diagram Swimlane & SOP Bisnis Interaktif",
  description:
    "Aplikasi SaaS modern untuk merancang Standard Operating Procedure (SOP) dan alur Customer Journey lintas divisi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("lf_theme");var theme=t==="light"?"light":"dark";document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(theme);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-violet-600/30 selection:text-white">
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster
            position="bottom-right"
            closeButton
          />
        </TooltipProvider>
      </body>
    </html>
  );
}

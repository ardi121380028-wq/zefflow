import { cn } from "@/lib/utils";

interface ZefflowLogoProps {
  /** "full" menampilkan ikon + teks Zefflow; "mark" hanya menampilkan ikon Z isometrik */
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  /** Label opsional di sebelah logo (mis. "STUDIO") */
  badge?: string;
  hideBadgeOnMobile?: boolean;
  className?: string;
  imgClassName?: string;
}

const FULL_HEIGHT_CLASS: Record<NonNullable<ZefflowLogoProps["size"]>, string> = {
  sm: "h-6 w-auto",
  md: "h-7 sm:h-[30px] w-auto",
  lg: "h-9 sm:h-10 w-auto",
};

const MARK_SIZE_CLASS: Record<NonNullable<ZefflowLogoProps["size"]>, string> = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-11 w-11",
};

export function ZefflowLogo({
  variant = "full",
  size = "md",
  badge,
  hideBadgeOnMobile = false,
  className,
  imgClassName,
}: ZefflowLogoProps) {
  if (variant === "mark") {
    return (
      <span className={cn("inline-flex shrink-0 items-center select-none", className)}>
        <img
          src="/brand/logo-mark.png"
          alt="Zefflow"
          width={48}
          height={48}
          decoding="async"
          draggable={false}
          className={cn("object-contain", MARK_SIZE_CLASS[size], imgClassName)}
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 select-none", className)}>
      {/* Light Mode Wordmark */}
      <img
        src="/brand/logo-light.png"
        alt="Zefflow"
        width={178}
        height={45}
        decoding="async"
        draggable={false}
        className={cn("block dark:hidden object-contain", FULL_HEIGHT_CLASS[size], imgClassName)}
      />
      {/* Dark Mode Wordmark */}
      <img
        src="/brand/logo-dark.png"
        alt="Zefflow"
        width={178}
        height={45}
        decoding="async"
        draggable={false}
        className={cn("hidden dark:block object-contain", FULL_HEIGHT_CLASS[size], imgClassName)}
      />
      {badge && (
        <span
          className={cn(
            "rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-violet-600 dark:text-violet-400",
            hideBadgeOnMobile && "hidden sm:inline-block",
          )}
        >
          {badge}
        </span>
      )}
    </span>
  );
}


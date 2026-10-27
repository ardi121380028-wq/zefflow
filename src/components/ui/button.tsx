import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Button ElevenLabs Studio style:
 * Pill-ish / rounded-xl, razor-thin borders, subtle top hairline highlight,
 * spring press transition, neon gradient glow on brand variant.
 */
const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold active:scale-[0.98] shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] border border-transparent",
        brand:
          "relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 text-white font-semibold hover:brightness-110 active:scale-[0.98] shadow-[0_0_24px_-2px_rgba(139,92,246,0.6),inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.25)] hover:shadow-[0_0_32px_0px_rgba(139,92,246,0.85),inset_0_1px_1px_rgba(255,255,255,0.6)] border border-white/20",
        studio:
          "relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 text-white font-semibold hover:brightness-110 active:scale-[0.98] shadow-[0_0_24px_-2px_rgba(139,92,246,0.6),inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.25)] hover:shadow-[0_0_32px_0px_rgba(139,92,246,0.85),inset_0_1px_1px_rgba(255,255,255,0.6)] border border-white/20",
        secondary:
          "border border-slate-200 dark:border-white/[0.08] bg-slate-100 hover:bg-slate-200/90 text-slate-800 dark:bg-[#141520] dark:hover:bg-[#1C1E2D] dark:text-zinc-200 dark:hover:text-white dark:hover:border-white/[0.16] shadow-sm dark:shadow-none active:scale-[0.98]",
        outline:
          "border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#12131F] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#1B1D2C] hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/[0.22] shadow-sm active:scale-[0.98]",
        ghost:
          "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#161826] hover:text-slate-900 dark:hover:text-white active:scale-[0.98]",
        destructive:
          "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-500/20 dark:hover:bg-rose-900/60 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        default: "h-9 px-4 text-xs rounded-xl",
        lg: "h-11 px-5 text-sm rounded-xl",
        icon: "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} disabled={disabled || loading} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

import type { StructuralLevel } from "@/lib/types";

export const DEFAULT_CHANNELS = ["ENE", "ENN", "ENZ"];
export const REFRESH_OPTIONS = [3, 5, 10, 30] as const;
export const MAX_WAVEFORM_POINTS = 240;

export const STATUS_STYLES: Record<
  StructuralLevel,
  { text: string; border: string; surface: string; dot: string; glow: string }
> = {
  normal: {
    text: "text-emerald-300",
    border: "border-emerald-400/25",
    surface: "bg-emerald-400/[0.07]",
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_28px_rgba(52,211,153,0.09)]",
  },
  attention: {
    text: "text-amber-300",
    border: "border-amber-400/30",
    surface: "bg-amber-400/[0.08]",
    dot: "bg-amber-400",
    glow: "shadow-[0_0_28px_rgba(251,191,36,0.1)]",
  },
  warning: {
    text: "text-rose-300",
    border: "border-rose-400/30",
    surface: "bg-rose-400/[0.08]",
    dot: "bg-rose-400",
    glow: "shadow-[0_0_32px_rgba(251,113,133,0.12)]",
  },
  unavailable: {
    text: "text-slate-300",
    border: "border-slate-600/60",
    surface: "bg-slate-500/[0.06]",
    dot: "bg-slate-400",
    glow: "",
  },
};

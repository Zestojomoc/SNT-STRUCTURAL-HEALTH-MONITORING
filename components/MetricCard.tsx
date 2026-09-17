import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  context: string;
  icon: LucideIcon;
  onClick: () => void;
  accent?: "default" | "positive" | "attention" | "negative";
}

const accents = {
  default: "text-sky-300 bg-sky-400/[0.08] border-sky-400/15",
  positive: "text-emerald-300 bg-emerald-400/[0.08] border-emerald-400/15",
  attention: "text-amber-300 bg-amber-400/[0.08] border-amber-400/15",
  negative: "text-rose-300 bg-rose-400/[0.08] border-rose-400/15",
};

export function MetricCard({
  title,
  value,
  unit,
  context,
  icon: Icon,
  onClick,
  accent = "default",
}: MetricCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="panel group min-h-[156px] w-full rounded-2xl p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-slate-500/35 hover:bg-slate-800/75 active:translate-y-0 sm:p-5"
      aria-label={`View details for ${title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex size-9 items-center justify-center rounded-lg border ${accents[accent]}`}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <Info
          className="size-4 text-slate-600 transition group-hover:text-slate-400"
          aria-hidden="true"
        />
      </div>
      <p className="mt-4 text-xs leading-tight font-medium text-slate-400">{title}</p>
      <div className="mt-1.5 flex min-w-0 items-baseline gap-1.5">
        <span className="metric-value truncate text-[1.65rem] leading-none font-semibold text-slate-50 sm:text-3xl">
          {value}
        </span>
        {unit && <span className="shrink-0 text-sm font-medium text-slate-400">{unit}</span>}
      </div>
      <p className="mt-2 truncate text-[11px] text-slate-500">{context}</p>
    </button>
  );
}

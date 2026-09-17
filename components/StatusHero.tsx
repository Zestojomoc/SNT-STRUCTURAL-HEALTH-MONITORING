import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { STATUS_STYLES } from "@/lib/constants";
import type { StructuralStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusIcon = {
  normal: CheckCircle2,
  attention: AlertTriangle,
  warning: AlertTriangle,
  unavailable: CircleDashed,
};

export function StatusHero({
  status,
  lastKnown,
}: {
  status: StructuralStatus;
  lastKnown: boolean;
}) {
  const styles = STATUS_STYLES[status.level];
  const Icon = statusIcon[status.level];
  return (
    <section
      className={cn(
        "panel relative overflow-hidden rounded-2xl p-5 sm:p-6 lg:p-7",
        styles.border,
        styles.surface,
        styles.glow,
      )}
      aria-labelledby="structural-status-title"
    >
      <div className="absolute top-0 right-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-white/[0.025] blur-xl" />
      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border sm:size-12",
            styles.border,
            styles.surface,
            styles.text,
          )}
        >
          <Icon className="size-5 sm:size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              id="structural-status-title"
              className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase sm:text-xs"
            >
              Structural status
            </p>
            {lastKnown && (
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                Last Known Reading
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <span
              className={cn("relative size-2.5 rounded-full", styles.dot, "connection-pulse")}
              aria-hidden="true"
            />
            <h2 className={cn("text-2xl font-bold tracking-tight sm:text-3xl", styles.text)}>
              {status.label}
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            {status.message}
          </p>
        </div>
      </div>
    </section>
  );
}

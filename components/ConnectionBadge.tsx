import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/lib/types";

const statePresentation: Record<
  ConnectionState,
  { label: string; dot: string; text: string; pulse: boolean }
> = {
  connecting: {
    label: "Connecting",
    dot: "bg-sky-400",
    text: "text-sky-200",
    pulse: true,
  },
  connected: {
    label: "Sensor Connected",
    dot: "bg-emerald-400",
    text: "text-emerald-200",
    pulse: true,
  },
  disconnected: {
    label: "Sensor Unavailable",
    dot: "bg-rose-400",
    text: "text-rose-200",
    pulse: false,
  },
  error: {
    label: "Connection Error",
    dot: "bg-rose-400",
    text: "text-rose-200",
    pulse: false,
  },
  paused: {
    label: "Monitoring Paused",
    dot: "bg-amber-400",
    text: "text-amber-200",
    pulse: false,
  },
};

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const presentation = statePresentation[state];
  return (
    <div
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-xs font-medium whitespace-nowrap",
        presentation.text,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex size-2.5" aria-hidden="true">
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            presentation.dot,
            presentation.pulse && "connection-pulse",
          )}
        />
      </span>
      <span className="hidden min-[365px]:inline">{presentation.label}</span>
      <span className="min-[365px]:hidden">
        {state === "connected" ? "Connected" : presentation.label}
      </span>
    </div>
  );
}

import { Pause, Play, RefreshCw } from "lucide-react";
import { REFRESH_OPTIONS } from "@/lib/constants";

interface MonitoringControlsProps {
  paused: boolean;
  refreshing: boolean;
  refreshSeconds: number;
  onTogglePause: () => void;
  onRefresh: () => void;
  onRefreshSecondsChange: (seconds: number) => void;
}

export function MonitoringControls({
  paused,
  refreshing,
  refreshSeconds,
  onTogglePause,
  onRefresh,
  onRefreshSecondsChange,
}: MonitoringControlsProps) {
  const ToggleIcon = paused ? Play : Pause;
  return (
    <section className="panel rounded-2xl p-4 sm:p-5" aria-labelledby="monitoring-controls-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="monitoring-controls-title" className="text-sm font-semibold text-slate-100">
            Monitoring
          </h2>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`size-1.5 rounded-full ${paused ? "bg-amber-400" : "bg-emerald-400"}`}
              aria-hidden="true"
            />
            {paused ? "Paused" : `Live · every ${refreshSeconds}s`}
          </p>
        </div>
        <label className="text-right text-[10px] font-medium tracking-wider text-slate-500 uppercase">
          Refresh
          <select
            value={refreshSeconds}
            onChange={(event) => onRefreshSecondsChange(Number(event.target.value))}
            className="mt-1 block min-h-11 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs tracking-normal text-slate-200 normal-case"
            aria-label="Monitoring refresh interval"
          >
            {REFRESH_OPTIONS.map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds} sec
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        <button
          type="button"
          onClick={onTogglePause}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-400 px-3 text-xs font-semibold text-slate-950 transition hover:bg-sky-300 active:scale-[0.98]"
        >
          <ToggleIcon className="size-4" aria-hidden="true" />
          {paused ? "Resume Monitoring" : "Pause Monitoring"}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          {refreshing ? "Refreshing…" : "Refresh Now"}
        </button>
      </div>
    </section>
  );
}

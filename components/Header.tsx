import { Activity, Radio } from "lucide-react";
import type { ConnectionState } from "@/lib/types";
import { formatLocalTime } from "@/lib/utils";
import { ConnectionBadge } from "@/components/ConnectionBadge";

interface HeaderProps {
  structureName: string;
  connectionState: ConnectionState;
  lastUpdate?: string;
  demoMode: boolean;
}

export function Header({
  structureName,
  connectionState,
  lastUpdate,
  demoMode,
}: HeaderProps) {
  return (
    <header className="border-b border-white/[0.07] bg-[#080d18]/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden size-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[0.08] text-sky-300 sm:flex">
            <Activity className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold tracking-wide text-slate-100 sm:text-base">
                <span className="sm:hidden">SHM Monitor</span>
                <span className="hidden sm:inline">Structural Health Monitor</span>
              </h1>
              {demoMode && (
                <span className="hidden rounded-md border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-violet-200 uppercase min-[430px]:inline">
                  Demo Data
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-400">{structureName}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {lastUpdate && (
            <div className="hidden text-right lg:block">
              <p className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                Last update
              </p>
              <p className="mt-0.5 font-mono text-xs text-slate-300">
                {formatLocalTime(lastUpdate)}
              </p>
            </div>
          )}
          <ConnectionBadge state={connectionState} />
          <Radio className="hidden size-4 text-slate-600 md:block" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

import { AlertTriangle, X } from "lucide-react";

export function StatusNotice({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      className="fixed right-4 bottom-4 left-4 z-40 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-amber-400/25 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-lg sm:right-6 sm:bottom-6 sm:left-auto"
      role="status"
      aria-live="polite"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-100">Monitoring status changed</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
        aria-label="Dismiss notification"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

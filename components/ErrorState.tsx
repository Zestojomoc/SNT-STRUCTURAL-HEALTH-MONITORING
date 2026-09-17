import { RefreshCw, WifiOff } from "lucide-react";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="panel rounded-2xl border-rose-400/20 p-6 text-center sm:p-10" role="alert">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/[0.07] text-rose-300">
        <WifiOff className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-100">Sensor Unavailable</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 active:scale-[0.98]"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Retry Connection
      </button>
    </section>
  );
}

import { ShieldAlert } from "lucide-react";

export function InfoPanel() {
  return (
    <aside className="flex gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 text-xs leading-5 text-slate-500">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
      <p>
        This dashboard provides monitoring indicators based on measured structural vibration
        response and configured reference values. Derived indicators do not replace professional
        structural inspection.
      </p>
    </aside>
  );
}

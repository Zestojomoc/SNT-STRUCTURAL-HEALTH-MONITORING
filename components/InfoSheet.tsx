"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { MetricKey, MonitoringResponse } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

function DetailContent({ metric, data }: { metric: MetricKey; data: MonitoringResponse }) {
  const difference =
    data.frequency.current_hz === null || data.frequency.baseline_hz === null
      ? null
      : data.frequency.current_hz - data.frequency.baseline_hz;

  if (metric === "peak") {
    return (
      <>
        <h2 className="text-lg font-semibold text-slate-50">Peak Acceleration</h2>
        <p className="mt-1 text-sm text-slate-400">Processed vibration response</p>
        <dl className="mt-6 grid grid-cols-2 gap-3">
          <Detail label="Peak" value={`${formatNumber(data.signal.peak_acceleration, 5)} g`} />
          <Detail label="RMS" value={`${formatNumber(data.signal.rms_acceleration, 5)} g`} />
          <Detail label="Sample rate" value={`${formatNumber(data.signal.sample_rate_hz, 0)} Hz`} />
          <Detail label="Channel" value={data.sensor.channel} />
        </dl>
        <p className="mt-5 text-sm leading-6 text-slate-400">
          Peak and RMS values are processed from the calibrated acceleration waveform after
          detrending and band-pass filtering.
        </p>
      </>
    );
  }

  if (metric === "frequency") {
    return (
      <>
        <h2 className="text-lg font-semibold text-slate-50">Natural Frequency</h2>
        <p className="mt-1 text-sm text-slate-400">Processed dominant response frequency</p>
        <dl className="mt-6 grid grid-cols-2 gap-3">
          <Detail label="Current" value={`${formatNumber(data.frequency.current_hz, 3)} Hz`} />
          <Detail
            label="Baseline"
            value={
              data.frequency.baseline_hz === null
                ? "Not configured"
                : `${formatNumber(data.frequency.baseline_hz, 3)} Hz`
            }
          />
          <Detail label="Difference" value={`${formatNumber(difference, 3, true)} Hz`} />
          <Detail
            label="Change"
            value={`${formatNumber(data.frequency.change_percent, 2, true)}%`}
          />
        </dl>
        <p className="mt-5 text-sm leading-6 text-slate-400">
          The current value is the dominant spectral peak in the tracking window around the
          configured mode, compared with the {data.frequency.reference_type} reference:
          {" "}{data.frequency.reference_label}.
        </p>
      </>
    );
  }

  if (metric === "frequencyChange") {
    return (
      <>
        <h2 className="text-lg font-semibold text-slate-50">Frequency Change</h2>
        <p className="mt-1 text-sm text-slate-400">Derived baseline comparison</p>
        <div className="mt-6 rounded-xl border border-slate-700/70 bg-black/20 p-4 font-mono text-sm text-sky-200">
          ((current − baseline) / baseline) × 100
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <Detail
            label="Result"
            value={`${formatNumber(data.frequency.change_percent, 2, true)}%`}
          />
          <Detail label="Difference" value={`${formatNumber(difference, 3, true)} Hz`} />
        </dl>
        <p className="mt-5 text-sm leading-6 text-slate-400">
          This is a derived indicator. Both frequency decreases and increases are evaluated by
          magnitude against the configured monitoring thresholds.
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-slate-50">Estimated Stiffness Change</h2>
      <p className="mt-1 text-sm text-slate-400">Derived engineering estimate</p>
      <div className="mt-6 rounded-xl border border-slate-700/70 bg-black/20 p-4 font-mono text-sm text-sky-200">
        [(f current / f baseline)² − 1] × 100
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <Detail
          label="Estimated change"
          value={`${formatNumber(data.stiffness.estimated_change_percent, 2, true)}%`}
        />
        <Detail
          label="Frequency ratio"
          value={
            data.frequency.current_hz === null || data.frequency.baseline_hz === null
              ? "—"
              : formatNumber(data.frequency.current_hz / data.frequency.baseline_hz, 4)
          }
        />
      </dl>
      <p className="mt-5 text-sm leading-6 text-slate-400">
        Estimated from the change in natural frequency under the assumption that effective
        structural mass remains approximately constant. This is not a direct stiffness
        measurement.
      </p>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
      <dt className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1.5 font-mono text-sm text-slate-200">{value}</dd>
    </div>
  );
}

export function InfoSheet({
  metric,
  data,
  onClose,
}: {
  metric: MetricKey | null;
  data: MonitoringResponse;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!metric) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [metric, onClose]);

  if (!metric) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close metric details"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Metric details"
        className="safe-bottom relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-slate-700/80 bg-[#101a2a] p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700 sm:hidden" />
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-200"
          aria-label="Close"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="pr-10">
          <DetailContent metric={metric} data={data} />
        </div>
      </section>
    </div>
  );
}

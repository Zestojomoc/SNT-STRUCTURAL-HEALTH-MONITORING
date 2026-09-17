import { Clock3, Cpu, MapPin, RadioTower, TimerReset } from "lucide-react";
import type { SensorInfo } from "@/lib/types";
import { formatDelay, formatLocalTime } from "@/lib/utils";

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5 text-slate-500">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="max-w-[58%] truncate text-right font-mono text-xs text-slate-300">{value}</span>
    </div>
  );
}

export function SensorDetails({ sensor }: { sensor: SensorInfo }) {
  return (
    <section className="panel rounded-2xl p-4 sm:p-5" aria-labelledby="sensor-details-title">
      <h2 id="sensor-details-title" className="text-sm font-semibold text-slate-100">
        Sensor Details
      </h2>
      <div className="mt-3 divide-y divide-white/[0.06]">
        <DetailRow icon={Cpu} label="Sensor" value={sensor.model} />
        <DetailRow icon={Cpu} label="Station" value={sensor.station} />
        <DetailRow icon={MapPin} label="Site" value={sensor.site} />
        <DetailRow
          icon={RadioTower}
          label="Stream"
          value={`${sensor.network}.${sensor.station}.${sensor.location}.${sensor.channel}`}
        />
        <DetailRow icon={Clock3} label="Sensor time" value={formatLocalTime(sensor.last_update)} />
        <DetailRow icon={TimerReset} label="Request latency" value={`${sensor.latency_ms} ms`} />
        <DetailRow icon={Clock3} label="Source timing" value={formatDelay(sensor.data_delay_seconds)} />
      </div>
    </section>
  );
}

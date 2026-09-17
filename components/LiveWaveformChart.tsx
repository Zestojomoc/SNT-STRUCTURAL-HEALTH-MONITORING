"use client";

import { Activity } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WaveformPoint } from "@/lib/types";
import { ChannelSelector } from "@/components/ChannelSelector";

interface LiveWaveformChartProps {
  data: WaveformPoint[];
  channels: string[];
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  disabled?: boolean;
}

export function LiveWaveformChart({
  data,
  channels,
  selectedChannel,
  onChannelChange,
  disabled,
}: LiveWaveformChartProps) {
  return (
    <section className="panel min-w-0 rounded-2xl p-4 sm:p-5 lg:p-6" aria-labelledby="waveform-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-sky-300" aria-hidden="true" />
            <h2 id="waveform-title" className="text-sm font-semibold text-slate-100 sm:text-base">
              Live Structural Response
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">Filtered acceleration · recent window</p>
        </div>
        <ChannelSelector
          channels={channels}
          selected={selectedChannel}
          onChange={onChannelChange}
          disabled={disabled}
        />
      </div>

      <div className="mt-5 h-[245px] min-w-0 sm:h-[310px] lg:h-[360px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(value: number) => `${Math.round(value)}s`}
                stroke="rgba(148,163,184,0.42)"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                minTickGap={32}
              />
              <YAxis
                width={54}
                tickFormatter={(value: number) => value.toExponential(1)}
                stroke="rgba(148,163,184,0.42)"
                tick={{ fontSize: 9, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />
              <ReferenceLine y={0} stroke="rgba(148,163,184,0.24)" />
              <Tooltip
                cursor={{ stroke: "rgba(125,211,252,0.25)", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const value = Number(payload[0]?.value);
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 shadow-xl">
                      <p className="text-[10px] text-slate-500">{Number(label).toFixed(2)} sec</p>
                      <p className="mt-0.5 font-mono text-xs text-sky-200">
                        {value.toFixed(6)} g
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700/70 bg-black/10 text-sm text-slate-500">
            No waveform available
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-[10px] text-slate-600">
        <span>Time before latest sample</span>
        <span>Acceleration (g)</span>
      </div>
    </section>
  );
}

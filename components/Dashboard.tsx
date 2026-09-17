"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Gauge, MoveDownRight, Waves } from "lucide-react";
import { fetchMonitoring, fetchPublicConfig } from "@/lib/api";
import { DEFAULT_CHANNELS, MAX_WAVEFORM_POINTS } from "@/lib/constants";
import type {
  ConnectionState,
  MetricKey,
  MonitoringResponse,
  PublicConfig,
  StructuralLevel,
} from "@/lib/types";
import { formatLocalTime, formatNumber } from "@/lib/utils";
import { ErrorState } from "@/components/ErrorState";
import { Header } from "@/components/Header";
import { InfoPanel } from "@/components/InfoPanel";
import { InfoSheet } from "@/components/InfoSheet";
import { LiveWaveformChart } from "@/components/LiveWaveformChart";
import { LoadingDashboard } from "@/components/LoadingDashboard";
import { MetricCard } from "@/components/MetricCard";
import { MonitoringControls } from "@/components/MonitoringControls";
import { SensorDetails } from "@/components/SensorDetails";
import { StatusHero } from "@/components/StatusHero";
import { StatusNotice } from "@/components/StatusNotice";

function metricAccent(value: number | null): "default" | "positive" | "attention" | "negative" {
  if (value === null || Math.abs(value) < 0.01) return "default";
  if (value > 0) return "positive";
  return Math.abs(value) >= 10 ? "negative" : "attention";
}

export function Dashboard() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [selectedChannel, setSelectedChannel] = useState(DEFAULT_CHANNELS[2]);
  const [refreshSeconds, setRefreshSeconds] = useState(5);
  const [paused, setPaused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [activeMetric, setActiveMetric] = useState<MetricKey | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const previousStatusRef = useRef<StructuralLevel | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channels = config?.available_channels?.length
    ? config.available_channels
    : DEFAULT_CHANNELS;

  useEffect(() => {
    const controller = new AbortController();
    fetchPublicConfig(controller.signal)
      .then((nextConfig) => {
        setConfig(nextConfig);
        setRefreshSeconds(nextConfig.default_refresh_interval_seconds);
        setSelectedChannel((current) =>
          nextConfig.available_channels.includes(current)
            ? current
            : (nextConfig.available_channels[0] ?? DEFAULT_CHANNELS[2]),
        );
      })
      .catch(() => {
        // The monitor request provides enough information to keep the dashboard useful.
      });
    return () => controller.abort();
  }, []);

  const loadReading = useCallback(async () => {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setRefreshing(true);
    try {
      const nextData = await fetchMonitoring(selectedChannel, controller.signal);
      nextData.waveform = nextData.waveform.slice(-MAX_WAVEFORM_POINTS);
      setData(nextData);
      setError(null);
      setConnectionState(paused ? "paused" : "connected");
    } catch (requestError) {
      if (controller.signal.aborted) return;
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to retrieve current monitoring data.";
      setError(message);
      setConnectionState("disconnected");
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      setRefreshing(false);
    }
  }, [paused, selectedChannel]);

  useEffect(() => {
    if (paused) {
      setConnectionState("paused");
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (!document.hidden) await loadReading();
      if (!cancelled) timer = setTimeout(tick, refreshSeconds * 1000);
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [loadReading, paused, refreshSeconds]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden && !paused) void loadReading();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadReading, paused]);

  useEffect(() => {
    if (!data) return;
    const previous = previousStatusRef.current;
    if (previous && previous !== data.status.level) {
      setStatusNotice(data.status.message);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = setTimeout(() => setStatusNotice(null), 6000);
    }
    previousStatusRef.current = data.status.level;
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, [data]);

  useEffect(
    () => () => {
      requestRef.current?.abort();
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    },
    [],
  );

  const changeChannel = useCallback((channel: string) => {
    requestRef.current?.abort();
    requestRef.current = null;
    setSelectedChannel(channel);
    setConnectionState("connecting");
  }, []);

  const togglePause = useCallback(() => {
    setPaused((current) => {
      const next = !current;
      setConnectionState(next ? "paused" : "connecting");
      return next;
    });
  }, []);

  const structureName = data?.structure_name ?? config?.structure_name ?? "Monitored Structure";
  const demoMode = data?.mode === "demo" || (!data && config?.demo_mode === true);
  const lastKnown = Boolean(data && error);

  const metrics = useMemo(() => {
    if (!data) return null;
    return [
      {
        key: "peak" as const,
        title: "Peak Acceleration",
        value: formatNumber(data.signal.peak_acceleration, 5),
        unit: "g",
        context: `RMS ${formatNumber(data.signal.rms_acceleration, 5)} g`,
        icon: Gauge,
        accent: "default" as const,
      },
      {
        key: "frequency" as const,
        title: "Natural Frequency",
        value: formatNumber(data.frequency.current_hz, 2),
        unit: "Hz",
        context:
          data.frequency.baseline_hz === null
            ? "Baseline not configured"
            : `Baseline ${formatNumber(data.frequency.baseline_hz, 2)} Hz`,
        icon: Waves,
        accent: "default" as const,
      },
      {
        key: "frequencyChange" as const,
        title: "Frequency Change",
        value: formatNumber(data.frequency.change_percent, 2, true),
        unit: "%",
        context: "Derived from reference baseline",
        icon: MoveDownRight,
        accent: metricAccent(data.frequency.change_percent),
      },
      {
        key: "stiffness" as const,
        title: "Estimated Stiffness Change",
        value: formatNumber(data.stiffness.estimated_change_percent, 2, true),
        unit: "%",
        context: "Estimate · constant effective mass",
        icon: Activity,
        accent: metricAccent(data.stiffness.estimated_change_percent),
      },
    ];
  }, [data]);

  return (
    <div className="min-h-screen">
      <Header
        structureName={structureName}
        connectionState={connectionState}
        lastUpdate={data?.sensor.last_update}
        demoMode={demoMode}
      />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        {!data && !error && <LoadingDashboard />}
        {!data && error && <ErrorState message={error} onRetry={() => void loadReading()} />}

        {data && metrics && (
          <div className="space-y-4 sm:space-y-5">
            {demoMode && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-400/20 bg-violet-400/[0.07] px-4 py-3 text-xs text-violet-200">
                <span className="font-medium">Simulation Mode · synthetic vibration data</span>
                <span className="hidden text-violet-300/70 sm:inline">Not a live sensor reading</span>
              </div>
            )}

            {error && (
              <div
                className="flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                role="alert"
              >
                <div>
                  <p className="text-xs font-semibold text-amber-200">Showing last known reading</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {error} Last successful update: {formatLocalTime(data.sensor.last_update)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadReading()}
                  className="min-h-10 shrink-0 rounded-lg border border-amber-300/20 px-4 text-xs font-semibold text-amber-100 hover:bg-amber-300/10"
                >
                  Retry
                </button>
              </div>
            )}

            <StatusHero status={data.status} lastKnown={lastKnown} />

            <section
              className="grid grid-cols-1 gap-3 min-[350px]:grid-cols-2 lg:grid-cols-4"
              aria-label="Current monitoring metrics"
            >
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.key}
                  title={metric.title}
                  value={metric.value}
                  unit={metric.unit}
                  context={metric.context}
                  icon={metric.icon}
                  accent={metric.accent}
                  onClick={() => setActiveMetric(metric.key)}
                />
              ))}
            </section>

            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5">
              <LiveWaveformChart
                data={data.waveform}
                channels={channels}
                selectedChannel={selectedChannel}
                onChannelChange={changeChannel}
                disabled={refreshing || paused}
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:content-start">
                <MonitoringControls
                  paused={paused}
                  refreshing={refreshing}
                  refreshSeconds={refreshSeconds}
                  onTogglePause={togglePause}
                  onRefresh={() => void loadReading()}
                  onRefreshSecondsChange={setRefreshSeconds}
                />
                <SensorDetails sensor={data.sensor} />
              </div>
            </div>

            <InfoPanel />
          </div>
        )}
      </main>

      {data && <InfoSheet metric={activeMetric} data={data} onClose={() => setActiveMetric(null)} />}
      {statusNotice && (
        <StatusNotice message={statusNotice} onClose={() => setStatusNotice(null)} />
      )}
    </div>
  );
}

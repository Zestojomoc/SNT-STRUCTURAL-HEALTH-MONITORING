export type StructuralLevel = "normal" | "attention" | "warning" | "unavailable";
export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"
  | "paused";

export interface SensorInfo {
  connected: boolean;
  model: string;
  site: string;
  latitude: number;
  longitude: number;
  station: string;
  network: string;
  location: string;
  channel: string;
  last_update: string;
  latency_ms: number;
  source: "demo" | "raspberry_shake";
  data_delay_seconds: number;
}

export interface SignalMetrics {
  peak_acceleration: number;
  rms_acceleration: number;
  unit: "g";
  sample_rate_hz: number;
}

export interface FrequencyMetrics {
  current_hz: number | null;
  baseline_hz: number | null;
  change_percent: number | null;
  reference_type: string;
  reference_label: string;
}

export interface StiffnessMetrics {
  estimated_change_percent: number | null;
  method: "frequency_ratio_constant_effective_mass";
}

export interface StructuralStatus {
  level: StructuralLevel;
  label: string;
  message: string;
  provisional: boolean;
}

export interface WaveformPoint {
  time: number;
  value: number;
}

export interface MonitoringResponse {
  timestamp: string;
  mode: "demo" | "real";
  structure_name: string;
  sensor: SensorInfo;
  signal: SignalMetrics;
  frequency: FrequencyMetrics;
  stiffness: StiffnessMetrics;
  status: StructuralStatus;
  waveform: WaveformPoint[];
}

export interface PublicConfig {
  structure_name: string;
  baseline_frequencies_hz: Record<string, number | null>;
  reference_type: string;
  reference_label: string;
  available_channels: string[];
  default_refresh_interval_seconds: number;
  demo_mode: boolean;
  data_delay_seconds: number;
}

export type MetricKey = "peak" | "frequency" | "frequencyChange" | "stiffness";

import type { MonitoringResponse, PublicConfig } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isMonitoringResponse(value: unknown): value is MonitoringResponse {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<MonitoringResponse>;
  return Boolean(
    typeof result.timestamp === "string" &&
      typeof result.structure_name === "string" &&
      result.sensor &&
      typeof result.sensor.channel === "string" &&
      result.signal &&
      typeof result.signal.peak_acceleration === "number" &&
      result.frequency &&
      result.stiffness &&
      result.status &&
      typeof result.status.level === "string" &&
      Array.isArray(result.waveform),
  );
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
  } catch {
    // Fall through to a stable user-facing message.
  }
  return "The monitoring service could not complete the request.";
}

export async function fetchMonitoring(
  channel: string,
  signal?: AbortSignal,
): Promise<MonitoringResponse> {
  const response = await fetch(`/api/monitor?channel=${encodeURIComponent(channel)}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
  const result: unknown = await response.json();
  if (!isMonitoringResponse(result)) {
    throw new ApiError("The monitoring service returned an invalid response.", 502);
  }
  return result;
}

export async function fetchPublicConfig(signal?: AbortSignal): Promise<PublicConfig> {
  const response = await fetch("/api/config", {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
  return (await response.json()) as PublicConfig;
}

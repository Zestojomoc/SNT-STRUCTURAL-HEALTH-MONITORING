import { ExternalLink, MapPin, RadioTower } from "lucide-react";
import type { SensorInfo } from "@/lib/types";

const MAP_HALF_WIDTH = 0.21;
const MAP_HALF_HEIGHT = 0.15;

function coordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(5)}° ${value >= 0 ? positive : negative}`;
}

function osmEmbedUrl(latitude: number, longitude: number) {
  const bounds = [
    longitude - MAP_HALF_WIDTH,
    latitude - MAP_HALF_HEIGHT,
    longitude + MAP_HALF_WIDTH,
    latitude + MAP_HALF_HEIGHT,
  ].map((value) => value.toFixed(6));

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.join("%2C")}&layer=mapnik`;
}

function stationViewUrl(latitude: number, longitude: number, station: string) {
  return `https://stationview.raspberryshake.org/#/?lat=${latitude.toFixed(5)}&lon=${longitude.toFixed(5)}&zoom=8.888&sta=${encodeURIComponent(station)}`;
}

export function StationMap({ sensor }: { sensor: SensorInfo }) {
  const stream = `${sensor.network}.${sensor.station}.${sensor.location}`;
  const embedUrl = osmEmbedUrl(sensor.latitude, sensor.longitude);
  const stationUrl = stationViewUrl(sensor.latitude, sensor.longitude, sensor.station);

  return (
    <section className="panel overflow-hidden rounded-2xl" aria-labelledby="station-map-title">
      <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[0.08] text-sky-300">
            <MapPin className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="station-map-title" className="text-sm font-semibold text-slate-100">
              Station Location
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Morong, Rizal · live geographic reference centered on RA909
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          <span className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 font-mono text-xs text-sky-200">
            {stream}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-xs font-medium text-emerald-300">
            <span className="station-location-blink size-1.5 rounded-full bg-emerald-400" />
            Station position
          </span>
        </div>
      </div>

      <div className="relative h-[330px] overflow-hidden bg-[#06111e] sm:h-[410px] lg:h-[470px]">
        <iframe
          src={embedUrl}
          title={`OpenStreetMap showing the area around ${sensor.station}`}
          className="pointer-events-none absolute inset-0 size-full scale-[1.015] border-0 opacity-90 [filter:grayscale(0.2)_invert(0.92)_hue-rotate(180deg)_brightness(0.68)_contrast(1.22)_saturate(0.78)]"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,11,20,0.16),rgba(2,11,20,0.30)),radial-gradient(circle_at_center,transparent_20%,rgba(2,11,20,0.38)_100%)]"
          aria-hidden="true"
        />

        <div className="absolute top-3 left-3 rounded-lg border border-sky-300/15 bg-slate-950/80 px-3 py-2 text-[10px] font-medium tracking-[0.12em] text-sky-200 uppercase shadow-lg backdrop-blur-md sm:top-4 sm:left-4">
          OpenStreetMap basemap
        </div>

        <a
          href={stationUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-slate-950/85 px-3 py-2 text-xs font-medium text-slate-200 shadow-lg backdrop-blur-md transition hover:border-sky-300/30 hover:text-sky-200 sm:top-4 sm:right-4"
          aria-label={`Open ${sensor.station} in Raspberry Shake StationView`}
        >
          View full map
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>

        <div
          className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          aria-label={`${sensor.station} at ${sensor.latitude}, ${sensor.longitude}`}
        >
          <span className="station-location-pulse absolute -inset-8 rounded-full border border-sky-300/45 bg-sky-300/[0.06]" />
          <span className="station-location-pulse absolute -inset-4 rounded-full border border-sky-300/65 bg-sky-300/[0.08]" />
          <span className="station-location-blink relative flex size-12 items-center justify-center rounded-full border-2 border-sky-100 bg-sky-400 text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.9)]">
            <RadioTower className="size-6" aria-hidden="true" />
          </span>
          <span className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-sky-300/25 bg-slate-950/90 px-3 py-2 text-center shadow-xl backdrop-blur">
            <strong className="block font-mono text-xs text-sky-200">{sensor.station}</strong>
            <span className="mt-0.5 block text-[10px] text-slate-400">Morong, Rizal</span>
          </span>
        </div>

        <div className="absolute right-3 bottom-3 left-3 flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-slate-950/85 px-3 py-2.5 shadow-xl backdrop-blur-md sm:right-auto sm:bottom-4 sm:left-4 sm:min-w-80 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
              Published coordinates
            </p>
            <p className="mt-1 font-mono text-xs text-slate-200">
              {coordinate(sensor.latitude, "N", "S")} · {coordinate(sensor.longitude, "E", "W")}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[9px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
              Location
            </p>
            <p className="mt-1 text-xs text-slate-300">Morong, Rizal, Philippines</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] px-4 py-3 text-[10px] text-slate-500 sm:px-5">
        <span>{sensor.model} · station-centered regional map</span>
        <span>
          Map data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-sky-300"
          >
            OpenStreetMap contributors
          </a>
        </span>
      </div>
    </section>
  );
}

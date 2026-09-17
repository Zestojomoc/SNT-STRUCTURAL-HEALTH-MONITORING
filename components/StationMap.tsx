import { MapPin, RadioTower } from "lucide-react";
import type { SensorInfo } from "@/lib/types";

const MAP_BOUNDS = {
  north: 14.92,
  east: 121.5,
  south: 14.07,
  west: 120.82,
};

function coordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(5)}° ${value >= 0 ? positive : negative}`;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function StationMap({ sensor }: { sensor: SensorInfo }) {
  const markerLeft = clamp(
    ((sensor.longitude - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100,
  );
  const markerTop = clamp(
    ((MAP_BOUNDS.north - sensor.latitude) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100,
  );
  const stream = `${sensor.network}.${sensor.station}.${sensor.location}`;

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
              Custom regional view · marker plotted from published station coordinates
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

      <div className="relative h-[300px] overflow-hidden bg-[#06111e] sm:h-[380px] lg:h-[440px]">
        <svg
          viewBox="0 0 1000 560"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          role="img"
          aria-label="Schematic regional map of Metro Manila and Rizal"
        >
          <defs>
            <linearGradient id="map-water" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#071a29" />
              <stop offset="1" stopColor="#0b2a3b" />
            </linearGradient>
            <linearGradient id="map-land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1a303c" />
              <stop offset="0.55" stopColor="#132b38" />
              <stop offset="1" stopColor="#0d2230" />
            </linearGradient>
            <pattern id="map-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path
                d="M 100 0 L 0 0 0 100"
                fill="none"
                stroke="#7dd3fc"
                strokeOpacity="0.11"
                strokeWidth="1"
              />
            </pattern>
            <filter id="map-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          <rect width="1000" height="560" fill="url(#map-land)" />

          {/* Manila Bay and the western coastline */}
          <path
            d="M0,-10 L160,-10 C176,37 198,66 220,95 C244,127 264,169 262,205 C259,239 282,260 305,278 C279,307 239,318 200,334 C151,354 105,392 72,443 L0,474 Z"
            fill="url(#map-water)"
            stroke="#3b6274"
            strokeWidth="2"
          />
          <path
            d="M72,443 C117,399 165,370 210,349 C258,328 300,323 335,294"
            fill="none"
            stroke="#5a7888"
            strokeOpacity="0.55"
            strokeWidth="2"
          />

          {/* Laguna de Bay with the long peninsula visible in the reference */}
          <path
            d="M421,266 C475,245 552,243 616,259 C692,278 770,310 810,359 C847,404 833,467 789,510 C757,541 723,559 684,580 L393,580 C374,531 373,470 385,414 C397,360 409,302 421,266 Z"
            fill="url(#map-water)"
            stroke="#3b6274"
            strokeWidth="2.5"
          />
          <path
            d="M574,276 C606,287 631,314 633,350 C635,390 626,424 644,462 C658,492 656,524 631,552 C614,528 603,488 599,452 C594,410 581,379 566,348 C555,323 557,295 574,276 Z"
            fill="#132b38"
            stroke="#3b6274"
            strokeWidth="2"
          />

          {/* Mountain contours across Rizal and the Sierra Madre corridor */}
          <g fill="none" stroke="#7dd3fc" strokeOpacity="0.11" strokeWidth="2">
            <path d="M548,32 C638,61 698,102 752,162 C811,227 858,246 1010,254" />
            <path d="M579,12 C683,44 753,88 807,145 C866,207 918,220 1014,222" />
            <path d="M586,80 C665,111 722,151 767,209 C805,258 856,278 999,288" />
            <path d="M628,113 C701,144 747,181 786,228 C830,281 886,306 1007,320" />
            <path d="M706,25 C778,55 833,94 879,143 C921,188 956,199 1012,203" />
            <path d="M688,338 C756,349 817,375 868,417 C913,453 958,465 1010,467" />
            <path d="M714,372 C775,386 826,409 875,450 C920,487 958,501 1010,508" />
          </g>

          {/* Administrative edges and primary road corridors */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M287,32 C318,89 316,151 330,209 C341,254 353,303 371,352 C389,402 392,463 384,558"
              stroke="#fb7185"
              strokeOpacity="0.55"
              strokeWidth="3"
            />
            <path
              d="M306,168 C371,179 429,201 479,233 C526,263 557,277 611,269 C658,263 706,278 759,305"
              stroke="#fb923c"
              strokeOpacity="0.8"
              strokeWidth="4"
            />
            <path
              d="M332,232 C395,220 465,223 526,250 C562,266 584,277 611,269"
              stroke="#fbbf24"
              strokeOpacity="0.7"
              strokeWidth="2.5"
            />
            <path
              d="M608,269 C626,302 651,321 685,329 C723,337 748,356 770,386"
              stroke="#fb923c"
              strokeOpacity="0.7"
              strokeWidth="3"
            />
            <path
              d="M225,354 C282,338 337,341 384,369 C417,389 444,419 460,458 C472,487 477,526 473,560"
              stroke="#fb923c"
              strokeOpacity="0.64"
              strokeWidth="3"
            />
            <path
              d="M237,70 C300,105 351,139 392,180 C426,214 459,249 496,281"
              stroke="#fbbf24"
              strokeOpacity="0.45"
              strokeWidth="2"
            />
            <path
              d="M524,174 C559,204 589,233 611,269 C634,307 666,323 708,331"
              stroke="#fbbf24"
              strokeOpacity="0.48"
              strokeWidth="2"
            />
          </g>

          {/* Dense Metro Manila road texture */}
          <g fill="none" stroke="#facc15" strokeOpacity="0.18" strokeWidth="1.4">
            <path d="M266,112 L408,290" />
            <path d="M285,95 L430,270" />
            <path d="M298,74 L451,252" />
            <path d="M313,58 L468,234" />
            <path d="M250,141 L439,140" />
            <path d="M261,166 L461,166" />
            <path d="M273,192 L477,192" />
            <path d="M286,218 L488,218" />
            <path d="M300,245 L500,245" />
            <path d="M320,270 L506,270" />
          </g>

          <rect width="1000" height="560" fill="url(#map-grid)" />

          <g fontFamily="ui-sans-serif, system-ui" fontSize="14" fill="#9fb3c0">
            <text x="266" y="119">Quezon City</text>
            <text x="345" y="170">San Juan</text>
            <text x="410" y="177">Marikina</text>
            <text x="478" y="207">Antipolo</text>
            <text x="438" y="240">Pasig · Cainta</text>
            <text x="480" y="266">Taytay</text>
            <text x="500" y="294">Angono</text>
            <text x="521" y="337">Binangonan</text>
            <text x="608" y="245" fill="#d6e2e8" fontWeight="600">Baras</text>
            <text x="659" y="290">Tanay</text>
            <text x="595" y="319">Cardona</text>
            <text x="193" y="385">Cavite</text>
            <text x="301" y="454">Muntinlupa</text>
            <text x="334" y="503">Biñan · Calamba</text>
          </g>
          <g fontFamily="ui-sans-serif, system-ui" fontSize="17" fontWeight="600">
            <text x="305" y="308" fill="#cbd5e1">METRO MANILA</text>
            <text x="690" y="122" fill="#cbd5e1">RIZAL</text>
            <text x="470" y="445" fill="#7295a7">LAGUNA DE BAY</text>
            <text x="75" y="245" fill="#52778b" letterSpacing="4">MANILA BAY</text>
          </g>

          <g fill="#7691a0" fontFamily="ui-monospace, monospace" fontSize="12">
            <text x="12" y="23">14.9° N</text>
            <text x="12" y="155">14.7° N</text>
            <text x="12" y="287">14.5° N</text>
            <text x="12" y="419">14.3° N</text>
            <text x="98" y="545">120.9° E</text>
            <text x="392" y="545">121.1° E</text>
            <text x="686" y="545">121.3° E</text>
            <text x="919" y="545">121.5° E</text>
          </g>
          <g transform="translate(930 38)">
            <path d="M0,28 L10,0 L20,28 L10,22 Z" fill="#7dd3fc" />
            <text
              x="10"
              y="46"
              textAnchor="middle"
              fill="#94a3b8"
              fontFamily="ui-sans-serif, system-ui"
              fontSize="14"
            >
              N
            </text>
          </g>
          <circle cx="605" cy="268" r="26" fill="#38bdf8" fillOpacity="0.12" filter="url(#map-soft-glow)" />
        </svg>

        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%` }}
          aria-label={`${sensor.station} at ${sensor.latitude}, ${sensor.longitude}`}
        >
          <span className="station-location-pulse absolute -inset-4 rounded-full border border-sky-300/70 bg-sky-300/10" />
          <span className="station-location-pulse absolute -inset-2 rounded-full border border-sky-300/70" />
          <span className="station-location-blink relative flex size-10 items-center justify-center rounded-full border-2 border-sky-100 bg-sky-400 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.75)]">
            <RadioTower className="size-5" aria-hidden="true" />
          </span>
          <span className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-sky-300/25 bg-slate-950/90 px-3 py-2 text-center shadow-xl backdrop-blur">
            <strong className="block font-mono text-xs text-sky-200">{sensor.station}</strong>
            <span className="mt-0.5 block text-[10px] text-slate-400">
              Station position
            </span>
          </span>
        </div>

        <div className="absolute right-3 bottom-3 left-3 flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-slate-950/80 px-3 py-2.5 backdrop-blur-md sm:right-auto sm:left-4 sm:min-w-72 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
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
              Region
            </p>
            <p className="mt-1 text-xs text-slate-300">{sensor.site}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] px-4 py-3 text-[10px] text-slate-500 sm:px-5">
        <span>{sensor.model} · custom schematic</span>
        <span>Position source: station metadata</span>
      </div>
    </section>
  );
}

"""Raspberry Shake waveform retrieval and labeled demo generation."""

from __future__ import annotations

import logging
import math
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import numpy as np

from .config import Settings

logger = logging.getLogger(__name__)


class SensorUnavailableError(RuntimeError):
    """Raised when a waveform cannot be obtained or converted safely."""


@dataclass(frozen=True)
class Waveform:
    samples_mps2: np.ndarray
    sample_rate_hz: float
    start_time: datetime
    end_time: datetime
    channel: str
    latency_ms: int
    source: str


def _demo_waveform(settings: Settings, channel: str) -> Waveform:
    if settings.demo_fail:
        raise SensorUnavailableError("Demo sensor failure is enabled")

    start_clock = time.perf_counter()
    sample_rate = 100.0
    sample_count = int(sample_rate * settings.waveform_duration_seconds)
    now = datetime.now(timezone.utc)
    t = np.arange(sample_count, dtype=np.float64) / sample_rate
    channel_index = settings.channels.index(channel)

    # Slowly varying, deterministic parameters keep demo readings realistic while
    # making each accelerometer axis visually distinct.
    epoch_phase = now.timestamp() / 45.0
    demo_baseline = settings.baseline_frequency_hz or 3.5
    frequency = demo_baseline * (1.0 + 0.008 * math.sin(epoch_phase))
    amplitudes_g = (0.0014, 0.0010, 0.0018)
    amplitude_g = amplitudes_g[channel_index % len(amplitudes_g)]
    phase = channel_index * math.pi / 3.0
    rng = np.random.default_rng(int(now.timestamp() // 5) + channel_index * 997)

    acceleration_g = (
        amplitude_g * np.sin(2.0 * math.pi * frequency * t + phase)
        + amplitude_g * 0.22 * np.sin(2.0 * math.pi * frequency * 2.1 * t)
        + rng.normal(0.0, amplitude_g * 0.08, sample_count)
    )
    # A short, low-amplitude impulse makes the synthetic trace less idealized.
    impulse_center = int(sample_count * 0.72)
    impulse_width = max(1, int(sample_rate * 0.18))
    impulse_t = np.arange(sample_count) - impulse_center
    acceleration_g += amplitude_g * 0.3 * np.exp(
        -0.5 * (impulse_t / impulse_width) ** 2
    )

    return Waveform(
        samples_mps2=acceleration_g * 9.80665,
        sample_rate_hz=sample_rate,
        start_time=now - timedelta(seconds=settings.waveform_duration_seconds),
        end_time=now,
        channel=channel,
        latency_ms=max(1, round((time.perf_counter() - start_clock) * 1000)),
        source="demo",
    )


def _real_waveform(settings: Settings, channel: str) -> Waveform:
    start_clock = time.perf_counter()
    end_time = datetime.now(timezone.utc) - timedelta(seconds=settings.data_delay_seconds)
    start_time = end_time - timedelta(seconds=settings.waveform_duration_seconds)

    try:
        # ObsPy is imported lazily so startup and demo mode stay lightweight.
        from obspy import UTCDateTime
        from obspy.clients.fdsn import Client

        client = Client(settings.base_url, timeout=settings.timeout_seconds)
        stream = client.get_waveforms(
            settings.network,
            settings.station,
            settings.location,
            channel,
            UTCDateTime(start_time),
            UTCDateTime(end_time),
            attach_response=False,
        )
        if not stream:
            raise SensorUnavailableError("The sensor returned an empty waveform")

        stream.merge(method=1, fill_value="interpolate")
        trace = max(stream, key=lambda item: item.stats.npts)
        inventory = client.get_stations(
            network=settings.network,
            station=settings.station,
            location=settings.location,
            channel=channel,
            starttime=UTCDateTime(start_time),
            endtime=UTCDateTime(end_time),
            level="response",
        )
        nyquist = float(trace.stats.sampling_rate) / 2.0
        pre_filt_high = min(settings.filter_high_hz * 1.5, nyquist * 0.9)
        trace.remove_response(
            inventory=inventory,
            output="ACC",
            water_level=60,
            pre_filt=(0.05, 0.1, pre_filt_high, min(nyquist * 0.98, pre_filt_high * 1.2)),
        )
        samples = np.asarray(trace.data, dtype=np.float64)
        if samples.size < 32 or not np.isfinite(samples).all():
            raise SensorUnavailableError("The converted acceleration waveform is invalid")

        actual_start = trace.stats.starttime.datetime.replace(tzinfo=timezone.utc)
        actual_end = trace.stats.endtime.datetime.replace(tzinfo=timezone.utc)
        return Waveform(
            samples_mps2=samples,
            sample_rate_hz=float(trace.stats.sampling_rate),
            start_time=actual_start,
            end_time=actual_end,
            channel=channel,
            latency_ms=round((time.perf_counter() - start_clock) * 1000),
            source="raspberry_shake",
        )
    except SensorUnavailableError:
        raise
    except Exception as exc:
        logger.exception("Raspberry Shake waveform retrieval failed")
        raise SensorUnavailableError(
            "Unable to retrieve a calibrated acceleration waveform from the sensor"
        ) from exc


def fetch_waveform(settings: Settings, channel: str) -> Waveform:
    normalized_channel = channel.strip().upper()
    if normalized_channel not in settings.channels:
        raise ValueError(f"Unsupported channel: {normalized_channel}")
    if settings.demo_mode:
        return _demo_waveform(settings, normalized_channel)
    return _real_waveform(settings, normalized_channel)

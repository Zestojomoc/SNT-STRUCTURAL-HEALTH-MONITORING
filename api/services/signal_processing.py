"""Waveform cleanup and frequency-domain processing."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy import signal


class SignalProcessingError(ValueError):
    """Raised when a signal cannot be processed into defensible metrics."""


@dataclass(frozen=True)
class ProcessedSignal:
    acceleration_g: np.ndarray
    peak_acceleration_g: float
    rms_acceleration_g: float
    dominant_frequency_hz: float | None


def _bandpass(
    samples: np.ndarray, sample_rate_hz: float, low_hz: float, high_hz: float
) -> np.ndarray:
    nyquist = sample_rate_hz / 2.0
    effective_high = min(high_hz, nyquist * 0.9)
    if low_hz >= effective_high:
        raise SignalProcessingError("The filter band is incompatible with the sample rate")
    sos = signal.butter(
        4,
        (low_hz, effective_high),
        btype="bandpass",
        fs=sample_rate_hz,
        output="sos",
    )
    try:
        return signal.sosfiltfilt(sos, samples)
    except ValueError as exc:
        raise SignalProcessingError("The waveform is too short for zero-phase filtering") from exc


def _dominant_frequency(
    samples: np.ndarray,
    sample_rate_hz: float,
    search_low_hz: float,
    search_high_hz: float,
) -> float | None:
    nperseg = min(samples.size, max(128, int(sample_rate_hz * 8)))
    frequencies, power = signal.welch(
        samples,
        fs=sample_rate_hz,
        window="hann",
        nperseg=nperseg,
        noverlap=nperseg // 2,
        detrend=False,
        scaling="density",
    )
    mask = (frequencies >= search_low_hz) & (frequencies <= search_high_hz)
    candidates = np.flatnonzero(mask)
    if candidates.size == 0:
        return None
    candidate_power = power[candidates]
    if not np.isfinite(candidate_power).all() or float(np.max(candidate_power)) <= 1e-18:
        return None

    peak_index = int(candidates[int(np.argmax(candidate_power))])
    frequency = float(frequencies[peak_index])

    # Quadratic interpolation across the PSD peak reduces FFT-bin quantization.
    if 0 < peak_index < power.size - 1:
        left, center, right = power[peak_index - 1 : peak_index + 2]
        denominator = left - 2.0 * center + right
        if abs(float(denominator)) > np.finfo(float).eps:
            offset = 0.5 * (left - right) / denominator
            bin_width = float(frequencies[1] - frequencies[0])
            frequency += float(np.clip(offset, -0.5, 0.5)) * bin_width
    return float(np.clip(frequency, search_low_hz, search_high_hz))


def process_acceleration(
    samples_mps2: np.ndarray,
    sample_rate_hz: float,
    *,
    filter_low_hz: float,
    filter_high_hz: float,
    search_low_hz: float,
    search_high_hz: float,
) -> ProcessedSignal:
    samples = np.asarray(samples_mps2, dtype=np.float64)
    if samples.ndim != 1 or samples.size < 32:
        raise SignalProcessingError("At least 32 one-dimensional samples are required")
    if not np.isfinite(samples).all():
        raise SignalProcessingError("The waveform contains non-finite values")
    if sample_rate_hz <= 0:
        raise SignalProcessingError("The sample rate must be greater than zero")

    detrended = signal.detrend(samples, type="linear")
    filtered_mps2 = _bandpass(
        detrended, sample_rate_hz, filter_low_hz, filter_high_hz
    )
    acceleration_g = filtered_mps2 / 9.80665
    peak = float(np.max(np.abs(acceleration_g)))
    rms = float(np.sqrt(np.mean(np.square(acceleration_g))))
    dominant = _dominant_frequency(
        filtered_mps2, sample_rate_hz, search_low_hz, search_high_hz
    )
    return ProcessedSignal(acceleration_g, peak, rms, dominant)


def downsample_waveform(samples: np.ndarray, sample_rate_hz: float, points: int) -> list[dict]:
    """Return a bounded, shape-preserving set of chart points."""
    if samples.size <= points:
        indexes = np.arange(samples.size)
    else:
        indexes = np.linspace(0, samples.size - 1, points, dtype=int)
    duration = (samples.size - 1) / sample_rate_hz
    return [
        {
            "time": float(index / sample_rate_hz - duration),
            "value": float(samples[index]),
        }
        for index in indexes
    ]

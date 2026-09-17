"""Centralized, environment-driven monitoring configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass


class ConfigurationError(ValueError):
    """Raised when real sensor mode is missing site-specific configuration."""


def _boolean(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _float(name: str, default: float | None = None) -> float | None:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    try:
        return float(value)
    except ValueError as exc:
        raise ConfigurationError(f"{name} must be a number") from exc


def _integer(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    try:
        return int(value)
    except ValueError as exc:
        raise ConfigurationError(f"{name} must be an integer") from exc


@dataclass(frozen=True)
class Settings:
    demo_mode: bool
    demo_fail: bool
    structure_name: str
    refresh_interval_seconds: int
    base_url: str
    network: str
    station: str
    location: str
    sensor_model: str
    sensor_site: str
    station_latitude: float
    station_longitude: float
    channels: tuple[str, ...]
    waveform_duration_seconds: int
    data_delay_seconds: int
    timeout_seconds: float
    baseline_frequencies_hz: dict[str, float | None]
    reference_type: str
    reference_label: str
    attention_change_percent: float | None
    warning_change_percent: float | None
    thresholds_provisional: bool
    filter_low_hz: float
    filter_high_hz: float
    frequency_search_low_hz: float
    frequency_search_high_hz: float
    modal_tracking_window_percent: float
    waveform_points: int

    @property
    def station_label(self) -> str:
        return "DEMO-4D" if self.demo_mode else self.station

    def baseline_for(self, channel: str) -> float | None:
        return self.baseline_frequencies_hz.get(channel.upper())


def get_settings(*, validate_real: bool = True) -> Settings:
    demo_mode = _boolean("SHM_DEMO_MODE", True)
    channels_value = os.getenv("RASPBERRY_SHAKE_CHANNELS", "").strip() or "ENE,ENN,ENZ"
    channels = tuple(
        channel.strip().upper() for channel in channels_value.split(",") if channel.strip()
    )
    if not channels:
        raise ConfigurationError("RASPBERRY_SHAKE_CHANNELS must include at least one channel")

    legacy_baseline = _float("SHM_BASELINE_FREQUENCY_HZ")
    baseline_frequencies = {
        channel: _float(
            f"SHM_BASELINE_FREQUENCY_{channel}_HZ",
            legacy_baseline if legacy_baseline is not None else (3.5 if demo_mode else None),
        )
        for channel in channels
    }
    thresholds_provisional = _boolean("SHM_THRESHOLDS_PROVISIONAL", True)
    screening_thresholds_enabled = demo_mode or thresholds_provisional
    attention = _float(
        "SHM_ATTENTION_FREQUENCY_CHANGE_PERCENT",
        10.0 if screening_thresholds_enabled else None,
    )
    warning = _float(
        "SHM_WARNING_FREQUENCY_CHANGE_PERCENT",
        20.0 if screening_thresholds_enabled else None,
    )
    station = os.getenv("RASPBERRY_SHAKE_STATION", "RA909").strip().upper()
    latitude = _float("RASPBERRY_SHAKE_LATITUDE", 14.513513513513514)
    longitude = _float("RASPBERRY_SHAKE_LONGITUDE", 121.2312989577)
    if latitude is None or not -90 <= latitude <= 90:
        raise ConfigurationError("RASPBERRY_SHAKE_LATITUDE must be between -90 and 90")
    if longitude is None or not -180 <= longitude <= 180:
        raise ConfigurationError("RASPBERRY_SHAKE_LONGITUDE must be between -180 and 180")

    if validate_real and not demo_mode:
        missing = []
        if not station:
            missing.append("RASPBERRY_SHAKE_STATION")
        if missing:
            raise ConfigurationError(
                "Real sensor mode requires: " + ", ".join(missing)
            )

    for channel, baseline in baseline_frequencies.items():
        if baseline is not None and baseline <= 0:
            raise ConfigurationError(
                f"SHM_BASELINE_FREQUENCY_{channel}_HZ must be greater than zero"
            )
    if (attention is None) != (warning is None):
        raise ConfigurationError(
            "Attention and warning monitoring thresholds must be configured together"
        )
    if attention is not None and attention <= 0:
        raise ConfigurationError(
            "SHM_ATTENTION_FREQUENCY_CHANGE_PERCENT must be greater than zero"
        )
    if warning is not None and attention is not None and warning <= attention:
        raise ConfigurationError(
            "SHM_WARNING_FREQUENCY_CHANGE_PERCENT must exceed the attention threshold"
        )

    filter_low = float(_float("SHM_FILTER_LOW_HZ", 0.2) or 0.2)
    filter_high = float(_float("SHM_FILTER_HIGH_HZ", 20.0) or 20.0)
    search_low = float(_float("SHM_FREQUENCY_SEARCH_LOW_HZ", 0.5) or 0.5)
    search_high = float(_float("SHM_FREQUENCY_SEARCH_HIGH_HZ", 20.0) or 20.0)
    if not 0 < filter_low < filter_high:
        raise ConfigurationError("The configured filter band is invalid")
    if not 0 < search_low < search_high:
        raise ConfigurationError("The configured frequency search band is invalid")
    configured_tracking_window = _float("SHM_MODAL_TRACKING_WINDOW_PERCENT", 20.0)
    tracking_window = (
        20.0 if configured_tracking_window is None else float(configured_tracking_window)
    )
    if not 0 < tracking_window <= 100:
        raise ConfigurationError(
            "SHM_MODAL_TRACKING_WINDOW_PERCENT must be greater than zero and at most 100"
        )

    refresh = _integer("DEFAULT_MONITOR_INTERVAL_SECONDS", 5)
    if refresh not in {3, 5, 10, 30}:
        refresh = 5

    return Settings(
        demo_mode=demo_mode,
        demo_fail=_boolean("SHM_DEMO_FAIL", False),
        structure_name=os.getenv("SHM_STRUCTURE_NAME", "Monitored Structure").strip()
        or "Monitored Structure",
        refresh_interval_seconds=refresh,
        base_url=os.getenv(
            "RASPBERRY_SHAKE_BASE_URL", "https://data.raspberryshake.org"
        ).rstrip("/"),
        network=os.getenv("RASPBERRY_SHAKE_NETWORK", "AM").strip().upper(),
        station=station,
        location=os.getenv("RASPBERRY_SHAKE_LOCATION", "00").strip().upper(),
        sensor_model=os.getenv("RASPBERRY_SHAKE_MODEL", "Raspberry Shake 4D").strip()
        or "Raspberry Shake 4D",
        sensor_site=os.getenv("RASPBERRY_SHAKE_SITE", "Philippines").strip()
        or "Philippines",
        station_latitude=latitude,
        station_longitude=longitude,
        channels=channels,
        waveform_duration_seconds=max(
            8, min(_integer("RASPBERRY_SHAKE_WAVEFORM_DURATION_SECONDS", 30), 120)
        ),
        data_delay_seconds=max(0, _integer("RASPBERRY_SHAKE_DATA_DELAY_SECONDS", 2100)),
        timeout_seconds=max(
            2.0, min(float(_float("RASPBERRY_SHAKE_TIMEOUT_SECONDS", 12.0) or 12.0), 30.0)
        ),
        baseline_frequencies_hz=baseline_frequencies,
        reference_type=os.getenv("SHM_REFERENCE_TYPE", "analytical").strip().lower()
        or "analytical",
        reference_label=os.getenv(
            "SHM_REFERENCE_LABEL", "Bare-frame eigenvalue analysis"
        ).strip()
        or "Bare-frame eigenvalue analysis",
        attention_change_percent=attention,
        warning_change_percent=warning,
        thresholds_provisional=thresholds_provisional,
        filter_low_hz=filter_low,
        filter_high_hz=filter_high,
        frequency_search_low_hz=search_low,
        frequency_search_high_hz=search_high,
        modal_tracking_window_percent=tracking_window,
        waveform_points=max(60, min(_integer("SHM_WAVEFORM_POINTS", 180), 300)),
    )

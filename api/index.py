"""Vercel-compatible FastAPI entry point for stateless SHM monitoring."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException, Query, Response
from pydantic import BaseModel

from api.services.config import ConfigurationError, get_settings
from api.services.raspberry_shake import SensorUnavailableError, fetch_waveform
from api.services.shm_analysis import assess_structure
from api.services.signal_processing import (
    SignalProcessingError,
    downsample_waveform,
    process_acceleration,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Structural Health Monitoring API",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    mode: Literal["demo", "real"]
    configuration_valid: bool


class PublicConfigResponse(BaseModel):
    structure_name: str
    baseline_frequencies_hz: dict[str, float | None]
    reference_type: str
    reference_label: str
    available_channels: list[str]
    default_refresh_interval_seconds: int
    demo_mode: bool
    data_delay_seconds: int


class SensorInfo(BaseModel):
    connected: bool
    model: str
    site: str
    station: str
    network: str
    location: str
    channel: str
    last_update: str
    latency_ms: int
    source: Literal["demo", "raspberry_shake"]
    data_delay_seconds: int


class SignalMetrics(BaseModel):
    peak_acceleration: float
    rms_acceleration: float
    unit: Literal["g"] = "g"
    sample_rate_hz: float


class FrequencyMetrics(BaseModel):
    current_hz: float | None
    baseline_hz: float | None
    change_percent: float | None
    reference_type: str
    reference_label: str


class StiffnessMetrics(BaseModel):
    estimated_change_percent: float | None
    method: str = "frequency_ratio_constant_effective_mass"


class StatusInfo(BaseModel):
    level: Literal["normal", "attention", "warning", "unavailable"]
    label: str
    message: str
    provisional: bool


class WaveformPoint(BaseModel):
    time: float
    value: float


class MonitoringResponse(BaseModel):
    timestamp: str
    mode: Literal["demo", "real"]
    structure_name: str
    sensor: SensorInfo
    signal: SignalMetrics
    frequency: FrequencyMetrics
    stiffness: StiffnessMetrics
    status: StatusInfo
    waveform: list[WaveformPoint]


def _no_store(response: Response) -> None:
    response.headers["Cache-Control"] = "no-store, max-age=0"


@app.get("/api/health", response_model=HealthResponse)
def health(response: Response) -> HealthResponse:
    _no_store(response)
    try:
        settings = get_settings(validate_real=True)
        return HealthResponse(
            status="ok",
            mode="demo" if settings.demo_mode else "real",
            configuration_valid=True,
        )
    except ConfigurationError:
        settings = get_settings(validate_real=False)
        return HealthResponse(
            status="degraded",
            mode="demo" if settings.demo_mode else "real",
            configuration_valid=False,
        )


@app.get("/api/config", response_model=PublicConfigResponse)
def public_config(response: Response) -> PublicConfigResponse:
    _no_store(response)
    settings = get_settings(validate_real=False)
    return PublicConfigResponse(
        structure_name=settings.structure_name,
        baseline_frequencies_hz=settings.baseline_frequencies_hz,
        reference_type="synthetic" if settings.demo_mode else settings.reference_type,
        reference_label="Demo reference" if settings.demo_mode else settings.reference_label,
        available_channels=list(settings.channels),
        default_refresh_interval_seconds=settings.refresh_interval_seconds,
        demo_mode=settings.demo_mode,
        data_delay_seconds=settings.data_delay_seconds,
    )


@app.get("/api/monitor", response_model=MonitoringResponse)
def monitor(
    response: Response,
    channel: str | None = Query(default=None, min_length=3, max_length=3),
) -> MonitoringResponse:
    _no_store(response)
    try:
        settings = get_settings(validate_real=True)
        selected_channel = (channel or settings.channels[0]).upper()
        if selected_channel not in settings.channels:
            raise HTTPException(status_code=400, detail="Unsupported monitoring channel")

        waveform = fetch_waveform(settings, selected_channel)
        channel_baseline = settings.baseline_for(selected_channel)
        search_low_hz = settings.frequency_search_low_hz
        search_high_hz = settings.frequency_search_high_hz
        if channel_baseline is not None:
            tracking_fraction = settings.modal_tracking_window_percent / 100.0
            search_low_hz = max(
                search_low_hz, channel_baseline * (1.0 - tracking_fraction)
            )
            search_high_hz = min(
                search_high_hz, channel_baseline * (1.0 + tracking_fraction)
            )
            if search_low_hz >= search_high_hz:
                raise ConfigurationError(
                    "The modal tracking window does not overlap the frequency search band"
                )
        processed = process_acceleration(
            waveform.samples_mps2,
            waveform.sample_rate_hz,
            filter_low_hz=settings.filter_low_hz,
            filter_high_hz=settings.filter_high_hz,
            search_low_hz=search_low_hz,
            search_high_hz=search_high_hz,
        )
        assessment = assess_structure(
            processed.dominant_frequency_hz,
            channel_baseline,
            settings.attention_change_percent,
            settings.warning_change_percent,
        )
        provisional_status = (
            not settings.demo_mode
            and settings.thresholds_provisional
            and assessment.frequency_change_percent is not None
            and settings.attention_change_percent is not None
            and settings.warning_change_percent is not None
        )
        status_label = (
            f"Provisional {assessment.label}" if provisional_status else assessment.label
        )
        status_message = assessment.message
        if provisional_status:
            status_message = (
                f"{assessment.message} Provisional screening limits are "
                f"{settings.attention_change_percent:g}% absolute frequency change for "
                f"attention and {settings.warning_change_percent:g}% for warning; this is "
                "not an engineer-approved safety determination."
            )
        timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        last_update = waveform.end_time.astimezone(timezone.utc).isoformat().replace(
            "+00:00", "Z"
        )
        return MonitoringResponse(
            timestamp=timestamp,
            mode="demo" if settings.demo_mode else "real",
            structure_name=settings.structure_name,
            sensor=SensorInfo(
                connected=True,
                model=settings.sensor_model,
                site=settings.sensor_site,
                station=settings.station_label,
                network="SIM" if settings.demo_mode else settings.network,
                location="--" if settings.demo_mode else settings.location,
                channel=selected_channel,
                last_update=last_update,
                latency_ms=waveform.latency_ms,
                source=waveform.source,
                data_delay_seconds=0 if settings.demo_mode else settings.data_delay_seconds,
            ),
            signal=SignalMetrics(
                peak_acceleration=processed.peak_acceleration_g,
                rms_acceleration=processed.rms_acceleration_g,
                sample_rate_hz=waveform.sample_rate_hz,
            ),
            frequency=FrequencyMetrics(
                current_hz=processed.dominant_frequency_hz,
                baseline_hz=channel_baseline,
                change_percent=assessment.frequency_change_percent,
                reference_type="synthetic" if settings.demo_mode else settings.reference_type,
                reference_label="Demo reference"
                if settings.demo_mode
                else settings.reference_label,
            ),
            stiffness=StiffnessMetrics(
                estimated_change_percent=assessment.stiffness_change_percent
            ),
            status=StatusInfo(
                level=assessment.level,
                label=status_label,
                message=status_message,
                provisional=provisional_status,
            ),
            waveform=downsample_waveform(
                processed.acceleration_g,
                waveform.sample_rate_hz,
                settings.waveform_points,
            ),
        )
    except HTTPException:
        raise
    except ConfigurationError as exc:
        logger.error("Invalid monitoring configuration: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Monitoring is not configured for the real sensor source.",
        ) from exc
    except SensorUnavailableError as exc:
        logger.warning("Sensor unavailable: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve current monitoring data from the sensor.",
        ) from exc
    except SignalProcessingError as exc:
        logger.warning("Signal processing failed: %s", exc)
        raise HTTPException(
            status_code=422,
            detail="The current waveform could not be processed safely.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected monitoring request failure")
        raise HTTPException(
            status_code=500,
            detail="The monitoring service encountered an unexpected error.",
        ) from exc

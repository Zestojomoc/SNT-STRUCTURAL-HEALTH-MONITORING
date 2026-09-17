"""Baseline comparison and derived structural monitoring indicators."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class StructuralAssessment:
    frequency_change_percent: float | None
    stiffness_change_percent: float | None
    level: str
    label: str
    message: str


def assess_structure(
    current_frequency_hz: float | None,
    baseline_frequency_hz: float | None,
    attention_threshold_percent: float | None,
    warning_threshold_percent: float | None,
) -> StructuralAssessment:
    if current_frequency_hz is None or current_frequency_hz <= 0:
        return StructuralAssessment(
            None,
            None,
            "unavailable",
            "Insufficient Signal",
            "No defensible dominant frequency was detected in the configured search band.",
        )
    if baseline_frequency_hz is None:
        return StructuralAssessment(
            None,
            None,
            "unavailable",
            "Reference Required",
            "Live response is available, but a validated healthy frequency reference is not configured.",
        )
    if baseline_frequency_hz <= 0:
        raise ValueError("The baseline frequency must be greater than zero")

    frequency_change = (
        (current_frequency_hz - baseline_frequency_hz) / baseline_frequency_hz
    ) * 100.0

    # For approximately constant effective modal mass, f is proportional to sqrt(k).
    # Therefore k_current / k_baseline is approximately (f_current / f_baseline)^2.
    stiffness_change = (
        (current_frequency_hz / baseline_frequency_hz) ** 2 - 1.0
    ) * 100.0
    if attention_threshold_percent is None or warning_threshold_percent is None:
        return StructuralAssessment(
            frequency_change,
            stiffness_change,
            "unavailable",
            "Thresholds Required",
            "Baseline comparison is available, but approved condition thresholds are not configured.",
        )
    magnitude = abs(frequency_change)

    if magnitude >= warning_threshold_percent:
        return StructuralAssessment(
            frequency_change,
            stiffness_change,
            "warning",
            "Monitoring Warning",
            "A significant change from the configured frequency reference was detected.",
        )
    if magnitude >= attention_threshold_percent:
        return StructuralAssessment(
            frequency_change,
            stiffness_change,
            "attention",
            "Attention Required",
            "A measurable change from the configured frequency reference was detected.",
        )
    return StructuralAssessment(
        frequency_change,
        stiffness_change,
        "normal",
        "Normal",
        "Structural response is within the configured monitoring range.",
    )

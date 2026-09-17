from __future__ import annotations

import unittest

import numpy as np

from api.services.signal_processing import SignalProcessingError, process_acceleration


class SignalProcessingTests(unittest.TestCase):
    def test_detects_known_dominant_frequency_and_acceleration(self) -> None:
        sample_rate = 100.0
        duration = 30.0
        expected_frequency = 3.5
        t = np.arange(int(sample_rate * duration)) / sample_rate
        acceleration_g = 0.002 * np.sin(2 * np.pi * expected_frequency * t)

        result = process_acceleration(
            acceleration_g * 9.80665,
            sample_rate,
            filter_low_hz=0.2,
            filter_high_hz=20.0,
            search_low_hz=0.5,
            search_high_hz=20.0,
        )

        self.assertIsNotNone(result.dominant_frequency_hz)
        self.assertAlmostEqual(result.dominant_frequency_hz or 0, expected_frequency, delta=0.08)
        # Zero-phase filtering can introduce a small finite-window edge overshoot;
        # the recovered engineering amplitude should remain close to the source.
        self.assertAlmostEqual(result.peak_acceleration_g, 0.002, delta=0.0004)

    def test_rejects_empty_waveform(self) -> None:
        with self.assertRaises(SignalProcessingError):
            process_acceleration(
                np.array([]),
                100.0,
                filter_low_hz=0.2,
                filter_high_hz=20.0,
                search_low_hz=0.5,
                search_high_hz=20.0,
            )

    def test_interpolated_peak_stays_inside_search_band(self) -> None:
        sample_rate = 100.0
        t = np.arange(3000) / sample_rate
        acceleration = 0.001 * np.sin(2 * np.pi * 0.49 * t)
        result = process_acceleration(
            acceleration * 9.80665,
            sample_rate,
            filter_low_hz=0.2,
            filter_high_hz=20.0,
            search_low_hz=0.5,
            search_high_hz=20.0,
        )
        self.assertIsNotNone(result.dominant_frequency_hz)
        self.assertGreaterEqual(result.dominant_frequency_hz or 0, 0.5)


if __name__ == "__main__":
    unittest.main()

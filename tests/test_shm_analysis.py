from __future__ import annotations

import unittest

from api.services.shm_analysis import assess_structure


class ShmAnalysisTests(unittest.TestCase):
    def test_frequency_and_stiffness_formula(self) -> None:
        result = assess_structure(3.42, 3.5, 5.0, 10.0)
        self.assertAlmostEqual(result.frequency_change_percent or 0, -2.2857142857, places=6)
        self.assertAlmostEqual(result.stiffness_change_percent or 0, -4.5191836735, places=6)
        self.assertEqual(result.level, "normal")

    def test_absolute_change_drives_warning_status(self) -> None:
        decreased = assess_structure(3.0, 3.5, 5.0, 10.0)
        increased = assess_structure(4.0, 3.5, 5.0, 10.0)
        self.assertEqual(decreased.level, "warning")
        self.assertEqual(increased.level, "warning")

    def test_missing_frequency_is_unavailable(self) -> None:
        result = assess_structure(None, 3.5, 5.0, 10.0)
        self.assertEqual(result.level, "unavailable")
        self.assertIsNone(result.stiffness_change_percent)

    def test_live_frequency_without_baseline_requires_reference(self) -> None:
        result = assess_structure(6.7, None, None, None)
        self.assertEqual(result.level, "unavailable")
        self.assertEqual(result.label, "Reference Required")
        self.assertIsNone(result.frequency_change_percent)
        self.assertIsNone(result.stiffness_change_percent)

    def test_baseline_without_thresholds_still_returns_derived_changes(self) -> None:
        result = assess_structure(2.80, 2.87078721, None, None)
        self.assertEqual(result.level, "unavailable")
        self.assertEqual(result.label, "Thresholds Required")
        self.assertIsNotNone(result.frequency_change_percent)
        self.assertIsNotNone(result.stiffness_change_percent)


if __name__ == "__main__":
    unittest.main()

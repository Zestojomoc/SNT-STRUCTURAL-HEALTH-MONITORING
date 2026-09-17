from __future__ import annotations

import os
import asyncio
import unittest
from unittest.mock import patch

try:
    import httpx

    from api.index import app
except ImportError:  # pragma: no cover - makes a missing environment explicit in output
    httpx = None  # type: ignore[assignment]
    app = None


@unittest.skipIf(httpx is None, "FastAPI test dependencies are not installed")
class ApiTests(unittest.TestCase):
    def request(self, path: str):
        async def send_request():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(
                transport=transport, base_url="http://testserver"
            ) as client:
                return await client.get(path)

        return asyncio.run(send_request())

    def test_demo_monitor_response(self) -> None:
        with patch.dict(os.environ, {"SHM_DEMO_MODE": "true", "SHM_DEMO_FAIL": "false"}):
            response = self.request("/api/monitor?channel=ENZ")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["mode"], "demo")
        self.assertEqual(body["sensor"]["channel"], "ENZ")
        self.assertEqual(body["sensor"]["model"], "Raspberry Shake 4D")
        self.assertEqual(body["signal"]["unit"], "g")
        self.assertLessEqual(len(body["waveform"]), 300)

    def test_simulated_sensor_failure_is_friendly(self) -> None:
        with patch.dict(os.environ, {"SHM_DEMO_MODE": "true", "SHM_DEMO_FAIL": "true"}):
            response = self.request("/api/monitor?channel=ENZ")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("traceback", response.text.lower())
        self.assertIn("Unable to retrieve", response.json()["detail"])

    def test_invalid_channel_is_rejected(self) -> None:
        with patch.dict(os.environ, {"SHM_DEMO_MODE": "true"}):
            response = self.request("/api/monitor?channel=BAD")
        self.assertEqual(response.status_code, 400)

    def test_real_mode_requires_station_configuration(self) -> None:
        real_mode = {
            "SHM_DEMO_MODE": "false",
            "RASPBERRY_SHAKE_STATION": "",
            "SHM_BASELINE_FREQUENCY_HZ": "",
            "SHM_ATTENTION_FREQUENCY_CHANGE_PERCENT": "",
            "SHM_WARNING_FREQUENCY_CHANGE_PERCENT": "",
        }
        with patch.dict(os.environ, real_mode, clear=True):
            response = self.request("/api/monitor?channel=ENZ")
        self.assertEqual(response.status_code, 503)
        self.assertIn("not configured", response.json()["detail"])

    def test_ra909_is_the_default_real_station(self) -> None:
        from api.services.config import get_settings

        real_mode = {
            "SHM_DEMO_MODE": "false",
            "SHM_BASELINE_FREQUENCY_HZ": "3.5",
            "SHM_ATTENTION_FREQUENCY_CHANGE_PERCENT": "5",
            "SHM_WARNING_FREQUENCY_CHANGE_PERCENT": "10",
        }
        with patch.dict(os.environ, real_mode, clear=True):
            settings = get_settings()
        self.assertEqual(settings.network, "AM")
        self.assertEqual(settings.station, "RA909")
        self.assertEqual(settings.location, "00")
        self.assertEqual(settings.channels, ("ENE", "ENN", "ENZ"))
        self.assertEqual(settings.baseline_for("ENE"), 3.5)

    def test_real_mode_allows_live_data_without_reference_values(self) -> None:
        from api.services.config import get_settings

        with patch.dict(
            os.environ,
            {
                "SHM_DEMO_MODE": "false",
                "RASPBERRY_SHAKE_STATION": "RA909",
                "SHM_BASELINE_FREQUENCY_ENE_HZ": "",
                "SHM_BASELINE_FREQUENCY_ENN_HZ": "",
                "SHM_BASELINE_FREQUENCY_ENZ_HZ": "",
                "SHM_ATTENTION_FREQUENCY_CHANGE_PERCENT": "",
                "SHM_WARNING_FREQUENCY_CHANGE_PERCENT": "",
            },
            clear=True,
        ):
            settings = get_settings()
        self.assertEqual(settings.station, "RA909")
        self.assertIsNone(settings.baseline_for("ENE"))

    def test_confirmed_directional_analytical_baselines(self) -> None:
        from api.services.config import get_settings

        analytical = {
            "SHM_DEMO_MODE": "false",
            "SHM_BASELINE_FREQUENCY_ENE_HZ": "2.87078721",
            "SHM_BASELINE_FREQUENCY_ENN_HZ": "2.88420027",
            "SHM_BASELINE_FREQUENCY_ENZ_HZ": "",
        }
        with patch.dict(os.environ, analytical, clear=True):
            settings = get_settings()
        self.assertAlmostEqual(settings.baseline_for("ENE") or 0, 2.87078721)
        self.assertAlmostEqual(settings.baseline_for("ENN") or 0, 2.88420027)
        self.assertIsNone(settings.baseline_for("ENZ"))
        self.assertEqual(settings.modal_tracking_window_percent, 20.0)


if __name__ == "__main__":
    unittest.main()

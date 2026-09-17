"""Minimal production probe used to isolate Vercel Python runtime startup."""

import sys
from pathlib import Path

from fastapi import FastAPI

app = FastAPI()


@app.get("/api/runtime-health")
def runtime_health() -> dict[str, str | list[str]]:
    try:
        from api.services.config import get_settings

        settings = get_settings(validate_real=False)
        return {
            "status": "ok",
            "runtime": "python-fastapi",
            "project_import": "ok",
            "mode": "demo" if settings.demo_mode else "real",
        }
    except Exception as exc:
        return {
            "status": "import-error",
            "runtime": "python-fastapi",
            "error_type": type(exc).__name__,
            "error": str(exc),
            "entrypoint_directory": str(Path(__file__).resolve().parent),
            "python_path": sys.path,
        }

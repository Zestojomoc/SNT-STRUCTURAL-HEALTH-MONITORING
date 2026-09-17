"""Minimal production probe used to isolate Vercel Python runtime startup."""

from fastapi import FastAPI

app = FastAPI()


@app.get("/api/runtime-health")
def runtime_health() -> dict[str, str]:
    return {"status": "ok", "runtime": "python-fastapi"}

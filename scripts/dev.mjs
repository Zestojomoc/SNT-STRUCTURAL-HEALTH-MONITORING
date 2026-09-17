import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const projectRoot = process.cwd();
const developmentCache = path.join(projectRoot, ".next-dev");
const nextExecutable = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const pythonExecutable = process.platform === "win32" ? "python" : "python3";

loadEnvConfig(projectRoot, true);

function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") resolve(false);
      else reject(error);
    });
    server.listen({ host: "127.0.0.1", port }, () => {
      server.close(() => resolve(true));
    });
  });
}

const occupiedPorts = [];
for (const port of [3000, 8000]) {
  if (!(await isPortAvailable(port))) occupiedPorts.push(port);
}
if (occupiedPorts.length > 0) {
  console.error(
    `Cannot start SHM: port${occupiedPorts.length > 1 ? "s" : ""} ` +
      `${occupiedPorts.join(", ")} ${occupiedPorts.length > 1 ? "are" : "is"} already in use. ` +
      "Stop the previous development server with Ctrl+C, then run npm run dev again.",
  );
  process.exit(1);
}

// This directory contains generated development chunks only. Production builds
// use `.next`, so the two modes cannot corrupt each other's webpack manifests.
rmSync(developmentCache, { recursive: true, force: true });

const sharedEnvironment = {
  ...process.env,
  SHM_LOCAL_API_URL: process.env.SHM_LOCAL_API_URL || "http://127.0.0.1:8000",
};

let shuttingDown = false;
let webProcess;

const apiProcess = spawn(
  pythonExecutable,
  ["-m", "uvicorn", "api.index:app", "--host", "127.0.0.1", "--port", "8000"],
  {
    cwd: projectRoot,
    env: sharedEnvironment,
    stdio: "inherit",
  },
);

function stopChild(child) {
  if (child && child.exitCode === null && !child.killed) child.kill();
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  stopChild(webProcess);
  stopChild(apiProcess);
  setTimeout(() => process.exit(exitCode), 300);
}

apiProcess.once("error", (error) => {
  console.error(`Unable to start the Python API: ${error.message}`);
  shutdown(1);
});

apiProcess.once("exit", (code) => {
  if (!shuttingDown) {
    console.error(
      `The Python API stopped unexpectedly (exit ${code ?? "unknown"}). ` +
        'Install it with: python -m pip install -e ".[test]"',
    );
    shutdown(code || 1);
  }
});

async function waitForApi() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (apiProcess.exitCode !== null) throw new Error("Python API failed during startup");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/health", {
        cache: "no-store",
      });
      if (response.ok) return;
    } catch {
      // Uvicorn is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the Python API on port 8000");
}

try {
  await waitForApi();
  console.log("SHM API ready at http://127.0.0.1:8000");
  webProcess = spawn(process.execPath, [nextExecutable, "dev"], {
    cwd: projectRoot,
    env: sharedEnvironment,
    stdio: "inherit",
  });
  webProcess.once("error", (error) => {
    console.error(`Unable to start Next.js: ${error.message}`);
    shutdown(1);
  });
  webProcess.once("exit", (code) => {
    if (!shuttingDown) shutdown(code || 0);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  shutdown(1);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

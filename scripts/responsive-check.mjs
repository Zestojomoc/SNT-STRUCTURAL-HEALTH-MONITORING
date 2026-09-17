import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const targetUrl = process.env.SHM_TEST_URL ?? "http://127.0.0.1:3001";
const outputDir = path.resolve("artifacts", "responsive-cdp");
const profileDir = path.resolve("artifacts", "edge-cdp-profile");
const debugPort = 9333;

rmSync(profileDir, { recursive: true, force: true });
mkdirSync(profileDir, { recursive: true });
mkdirSync(outputDir, { recursive: true });

const edge = spawn(
  edgePath,
  [
    "--headless=new",
    "--no-first-run",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getDebugPage() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const pages = await response.json();
      const page = pages.find((candidate) => candidate.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // Edge may still be starting.
    }
    await delay(200);
  }
  throw new Error("Unable to connect to Edge DevTools");
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
      } else {
        this.events.push(message);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

const viewports = [
  [320, 568],
  [360, 800],
  [375, 812],
  [390, 844],
  [412, 915],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1440, 900],
];

let client;
try {
  const page = await getDebugPage();
  client = new CdpClient(page.webSocketDebuggerUrl);
  await client.connect();
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Log.enable");

  const results = [];
  for (const [width, height] of viewports) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
      screenWidth: width,
      screenHeight: height,
    });
    await client.send("Page.navigate", { url: targetUrl });
    await delay(2600);

    const metrics = await evaluate(
      client,
      `(() => {
        const root = document.documentElement;
        const visibleControls = [...document.querySelectorAll('button, select')]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          })
          .map((element) => ({
            label: element.getAttribute('aria-label') || element.textContent.trim().slice(0, 40),
            width: Math.round(element.getBoundingClientRect().width),
            height: Math.round(element.getBoundingClientRect().height),
          }));
        return {
          viewport: [window.innerWidth, window.innerHeight],
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          hasHorizontalOverflow: root.scrollWidth > root.clientWidth,
          structuralStatus: [...document.querySelectorAll('h2')]
            .map((element) => element.textContent.trim())
            .find((text) => ['Normal', 'Attention Required', 'Monitoring Warning'].includes(text)) || null,
          visibleControls,
        };
      })()`,
    );

    const screenshot = await client.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    writeFileSync(
      path.join(outputDir, `dashboard-${width}x${height}.png`),
      Buffer.from(screenshot.data, "base64"),
    );
    results.push({ requested: [width, height], ...metrics });
  }

  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });
  await client.send("Page.navigate", { url: targetUrl });
  await delay(2200);

  const interactions = {};
  interactions.channel = await evaluate(
    client,
    `(() => {
      const button = [...document.querySelectorAll('[role="radio"]')]
        .find((element) => element.textContent.trim() === 'ENE');
      button?.click();
      return Boolean(button);
    })()`,
  );
  await delay(250);
  interactions.selectedChannel = await evaluate(
    client,
    `document.querySelector('[role="radio"][aria-checked="true"]')?.textContent.trim()`,
  );

  interactions.pause = await evaluate(
    client,
    `(() => {
      const button = [...document.querySelectorAll('button')]
        .find((element) => element.textContent.includes('Pause Monitoring'));
      button?.click();
      return Boolean(button);
    })()`,
  );
  await delay(150);
  interactions.pausedLabel = await evaluate(
    client,
    `[...document.querySelectorAll('button')].some((element) => element.textContent.includes('Resume Monitoring'))`,
  );

  interactions.metric = await evaluate(
    client,
    `(() => {
      const button = document.querySelector('button[aria-label="View details for Natural Frequency"]');
      button?.click();
      return Boolean(button);
    })()`,
  );
  await delay(150);
  interactions.dialogOpen = await evaluate(client, `Boolean(document.querySelector('[role="dialog"]'))`);
  interactions.dialogWidth = await evaluate(
    client,
    `Math.round(document.querySelector('[role="dialog"]')?.getBoundingClientRect().width || 0)`,
  );

  const consoleProblems = client.events
    .filter(
      (event) =>
        event.method === "Runtime.exceptionThrown" ||
        event.method === "Log.entryAdded" ||
        (event.method === "Runtime.consoleAPICalled" &&
          ["error", "warning"].includes(event.params?.type)),
    )
    .map((event) => ({ method: event.method, params: event.params }));

  const report = { targetUrl, results, interactions, consoleProblems };
  writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  client?.close();
  edge.kill();
}

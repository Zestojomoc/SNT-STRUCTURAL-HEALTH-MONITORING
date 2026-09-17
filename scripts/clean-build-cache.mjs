import { rmSync } from "node:fs";
import path from "node:path";

const buildCache = path.join(process.cwd(), ".next");
rmSync(buildCache, { recursive: true, force: true });
console.log("Cleared production build cache (.next).");

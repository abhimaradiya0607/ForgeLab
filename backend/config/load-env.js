import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf8");
    for (const rawLine of content.split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        const eq = line.indexOf("=");
        if (eq === -1) continue;

        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (value && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

export function loadEnv() {
    parseEnv(path.resolve(process.cwd(), ".env"));
    parseEnv(path.join(backendDir, ".env"));
}

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { networkInterfaces } from "node:os";
import qrcode from "qrcode-terminal";

const __dirname = dirname(fileURLToPath(import.meta.url));
const viteBin = join(__dirname, "..", "node_modules", "vite", "bin", "vite.js");

const child = spawn(process.execPath, [viteBin, "--host"], {
  cwd: join(__dirname, ".."),
  stdio: ["inherit", "pipe", "pipe"],
});

let qrPrinted = false;

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function getLanIp() {
  const interfaces = networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal && !entry.address.startsWith("169.254.")) {
        return entry.address;
      }
    }
  }

  return "";
}

function maybePrintQr(text) {
  if (qrPrinted) {
    return;
  }

  const cleanText = stripAnsi(text);
  const directMatch = cleanText.match(/https?:\/\/(?:localhost|127\.0\.0\.1|(?:\d{1,3}\.){3}\d{1,3}):(\d+)/i);
  const localMatch = cleanText.match(/Local:\s*(https?:\/\/localhost:(\d+)\/?)/i);
  const port = directMatch?.[1] || localMatch?.[2];

  if (!port) {
    return;
  }

  const lanIp = getLanIp();
  const url =
    lanIp
      ? `http://${lanIp}:${port}`
      : directMatch?.[0]?.replace("localhost", "127.0.0.1") || localMatch?.[1] || "";

  if (!url) {
    return;
  }

  qrPrinted = true;
  process.stdout.write(`\nScan this QR on your phone:\n${url}\n\n`);
  qrcode.generate(url, { small: true });
  process.stdout.write("\n");
}

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  maybePrintQr(text);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk.toString());
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});

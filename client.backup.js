const { spawn } = require("child_process");
const WebSocket = require("ws");

const FFMPEG_PATH =
  "C:\\Users\\sinto\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe";

const SERVER_URL = "ws://127.0.0.1:8765";

const CABLE_DEVICE = "audio=CABLE Output (VB-Audio Virtual Cable)";

let ws = null;
let ffmpeg = null;
let reconnectTimer = null;

function startCapture() {
  if (ffmpeg) {
    return;
  }

  console.log("Starting FFmpeg audio capture...");
  console.log("Audio device:", CABLE_DEVICE);

  ffmpeg = spawn(
    FFMPEG_PATH,
    [
      "-hide_banner",
      "-loglevel",
      "warning",

      "-f",
      "dshow",

      "-i",
      CABLE_DEVICE,

      "-ac",
      "2",
      "-ar",
      "48000",

      "-f",
      "s16le",

      "pipe:1"
    ],
    {
      stdio: ["ignore", "pipe", "inherit"]
    }
  );

  ffmpeg.stdout.on("data", (chunk) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  });

  ffmpeg.on("close", (code) => {
    console.log(`FFmpeg stopped. Exit code: ${code}`);
    ffmpeg = null;

    if (ws && ws.readyState === WebSocket.OPEN) {
      setTimeout(startCapture, 1000);
    }
  });

  ffmpeg.on("error", (error) => {
    console.error("FFmpeg error:", error.message);
    ffmpeg = null;
  });
}

function stopCapture() {
  if (ffmpeg) {
    try {
      ffmpeg.kill();
    } catch {}
    ffmpeg = null;
  }
}

function connect() {
  console.log(`Connecting to ${SERVER_URL}...`);

  ws = new WebSocket(SERVER_URL);

  ws.on("open", () => {
    console.log("========================================");
    console.log("CONNECTED TO RECEIVER");
    console.log("========================================");

    startCapture();
  });

  ws.on("close", () => {
    console.log("Receiver disconnected.");

    stopCapture();

    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 2000);
    }
  });

  ws.on("error", (error) => {
    console.log("WebSocket connection error:", error.message);
  });
}

console.log("========================================");
console.log("MAHDI MUSIC AUDIO HELPER");
console.log("========================================");
console.log("Starting...");
console.log("========================================");

connect();

process.on("SIGINT", () => {
  console.log("\nStopping helper...");
  stopCapture();

  if (ws) {
    ws.close();
  }

  process.exit(0);
});

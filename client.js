const { spawn } = require("child_process");
const WebSocket = require("ws");

const FFMPEG_PATH =
  "C:\\Users\\sinto\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe";

// Keep localhost for now.
// We will change this to the cloud server later.
const SERVER_URL = "wss://mahdimusichelper.onrender.com";

const CABLE_DEVICE = "audio=CABLE Output (VB-Audio Virtual Cable)";

let ws = null;
let ffmpeg = null;
let reconnectTimer = null;
let heartbeatTimer = null;

let shuttingDown = false;
let reconnectDelay = 2000;

const MAX_RECONNECT_DELAY = 30000;

function startCapture() {
  if (shuttingDown) {
    return;
  }

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
      try {
        ws.send(chunk);
      } catch (error) {
        console.log("Failed to send audio:", error.message);
      }
    }
  });

  ffmpeg.on("close", (code) => {
    console.log(`FFmpeg stopped. Exit code: ${code}`);

    ffmpeg = null;

    if (!shuttingDown && ws && ws.readyState === WebSocket.OPEN) {
      console.log("Restarting FFmpeg in 1 second...");

      setTimeout(() => {
        if (!shuttingDown && ws && ws.readyState === WebSocket.OPEN) {
          startCapture();
        }
      }, 1000);
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

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();

  heartbeatTimer = setInterval(() => {
    if (!ws) {
      return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.ping();
      } catch {
        console.log("Heartbeat failed. Closing connection...");
        ws.close();
      }
    }
  }, 10000);
}

function scheduleReconnect() {
  if (shuttingDown) {
    return;
  }

  if (reconnectTimer) {
    return;
  }

  console.log(`Reconnecting in ${reconnectDelay / 1000} seconds...`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;

    connect();

    reconnectDelay = Math.min(
      reconnectDelay * 2,
      MAX_RECONNECT_DELAY
    );
  }, reconnectDelay);
}

function connect() {
  if (shuttingDown) {
    return;
  }

  console.log(`Connecting to ${SERVER_URL}...`);

  ws = new WebSocket(SERVER_URL);

  ws.on("open", () => {
    console.log("========================================");
    console.log("CONNECTED TO RECEIVER");
    console.log("========================================");

    // Successful connection.
    reconnectDelay = 2000;

    startHeartbeat();
    startCapture();
  });

  ws.on("close", () => {
    console.log("Receiver disconnected.");

    stopHeartbeat();
    stopCapture();

    scheduleReconnect();
  });

  ws.on("error", (error) => {
    console.log("WebSocket connection error:", error.message);
  });

  ws.on("unexpected-response", () => {
    console.log("Server rejected the WebSocket connection.");
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

  shuttingDown = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  stopHeartbeat();
  stopCapture();

  if (ws) {
    try {
      ws.close();
    } catch {}
  }

  process.exit(0);
});

const { WebSocketServer } = require("ws");

const PORT = 8765;

let totalBytes = 0;
let connected = false;
let lastReport = Date.now();

const wss = new WebSocketServer({
  port: PORT
});

console.log("========================================");
console.log("MAHDI MUSIC AUDIO RECEIVER TEST");
console.log("========================================");
console.log(`Listening on ws://127.0.0.1:${PORT}`);
console.log("Waiting for helper...");
console.log("========================================");

wss.on("connection", (socket) => {
  connected = true;
  totalBytes = 0;

  console.log("");
  console.log("HELPER CONNECTED");
  console.log("Receiving audio data...");
  console.log("");

  socket.on("message", (data) => {
    totalBytes += data.length;

    const now = Date.now();

    if (now - lastReport >= 1000) {
      console.log(
        `Receiving audio: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`
      );

      totalBytes = 0;
      lastReport = now;
    }
  });

  socket.on("close", () => {
    connected = false;
    console.log("");
    console.log("HELPER DISCONNECTED");
    console.log("");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
});

wss.on("error", (error) => {
  console.error("Server error:", error.message);
});

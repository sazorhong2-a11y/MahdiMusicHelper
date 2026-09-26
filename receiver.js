```js
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8765;
const HOST = "0.0.0.0";

let totalBytes = 0;
let lastReport = Date.now();

const wss = new WebSocketServer({
  host: HOST,
  port: PORT
});

console.log("========================================");
console.log("MAHDI MUSIC AUDIO RECEIVER");
console.log("========================================");
console.log(`Listening on ws://${HOST}:${PORT}`);
console.log("Waiting for helper...");
console.log("========================================");

wss.on("connection", (socket) => {
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
        `Receiving audio: ${(totalBytes / 1024 / 1024).toFixed(2)} MB/s`
      );

      totalBytes = 0;
      lastReport = now;
    }
  });

  socket.on("close", () => {
    console.log("");
    console.log("HELPER DISCONNECTED");
    console.log("");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
});

wss.on("listening", () => {
  console.log(`WebSocket server is listening on port ${PORT}`);
});

wss.on("error", (error) => {
  console.error("Server error:", error.message);
});
```

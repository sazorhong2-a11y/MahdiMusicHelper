const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 10000;

const server = new WebSocketServer({
    host: "0.0.0.0",
    port: PORT
});

console.log("========================================");
console.log("MAHDI MUSIC AUDIO RECEIVER");
console.log("========================================");
console.log("Listening on port " + PORT);
console.log("Waiting for helper...");
console.log("========================================");

server.on("connection", (socket) => {
    console.log("HELPER CONNECTED");

    socket.on("message", (data) => {
        console.log("Received audio data:", data.length, "bytes");
    });

    socket.on("close", () => {
        console.log("HELPER DISCONNECTED");
    });

    socket.on("error", (error) => {
        console.log("WebSocket error:", error.message);
    });
});

server.on("listening", () => {
    console.log("WebSocket server is listening on port " + PORT);
});

server.on("error", (error) => {
    console.log("Server error:", error.message);
});

const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT || 10000;

let helper = null;
let discordBot = null;

const server = new WebSocketServer({
    host: "0.0.0.0",
    port: PORT
});

console.log("========================================");
console.log("MAHDI MUSIC AUDIO RELAY");
console.log("========================================");
console.log("Listening on port " + PORT);
console.log("Waiting for connections...");
console.log("========================================");

server.on("connection", (socket) => {

    console.log("New WebSocket connection");

    socket.once("message", (message) => {

        const text = message.toString();

        // Discord bot identifies itself
        if (text === "DISCORD_BOT") {

            discordBot = socket;

            console.log("DISCORD BOT CONNECTED");

            socket.on("close", () => {
                console.log("DISCORD BOT DISCONNECTED");

                if (discordBot === socket) {
                    discordBot = null;
                }
            });

            return;
        }

        // Audio helper identifies itself
        if (text === "AUDIO_HELPER") {

            helper = socket;

            console.log("AUDIO HELPER CONNECTED");

            socket.on("message", (data) => {

                if (
                    discordBot &&
                    discordBot.readyState === WebSocket.OPEN
                ) {
                    discordBot.send(data);
                }

            });

            socket.on("close", () => {
                console.log("AUDIO HELPER DISCONNECTED");

                if (helper === socket) {
                    helper = null;
                }
            });

            return;
        }

        console.log("Unknown connection type");
        socket.close();
    });

    socket.on("error", (error) => {
        console.log("WebSocket error:", error.message);
    });
});

server.on("listening", () => {

    console.log(
        "WebSocket relay listening on port " + PORT
    );

});

server.on("error", (error) => {

    console.log(
        "Server error:",
        error.message
    );

});

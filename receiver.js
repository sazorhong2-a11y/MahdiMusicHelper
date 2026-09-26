```js
const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

let audioHelper = null;
let discordSocket = null;

const wss = new WebSocketServer({
    host: HOST,
    port: PORT
});

console.log("========================================");
console.log("MAHDI MUSIC AUDIO RELAY");
console.log("========================================");
console.log("Listening on ws://" + HOST + ":" + PORT);
console.log("Waiting for audio helper and Discord bot...");
console.log("========================================");

wss.on("connection", function (socket) {

    console.log("");
    console.log("New WebSocket connection");
    console.log("");

    if (!audioHelper) {

        audioHelper = socket;

        console.log("AUDIO HELPER CONNECTED");

        socket.on("message", function (data) {

            if (
                discordSocket &&
                discordSocket.readyState === WebSocket.OPEN
            ) {
                discordSocket.send(data);
            }

        });

        socket.on("close", function () {

            console.log("AUDIO HELPER DISCONNECTED");

            if (audioHelper === socket) {
                audioHelper = null;
            }

        });

        socket.on("error", function (error) {

            console.error(
                "Audio helper error:",
                error.message
            );

        });

        return;
    }

    if (!discordSocket) {

        discordSocket = socket;

        console.log("DISCORD BOT CONNECTED");
        console.log("Audio relay is ready.");

        socket.on("close", function () {

            console.log("DISCORD BOT DISCONNECTED");

            if (discordSocket === socket) {
                discordSocket = null;
            }

        });

        socket.on("error", function (error) {

            console.error(
                "Discord relay error:",
                error.message
            );

        });

        return;
    }

    console.log("Extra connection rejected.");
    socket.close();
});

wss.on("listening", function () {

    console.log(
        "WebSocket relay listening on port " + PORT
    );

});

wss.on("error", function (error) {

    console.error(
        "Relay server error:",
        error.message
    );

});
```
```js
const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

// Discord bot will connect to this relay.
let discordSocket = null;

const wss = new WebSocketServer({
    host: HOST,
    port: PORT
});

console.log("========================================");
console.log("MAHDI MUSIC AUDIO RELAY");
console.log("========================================");
console.log(`Listening on ws://${HOST}:${PORT}`);
console.log("Waiting for connections...");
console.log("========================================");

wss.on("connection", (socket) => {

    console.log("");
    console.log("WebSocket connection received.");
    console.log("");

    // First connection is the audio helper.
    // Second connection is the Discord bot.
    if (!global.audioHelper) {

        global.audioHelper = socket;

        console.log("AUDIO HELPER CONNECTED");

        socket.on("message", (data) => {

            if (
                discordSocket &&
                discordSocket.readyState === WebSocket.OPEN
            ) {
                discordSocket.send(data);
            }

        });

        socket.on("close", () => {

            console.log("AUDIO HELPER DISCONNECTED");

            if (global.audioHelper === socket) {
                global.audioHelper = null;
            }

        });

        socket.on("error", (error) => {
            console.error(
                "Audio helper error:",
                error.message
            );
        });

        return;
    }

    // Second connection = Discord bot.
    if (!discordSocket) {

        discordSocket = socket;

        console.log("DISCORD BOT CONNECTED");
        console.log("Audio relay is ready.");
        console.log("");

        socket.on("close", () => {

            console.log("DISCORD BOT DISCONNECTED");

            if (discordSocket === socket) {
                discordSocket = null;
            }

        });

        socket.on("error", (error) => {
            console.error(
                "Discord relay error:",
                error.message
            );
        });

        return;
    }

    // Reject additional connections.
    console.log("Extra connection rejected.");

    socket.close();
});

wss.on("listening", () => {

    console.log(
        `WebSocket relay listening on port ${PORT}`
    );

});

wss.on("error", (error) => {

    console.error(
        "Relay server error:",
        error.message
    );

});
```

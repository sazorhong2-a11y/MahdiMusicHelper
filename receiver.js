const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

let audioSocket = null;
let discordSocket = null;

const wss = new WebSocketServer({
host: HOST,
port: PORT
});

console.log("========================================");
console.log("MAHDI MUSIC AUDIO RELAY");
console.log("========================================");
console.log("Listening on port " + PORT);
console.log("Waiting for connections...");
console.log("========================================");

wss.on("connection", function (socket) {

console.log("");
console.log("New WebSocket connection");
console.log("Waiting for connection type...");
console.log("");

let connectionType = null;

socket.on("message", function (data, isBinary) {

    if (!connectionType) {

        if (isBinary) {
            console.log(
                "Binary data received before identification."
            );

            socket.close();
            return;
        }

        try {

            const message = JSON.parse(data.toString());

            if (message.type === "audio") {

                if (audioSocket) {

                    console.log(
                        "Audio helper already connected."
                    );

                    socket.close();
                    return;
                }

                connectionType = "audio";
                audioSocket = socket;

                console.log(
                    "AUDIO HELPER CONNECTED"
                );

                if (discordSocket) {
                    console.log(
                        "AUDIO + DISCORD RELAY READY"
                    );
                } else {
                    console.log(
                        "Waiting for Discord bot..."
                    );
                }

                return;
            }

            if (message.type === "discord") {

                if (discordSocket) {

                    console.log(
                        "Discord bot already connected."
                    );

                    socket.close();
                    return;
                }

                connectionType = "discord";
                discordSocket = socket;

                console.log(
                    "DISCORD BOT CONNECTED"
                );

                if (audioSocket) {

                    console.log(
                        "AUDIO + DISCORD RELAY READY"
                    );

                } else {

                    console.log(
                        "Waiting for audio helper..."
                    );
                }

                return;
            }

            console.log(
                "Unknown connection type: " +
                message.type
            );

            socket.close();

        } catch (error) {

            console.log(
                "Invalid identification message: " +
                error.message
            );

            socket.close();
        }

        return;
    }

    if (connectionType === "audio") {

        if (
            discordSocket &&
            discordSocket.readyState === WebSocket.OPEN
        ) {

            try {

                discordSocket.send(data);

            } catch (error) {

                console.log(
                    "Failed to forward audio: " +
                    error.message
                );
            }
        }

        return;
    }

    if (connectionType === "discord") {
        return;
    }
});

socket.on("close", function () {

    if (connectionType === "audio") {

        console.log(
            "AUDIO HELPER DISCONNECTED"
        );

        if (audioSocket === socket) {
            audioSocket = null;
        }
    }

    if (connectionType === "discord") {

        console.log(
            "DISCORD BOT DISCONNECTED"
        );

        if (discordSocket === socket) {
            discordSocket = null;
        }
    }
});

socket.on("error", function (error) {

    console.error(
        (connectionType || "Unknown") +
        " WebSocket error: " +
        error.message
    );
});

});

wss.on("listening", function () {

console.log(
    "WebSocket relay listening on port " + PORT
);

});

wss.on("error", function (error) {

console.error(
    "Relay server error: " +
    error.message
);

});

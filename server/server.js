var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var crypto = require("crypto");


var client_id = "ff19e2ea3546447e916e43dcda51a298";
var client_secret = "7a7eb5370a54460ba06cda2ec6a0ca3b";

app.get("/", function(req, res){
    res.send("<h1>Hello world</h1>");
});



io.on("connection", (socket) => {
    console.log("User connected");
    socket.on("setHash", () => {
        var roomKey = crypto.randomBytes(2).toString("hex");
        socket.join(roomKey);
        console.log("User " + socket.id + " has joined room: " + roomKey + ". Room count: " + io.sockets.adapter.rooms[roomKey].length);
        socket.emit("getHash", roomKey);
    });

    socket.on("joinRoom", (roomKey) => {
        socket.join(roomKey);
        console.log("User " + socket.id + " has joined room: " + roomKey + ". Room count: " + io.sockets.adapter.rooms[roomKey].length);

        socket.on("uploadPlaylist", async () => {


            // Get Playlist
        });
    });

});


io.on("setHash", function(socket) {
    console.log("setHash recevied");
    socket.emit("getHash", crypto.createHash("sha256"));
});

server.listen(3000, function(){
    console.log("listening on localhost:3000");
});

const User = require("./User").User;

require("dotenv").config();
var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var crypto = require("crypto");
var axios = require("axios");
var queryString = require("querystring");
var bodyParser = require('body-parser');
var mongo = require("mongodb").MongoClient;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// This is how the secret key was generated:
// console.log(crypto.randomBytes(64).toString("base64").substring(0,24));
var secretKey = process.env.SECRET_KEY;

var client_id = "ff19e2ea3546447e916e43dcda51a298";
var client_secret = process.env.CLIENT_SECRET;


var users = {};

app.post("/swap", async function(req, res) {
    console.log("post /swap");
    const url = "https://accounts.spotify.com/api/token";
    const body = {
        grant_type: "authorization_code",
        code: req.body.code,
        redirect_uri: "juke://spotify-login-callback"
    }
    const config = {
        headers: {
            "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
        }
    }

    var res2;
    var response = await axios.post(url, queryString.stringify(body), config)
        .then((response) => {
            var body = response.data;
            console.log(body);
            // var cipher = crypto.createCipheriv("aes192", secretKey, "Sidy3FcOhstS-s{W");
            // var crypt = cipher.update(body.refresh_token, "utf8", "hex");
            // crypt += cipher.final("hex");
            // body.refresh_token = crypt;
            res2 = body;
        }).catch((error) => {
            console.log(error);
        });
    res.send(res2);
    return res2;

});

app.post("/refresh", async function(req, res) {
    console.log("post /refresh");
    const url = "https://accounts.spotify.com/api/token";
    const body = {
        grant_type: "refresh_token",
        refresh_token: req.body.refresh_token
    }
    const config = {
        headers: {
            "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
        }
    }

    var res2;
    var response = await axios.post(url, queryString.stringify(body), config)
        .then((response) => {
            var body = response.data;
            console.log(body);
            // var cipher = crypto.createCipheriv("aes192", secretKey, "Sidy3FcOhstS-s{W");
            // var crypt = cipher.update(body.refresh_token, "utf8", "hex");
            // crypt += cipher.final("hex");
            // body.refresh_token = crypt;
            res2 = body;
        }).catch((error) => {
            console.log(error);
        });
    res.send(res2);
    return res2;

});

app.post("/get_id", async function(req, res) {
    console.log("post /get_id");
    console.log(req.body);

    const url = "https://api.spotify.com/v1/me";
    const body = {};
    const config = {
        headers: {
            "Authorization: Bearer ": req.body.access_token // Access token
        }
    }

    var res2;
    var response = await axios.get(url, queryString.stringify(body), config)
        .then((response) => {
            var body = response.data;
            console.log(body);
            res2 = body;
        }).catch((error) => {
            console.log(error);
        });
    res.send(res2);
    return res2;
});

/** postRequest is a generic post request function.
    @param endpoint - The endpoint called.
    @param url - The URL to send the request to.
    @param body - The body of the POST request.
    @param config - The config object of the POST request.
*/
async function postRequest(endpoint, url, body, config) {
    console.log("POST" + endpoint);
    var res;
    var response = await axios.post(url, queryString.stringify(body), config)
        .then((response) => {
            console.log(body);
            res = body;
        }).catch((error) => {
            console.log(error);
        });
    return res;
}

async function getRequest(endpoint, url, body, config) {
    console.log("POST" + endpoint);
    var res;
    var response = await axios.get(url, body, config)
        .then((response) => {
            console.log(body);
            res = body;
        }).catch((error) => {
            console.log(error);
        });
    return res;
}



async function get_spotify_user(access_token, callback) {
    console.log("getting id...");
    await axios({
        method: "get",
        url: "https://api.spotify.com/v1/me",
        headers: {
            "Authorization": "Bearer " + access_token
        }
    }).then((response) => {
        console.log(response);
        callback(response);
    }).catch((error) => {
        console.log(error);
        callback(error);
    });
}

app.post("swap", function(req, res) {
    console.log("post swap");
});

app.get("/spotify-login-callback", function(req, res) {
    console.log("asdjbaliusbda");
});

io.on("connection", (socket) => {
    console.log("User connected");

    users[socket.id] = new User(socket.id);

    socket.on("disconnect", (reason) => {
        console.log("User disconnected: " + reason);
        delete users[socket.id];
    });


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
    socket.on("bp1", function() {
        console.log("bp1");
    });
    socket.on("bp2", function() {
        console.log("bp2");
    });
    socket.on("bp3", function() {
        console.log("bp3");
    });
    socket.on("bp4", function() {
        console.log("bp4");
    });
    socket.on("getPlaylists", function() {
        console.log("emit getPlaylists: ${socket.id}");
        console.log(users);
        socket.emit("gotPlaylists", users[socket.id].getPlaylists());
    });


    app.post("/get_playlists", async function(req, res) {
        console.log("POST /get_playlists");
        users[socket.id].setAccessToken(req.body.access_token);
        await get_spotify_user(req.body.access_token, (user) => {
            users[socket.id].setUserObject(user.data);
            axios({
                method: "get",
                url: "https://api.spotify.com/v1/users/" + user.data.id + "/playlists",
                headers: {
                    "Authorization": "Bearer " + req.body.access_token
                }
            }).then((response) => {
                console.log(response);
                users[socket.id].playlists = response.data.items;
                res.sendStatus(200);
                return response;
            }).catch((error) => {
                console.log(error);
                res.sendStatus(200);
                return error;
            });
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

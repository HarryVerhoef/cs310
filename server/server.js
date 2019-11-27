const User = require("./User").User;
const Lobby = require("./Lobby").Lobby;

require("dotenv").config();
var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var crypto = require("crypto");
var axios = require("axios");
var queryString = require("querystring");
var bodyParser = require('body-parser');
var mongo = require("mongodb").MongoClient;
var request = require("request");

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// This is how the secret key was generated:
// console.log(crypto.randomBytes(64).toString("base64").substring(0,24));
var secretKey = process.env.SECRET_KEY;
var client_id = "ff19e2ea3546447e916e43dcda51a298";
var client_secret = process.env.CLIENT_SECRET;


var lobbies = {};
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
    // Can get access_token from here you dummy
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

    socket.on("login", (uid) => {
        users[uid] = new User(uid);
    });

    socket.on("newLobby", (uid) => {
        var roomKey = crypto.randomBytes(2).toString("hex");
        socket.join(roomKey);
        console.log("User " + uid + " has joined room: " + roomKey + ". Room count: " + io.sockets.adapter.rooms[roomKey].length);
        lobbies[roomKey] = new Lobby(roomKey, uid);
        users[uid].set_lobby(roomKey);
    });

    socket.on("disconnect", (reason) => {
        console.log("User disconnected: " + reason);
        delete users[socket.id];
        // Should probably implement a feature to remove users from the lobby they're in.
    });

    /*  Add users to lobby
    **  @param uid: The unique client device id.
    **  @param roomKey: The unique lobby id.
    */
    socket.on("joinRoom", (uid, roomKey) => {
        socket.join(roomKey);
        console.log("User " + socket.id + " has joined room: " + roomKey + ". Room count: " + io.sockets.adapter.rooms[roomKey].length);
        lobbies[roomKey].add_user(uid);
    });




    socket.on("getPlaylists", (uid) => {
        console.log("emit getPlaylists: " + uid);
        console.log(users);
        socket.emit("gotPlaylists", users[uid].getPlaylists());
    });


    app.post("/get_playlists", async function(req, res) {
        console.log("POST /get_playlists");
        users[req.body.idfv].setAccessToken(req.body.access_token);
        await get_spotify_user(req.body.access_token, (user) => {
            users[req.body.idfv].setUserObject(user.data);
            axios({
                method: "get",
                url: "https://api.spotify.com/v1/users/" + user.data.id + "/playlists",
                headers: {
                    "Authorization": "Bearer " + req.body.access_token
                }
            }).then((response) => {
                users[req.body.idfv].setPlaylists(response.data.items);
                res.sendStatus(200);
                return response;
            }).catch((error) => {
                console.log(error);
                res.sendStatus(200);
                return error;
            });
        });
    });

    // method to get recommended songs from user playlist
    // WebSocket vs RESTful
    // uid is host uid (convenient for access_token)
    app.post("/get_recommendations", async function(req, res) {
        console.log("POST /get_recommendations");
        // For now, get 5 random songs from playlist.
        var user = users[req.body.uid];
        var access_token = user.getAccessToken();

        var seed_artists = [
            "7EQ0qTo7fWT7DPxmxtSYEc",
            "2IDLDx25HU1nQMKde4n61a"
        ];

        var seed_genres = [

        ];

        var seed_tracks = [
            "0cRvK1mcG6zmaD04D6PAnb"
        ];

        var body = {
            limit: 100,
            seed_artists: seed_artists,
            seed_genres: seed_genres,
            seed_tracks: seed_tracks
        };

        console.log(queryString.stringify(body));

        axios({
            method: "get",
            url: "https://api.spotify.com/v1/recommendations?" + queryString.stringify(body),
            headers: {
                "Authorization": "Bearer " + access_token
            }
        }).then((response) => {
            console.log(response);
        }).catch((error) => {
            console.log(error);
        });
    });

});

app.post("/get-image", (req, res) => {
    console.log("POST /get-image");
    console.log(req);
    console.log(req.body.spotify_url);
    // SHOULD PROBABLY MAKE SURE URL IS SPOTIFY
    request(req.body.spotify_url).pipe(res);
});

io.on("setHash", function(socket) {
    console.log("setHash recevied");
    socket.emit("getHash", crypto.createHash("sha256"));
});

server.listen(3000, function(){
    console.log("listening on localhost:3000");
});

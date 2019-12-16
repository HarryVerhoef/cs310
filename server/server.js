

// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {
    var AWS = require('aws-sdk');
    var express = require('express');
    var bodyParser = require('body-parser');

    AWS.config.region = process.env.REGION

    var sns = new AWS.SNS();
    var ddb = new AWS.DynamoDB({
        region: "us-west-2"
    });

    if (!AWS.config.region) {
      AWS.config.update({
        region: "us-west-2"
      });
    }

    var ddbTable = "device";
    var snsTopic =  process.env.NEW_SIGNUP_TOPIC;
    var app = express();

    // app.post('/signup', function(req, res) {
    //     var item = {
    //         'email': {'S': req.body.email},
    //         'name': {'S': req.body.name},
    //         'preview': {'S': req.body.previewAccess},
    //         'theme': {'S': req.body.theme}
    //     };
    //
    //     ddb.putItem({
    //         'TableName': ddbTable,
    //         'Item': item,
    //         'Expected': { email: { Exists: false } }
    //     }, function(err, data) {
    //         if (err) {
    //             var returnStatus = 500;
    //
    //             if (err.code === 'ConditionalCheckFailedException') {
    //                 returnStatus = 409;
    //             }
    //
    //             res.status(returnStatus).end();
    //             console.log('DDB Error: ' + err);
    //         } else {
    //             sns.publish({
    //                 'Message': 'Name: ' + req.body.name + "\r\nEmail: " + req.body.email
    //                                     + "\r\nPreviewAccess: " + req.body.previewAccess
    //                                     + "\r\nTheme: " + req.body.theme,
    //                 'Subject': 'New user sign up!!!',
    //                 'TopicArn': snsTopic
    //             }, function(err, data) {
    //                 if (err) {
    //                     res.status(500).end();
    //                     console.log('SNS Error: ' + err);
    //                 } else {
    //                     res.status(201).end();
    //                 }
    //             });
    //         }
    //     });
    // });

    app.post("/awssss", (req, res) => {
        var item = {
            "device_id": {"S": "asdasdf"}
        }

        ddb.putItem({
            "TableName": ddbTable,
            "Item": item,

        }, (err, data) => {
            if (err) {
                var returnStatus = 500;

                if (err.code === 'ConditionalCheckFailedException') {
                    returnStatus = 409;
                }

                res.status(returnStatus).end();
                console.log('DDB Error: ' + err);
            } else {
                res.status(200).end();
            }
        });
    });

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });

    const User = require("./User").User;
    const Lobby = require("./Lobby").Lobby;

    // require("dotenv").config();
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

        app.post("/make_lobby", async function(req, res) {
            console.log("POST /make_lobby");
            console.log(req.body);
            lobby = lobbies[users[req.body.uid].get_lobby()];
            let playlist = await get_playlist_from_id(req.body.uid, req.body.playlist);
            lobby.set_settings(
                req.body.name,
                await playlist,
                req.body.chat,
                req.body.volume
            );
            res.sendStatus(200);
            return 1;
        });

        socket.on("vote", async (vote) => {
            var lobby = get_lobby_from_uid(vote.uid);
            lobby.vote(vote.tid, users[vote.uid]);
            // emit to room that a vote has been cast.

            // for now, set track to that which is voted for.
            const track = await get_track_from_id(vote.uid, vote.tid);
            lobby.set_track(await track);
        });

        socket.on("getLobbyInfo", (uid) => {
            lobby = lobbies[users[uid].get_lobby()];
            // console.log("socket.getLobbyInfo");
            // console.log(lobby.getName());
            // console.log(lobby.getKey());
            socket.emit("lobbyInfo", {
                name: lobby.getName(),
                key: lobby.getKey(),
                song: {
                    name: lobby.get_track_name(),
                    id: lobby.get_track_id(),
                    image_url: lobby.get_track_image_url(),
                }
            });
        });

        socket.on("getRecommendations", (uid) => {
            console.log("socket.getRecommendations");
            var lobby = get_lobby_from_uid(uid);
            console.log(lobby.get_recommendations());
            socket.emit("recommendations", lobby.get_recommendations());
        });

        socket.on("set_recommendations", async (uid) => {
            console.log("socket.set_recommendations");

            const access_token = get_access_token_from_uid(uid);

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
                limit: 5,
                seed_artists: seed_artists,
                seed_genres: seed_genres,
                seed_tracks: seed_tracks
            };

            const url = "https://api.spotify.com/v1/recommendations?" + queryString.stringify(body);

            let res2 = await axios({
                method: "GET",
                url: url,
                headers: {
                    "Authorization": "Bearer " + access_token
                }
            });

            let tracks = await res2.data.tracks;

            get_lobby_from_uid(uid).set_recommendations(tracks);
            // console.log(get_lobby_from_uid(uid).get_recommendations());
            socket.emit("recommendations_set", tracks);
        });
    });

    app.post("/get-image", (req, res) => {
        console.log("POST /get-image");
        // SHOULD PROBABLY MAKE SURE URL IS SPOTIFY
        request(req.body.spotify_url).pipe(res);
    });

    app.post("/set-track", (req, res) => {

    });





    // method to get recommended songs from user playlist
    // WebSocket vs RESTful
    // uid is host uid (convenient for access_token)
    app.post("/get_recommendations", async function(req, res) {
        console.log("POST /get_recommendations");

        const uid = req.body.uid;
        const access_token = get_access_token_from_uid(uid);

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
            limit: 5,
            seed_artists: seed_artists,
            seed_genres: seed_genres,
            seed_tracks: seed_tracks
        };

        const url = "https://api.spotify.com/v1/recommendations?" + queryString.stringify(body);

        let res2 = await axios({
            method: "GET",
            url: url,
            headers: {
                "Authorization": "Bearer " + access_token
            }
        });

        let tracks = await res2.data.tracks;

        get_lobby_from_uid(uid).set_recommendations(tracks);
        console.log(get_lobby_from_uid(uid).get_recommendations());
        res.sendStatus(200);
        return 1;
    });

    async function get_playlist_from_id(uid, pid) {
        console.log("get_playlist_from_id(" + uid + ", " + pid + ");");

        const access_token = get_access_token_from_uid(uid);

        await axios({
            method: "get",
            url: "https://api.spotify.com/v1/playlists/" + pid,
            headers: {
                "Authorization": "Bearer " + access_token
            }
        }).then((response) => {
            console.log(response);
            return response;
        }).catch((error) => {
            console.log(error);
            return null;
        });
    }

    async function get_track_from_id(uid, tid) {
        console.log("get_playlist_from_id(" + uid + ", " + pid + ");");

        const access_token = get_access_token_from_uid(uid);

        await axios({
            method: "get",
            url: "https://api.spotify.com/v1/tracks/" + tid,
            headers: {
                "Authorization": "Bearer " + access_token
            }
        }).then((response) => {
            console.log(response);
            return response;
        }).catch((error) => {
            console.log(error);
            return null;
        });
    }

    function get_access_token_from_uid(uid) {
        console.log("get_access_token_from_uid(" + uid + ")");
        return users[uid].get_access_token();
    }

    function get_lobby_from_uid(uid) {
        return lobbies[users[uid].get_lobby()];
    }

    io.on("setHash", function(socket) {
        console.log("setHash recevied");
        socket.emit("getHash", crypto.createHash("sha256"));
    });

}

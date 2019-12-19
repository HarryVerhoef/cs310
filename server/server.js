

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
    var app = express();
    var bodyParser = require('body-parser');
    const User = require("./User").User;
    const Lobby = require("./Lobby").Lobby;
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

    AWS.config.region = process.env.REGION

    var sns = new AWS.SNS();
    var ddb = new AWS.DynamoDB({
        region: "us-west-2"
    });

    var ddbTable = "device";


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


    /* getSingleItemFromDDB - Fetches an item from the AWS NoSQL DynamoDB
    ** @param table_name::String - Name of the table
    ** @param key::Object - The primary key object that the desired item owns
    ** @param callback::Function - Callback method to be invoked upon completion
    */
    function getSingleItemFromDDB(table_name, key, callback) {
        ddb.getItem({
            TableName: table_name,
            Key: key
        }, (err, data) => {
            if (err) {
                console.log("Error", err);
                callback(1, err);
            } else {
                callback(0, data);
            }
        });
    }

    /* putItemInDDB - Puts a new item into an AWS NoSQL DynamoDB table
    ** @param table_name::String - Name of the table
    ** @param item::Object - Object representing the item
    ** @param callback::Function - Callback method to be invoked upon completion
    */
    function putItemInDDB(table_name, item, callback) {
        ddb.putItem({
            TableName: table_name,
            Item: item
        }, (err, data) => {
            if (err) {
                console.log("Error", err);
                callback(1, err);
            } else {
                callback(0, data);
            }
        });
    }

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });





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

        var response = await axios.post(url, queryString.stringify(body), config)
            .then((response) => {
                var body = response.data;
                console.log(body);
                // var cipher = crypto.createCipheriv("aes192", secretKey, "Sidy3FcOhstS-s{W");
                // var crypt = cipher.update(body.refresh_token, "utf8", "hex");
                // crypt += cipher.final("hex");
                // body.refresh_token = crypt;

                res.send(body);
            }).catch((error) => {
                console.log(error);
                res.sendStatus(500);
        });
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

        var response = await axios.post(url, queryString.stringify(body), config)
            .then((response) => {
                var body = response.data;
                console.log(body);
                // var cipher = crypto.createCipheriv("aes192", secretKey, "Sidy3FcOhstS-s{W");
                // var crypt = cipher.update(body.refresh_token, "utf8", "hex");
                // crypt += cipher.final("hex");
                // body.refresh_token = crypt;
                res2 = body;
                res.send(body);
            }).catch((error) => {
                console.log(error);
                res.sendStatus(500);
        });
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
                res.send(body);
            }).catch((error) => {
                console.log(error);
                res.sendStatus(500);
        });
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

    io.on("connection", (socket) => {
        console.log("User connected");

        socket.on("login", (uid) => {
            users[uid] = new User(uid);
            // Attempt to get user info, based on unique device id.
            // If no item then put new one in.

            const item = {
                "device_id": {"S": "asdasdf"},
                "socket_id": {"S": socket.id}
            }

            getSingleItemFromDDB("device", item["device_id"], (err, data) => {
                if (err) {
                    console.log("Error at retrieval of device item");
                } else if (data.Item == undefined || result.Item == null) {
                    console.log("Could not find any device information in DynamoDB");
                    putItemInDDB("device", item, (err, data) => {
                        if (err) {
                            console.log("Error putting item in to DynamoDB");
                        } else {
                            console.log("DEVICE-SOCKET put into DynamoDB");
                        }
                    });
                } else {
                    // Update device id to contain new socket id.
                    updateItemInDDB(
                        "device",
                        {
                            "device_id": uid
                        },
                        "set socket_id = :s",
                        {
                            ":s": socket.id
                        },
                        (err, msg) => {
                            if (err) {
                                console.log("Error updating device-socket item");
                            } else {
                                console.log("Updated device-socket item: " + msg);
                            }
                        }
                    )
                }
            });
        });

        socket.on("newLobby", (uid) => {
            var roomKey = crypto.randomBytes(2).toString("hex");
            socket.join(roomKey);
            console.log("User " + uid + " has joined room: " + roomKey + ". Room count: " + io.sockets.adapter.rooms[roomKey].length);
            putItemInDDB("lobby", {
                "lobby_key": {"S": roomKey}
            }, (err, msg) => {
                if (err) {
                    console.log("Error putting lobby item in DynamoDB" + err);
                } else {
                    updateItemInDDB(
                        "device",
                        {
                            "device_id": uid
                        },
                        "set lobby_key = :k",
                        {
                            ":k": roomKey
                        },
                        (err, msg) => {
                            if (err) {
                                console.log("Error updating device item with lobby key");
                            } else {
                                console.log("Updated device item with lobby key");
                            }
                        }
                    );
                }
            })

        });

        socket.on("disconnect", (reason) => {
            console.log("User disconnected: " + reason);
            // Sockets leave all rooms they are part of autoamtically
        });

        /*  Add users to lobby
        **  @param uid: The unique client device id.
        **  @param roomKey: The unique lobby id.
        */
        socket.on("joinRoom", (uid, roomKey) => {
            socket.join(roomKey);
            console.log("User " + socket.id + " has joined room: " + roomKey + ". Room count: " + io.sockets.adapter.rooms[roomKey].length);

            updateItemInDDB(
                "device",
                {
                    "device_id": uid
                },
                "set lobby_key = :k",
                {
                    ":k": roomKey
                },
                (err, msg) => {
                    if (err) {
                        console.log("Error encountered while updating device room: " + msg);
                    } else {
                        console.log("Successfully updated device lobby key");
                    }
                }
            );
        });




        socket.on("getPlaylists", (uid) => {
            console.log("emit getPlaylists: " + uid);
            console.log(users);
            socket.emit("gotPlaylists", users[uid].getPlaylists());
        });


        app.post("/get_playlists", async function(req, res) {
            console.log("POST /get_playlists");

            updateItemInDDB(
                "device",
                {
                    "device_id": req.body.idfv
                },
                "set access_token = :a",
                {
                    ":a": req.body.access_token
                },
                (err, msg) => {
                    if (err) {
                        console.log("Error setting device access token: " + msg);
                    } else {
                        console.log("Successfully added access_token to device");
                    }
                }
            );

            await get_spotify_user(req.body.access_token, (user) => {
                axios({
                    method: "get",
                    url: "https://api.spotify.com/v1/users/" + user.data.id + "/playlists",
                    headers: {
                        "Authorization": "Bearer " + req.body.access_token
                    }
                }).then((response) => {
                    // users[req.body.idfv].setPlaylists(response.data.items);
                    // res.sendStatus(200);
                    res.send(response.data.items);
                    return response;
                }).catch((error) => {
                    console.log("Error retrieving user playlists: " + error);
                    res.sendStatus(500);
                    return error;
                });
            });
        });

        app.post("/make_lobby", async function(req, res) {
            console.log("POST /make_lobby");
            console.log(req.body);
            // lobby = lobbies[users[req.body.uid].get_lobby()];
            const lobby_key = get_lobby_from_uid(req.body.uid);
            let playlist = await get_playlist_from_id(req.body.uid, req.body.playlist);
            // lobby.set_settings(
            //     req.body.name,
            //     await playlist,
            //     req.body.chat,
            //     req.body.volume
            // );
            updateItemInDDB(
                "lobby",
                {
                    "lobby_key": lobby_key
                },
                "set lobby_name = :n, lobby_playlist_id = :p, lobby_chatEnabled = :c, lobby_volumeEnabled = :v",
                {
                    ":n": req.body.name,
                    ":p": await playlist,
                    ":c": req.body.chat,
                    ":v": req.body.volume
                },
                (err, msg) => {
                    if (err) {
                        console.log("Error updating lobby settings: " + err);
                    } else {
                        console.log("Successfully updated lobby settings");
                    }
                }
            )
            res.sendStatus(200);
            return 1;
        });

        socket.on("vote", async (vote) => {
            const lobby_key = get_lobby_from_uid(vote.uid);
            const song_id = vote.uid.song_id;
            /*

            votes = {
                device_id: song_uri,
                device_id: song_uri,
                ...
            }


            */

            // LOBBY_KEY | SONG_ID | VOTE_NO

            updateItemInDDB(
                "votes",
                {
                    "lobby_key": lobby_key,
                    "song_id": song_id
                },
                "set vote_no = vote_no + :v",
                {
                    ":v": 1
                },
                (err, msg) => {
                    if (err) {
                        console.log("Error incrementing vote_no in DDB");
                    } else {
                        console.log("Successfully updated vote_no for song " + song_id + ", in lobby " + lobby_key);
                    }
                }
            );


            // lobby.vote(vote.tid, users[vote.uid]);
            // emit to room that a vote has been cast.
            socket.rooms[0].emit("refreshVotes");
            // for now, set track to that which is voted for.
            // const track = await get_track_from_id(vote.uid, vote.tid);
            updateItemInDDB(
                "lobby",
                {
                    "lobby_key": lobby_key
                },
                "set current_track_id = :c",
                {
                    ":c": track_id
                },
                (err, msg) => {
                    if (err) {
                        console.log("Error setting lobby current track. Lobby: " + lobby_key + ", Track: " + track_id + "..." + msg);
                    } else {
                        console.log("Successfully set lobby current track.");
                    }
                }
            );

            // lobby.set_track(await track);
        });

        socket.on("getLobbyInfo", (uid) => {
            // lobby = lobbies[users[uid].get_lobby()];
            const lobby_key = get_lobby_from_uid(uid);
            var lobby_name;
            var lobby_track_id;
            var lobby_track_name;
            var lobby_track_image_url;

            // console.log("socket.getLobbyInfo");
            // console.log(lobby.getName());
            // console.log(lobby.getKey());
            getSingleItemFromDDB(
                "lobby",
                {
                    "lobby_key": lobby_key
                },
                (err, data) => {
                    if (err) {
                        console.log("Error retrieving lobby information..." + data);
                    } else {
                        const track = get_track_from_id(data.Item.current_track_id);
                        lobby_name = data.Item.lobby_name;
                        lobby_track_id = data.Item.current_track_id;
                        lobby_track_name = track.name;
                        lobby_track_image_url = track.images[0];
                    }
                }
            );
            socket.emit("lobbyInfo", {
                name: lobby_name,
                key: lobby_key,
                song: {
                    name: lobby_track_name,
                    id: lobby_track_id,
                    image_url: lobby_track_image_url
                }
            });
        });

        socket.on("getRecommendations", (uid) => {
            console.log("socket.getRecommendations");
            const lobby_key = get_lobby_from_uid(uid);
            // console.log(lobby.get_recommendations());
            getSingleItemFromDDB(
                "lobby",
                {
                    "lobby_key": lobby_key
                },
                (err, data) => {
                    if (err) {
                        console.log("Error retrieving lobby recommendations for lobby " + lobby_key + "..." + data);
                    } else {
                        console.log("Successfully retrieved lobby recommendations");
                        socket.emit("recommendations", data.Item.lobby_recommendations);
                    }
                }
            );

        });

        socket.on("set_recommendations", async (uid) => {
            console.log("socket.set_recommendations");
            const lobby_key = get_lobby_from_uid(uid);
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
            updateItemInDDB(
                "lobby",
                {
                    "lobby_key": lobby_key
                },
                "set lobby_recommendations = :r",
                {
                    ":r": tracks
                },
                (err, msg) => {
                    if (err) {
                        console.log("Error updating lobby recommendations for lobby " + lobby_key + "..." + msg);
                    } else {
                        console.log("Successfully updated lobby recommendations for lobby " + lobby_key);
                        socket.emit("recommendations_set", tracks);
                    }
                }
            );
            // console.log(get_lobby_from_uid(uid).get_recommendations());

        });
    });

    app.post("/get-image", (req, res) => {
        console.log("POST /get-image");
        // SHOULD PROBABLY MAKE SURE URL IS SPOTIFY
        request(req.body.spotify_url).pipe(res);
    });

    app.post("/set-track", (req, res) => {
        //
    });





    // method to get recommended songs from user playlist
    // WebSocket vs RESTful
    // uid is host uid (convenient for access_token)
    // app.post("/get_recommendations", async function(req, res) {
    //     console.log("POST /get_recommendations");
    //
    //     const uid = req.body.uid;
    //     const lobby_key = get_lobby_from_uid(uid);
    //     const access_token = get_access_token_from_uid(uid);
    //
    //     var seed_artists = [
    //         "7EQ0qTo7fWT7DPxmxtSYEc",
    //         "2IDLDx25HU1nQMKde4n61a"
    //     ];
    //
    //     var seed_genres = [
    //
    //     ];
    //
    //     var seed_tracks = [
    //         "0cRvK1mcG6zmaD04D6PAnb"
    //     ];
    //
    //     var body = {
    //         limit: 5,
    //         seed_artists: seed_artists,
    //         seed_genres: seed_genres,
    //         seed_tracks: seed_tracks
    //     };
    //
    //     const url = "https://api.spotify.com/v1/recommendations?" + queryString.stringify(body);
    //
    //     let res2 = await axios({
    //         method: "GET",
    //         url: url,
    //         headers: {
    //             "Authorization": "Bearer " + access_token
    //         }
    //     });
    //
    //     let tracks = await res2.data.tracks;
    //
    //     // get_lobby_from_uid(uid).set_recommendations(tracks);
    //     // console.log(get_lobby_from_uid(uid).get_recommendations());
    //     res.sendStatus(200);
    //     return 1;
    // });

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
        getSingleItemFromDDB(
            "device",
            {
                "device_id": uid
            },
            (err, data) => {
                if (err) {
                    console.log("Error retrieving the access token from uid: " + data);
                    return;
                } else {
                    console.log("Successfully retrieved access_token from uid");
                    return data.Item.access_token;
                }
            }
        );
    }

    async function get_lobby_from_uid(uid) {
        getSingleItemFromDDB(
            "device",
            {
                "device_id": uid
            },
            (err, data) => {
                if (err) {
                    console.log("Error retrieving lobby key from uid: " + data);
                    return;
                } else {
                    console.log("Got lobby key from uid");
                    return data.Item.lobby_key;
                }
            }
        );
    }

    io.on("setHash", function(socket) {
        console.log("setHash recevied");
        socket.emit("getHash", crypto.createHash("sha256"));
    });

}

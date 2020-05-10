"use static";
const queryString = require("querystring");
const axios = require("axios");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();



exports.handler = async (event, context, callback) => {
    console.log("POST /get_recommendations");
    console.log(event);
    const req = queryString.parse(event.body);
    var res;



    /*
    ** 1. Get lobby_key from uid
    ** 2. Query the recommendations feature in Spotify API
    ** 3. Create recommendations array for DDB
    ** 4. Put recommendations in lobby item
    ** 5. Return response (res)
    */


    try {


        /* (1) Get lobby_key from uid */

        let lobby_key_res = await dynamo.getItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            AttributesToGet: ["lobby_key", "lobby_name"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;

        let lobby_info_res = await dynamo.getItem({
            TableName: "lobby",
            Key: {
                "lobby_key": {"S": lobby_key}
            },
            AttributesToGet: ["lobby_name", "lobby_length", "lobby_weighted_track_rankings", "lobby_nlp_genres", "active_track", "thumbs_map", "playlist_id"]
        }).promise();


        let lobby_name = lobby_info_res.Item.lobby_name.S;
        let lobby_length = lobby_info_res.Item.lobby_length.N;
        let lobby_weighted_track_rankings = lobby_info_res.Item.lobby_weighted_track_rankings.M;
        let playlist_id = lobby_info_res.Item.playlist_id.S;

        /* (2) Get base playlist */

        let base_playlist_tracks = await getBase(req.access_token, playlist_id);

        console.log(base_playlist_tracks);
        console.log(base_playlist_tracks.length);




        /* (2) Invoking the Sagemaker NLP runtime to infer genre based on lobby name*/

        if (lobby_length == 0) {
            let recommendations_url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_genre?" + queryString.stringify({"data": lobby_name});

            let recommendations_nlp = await axios.post(recommendations_url, {
                headers: {
                    Accept: "application/json"
                }
            });

            console.log(recommendations_nlp);

            await dynamo.updateItem({
            TableName: "lobby",
                Key: {
                    "lobby_key": {"S": lobby_key}
                },
                UpdateExpression: "set lobby_nlp_genres = :l",
                ExpressionAttributeValues: {
                    ":l": {"L": [
                        {"S": recommendations_nlp.data[0]},
                        {"S": recommendations_nlp.data[1]},
                        {"S": recommendations_nlp.data[2]}
                    ]},
                },
                ReturnValues: "NONE"
            }).promise();

            let seed_genres = recommendations_nlp.data;

            let nlp_recommendations = await queryRecommendations(req.access_token, lobby_key, lobby_length, seed_genres, [], []);

            let recommendations = await shuffleArray(base_playlist_tracks, lobby_key, lobby_length);

            console.log(recommendations);

            res = {
                statusCode: 200,
                body: JSON.stringify(recommendations)
            };

            console.log(res);

            return res;


        } else {
            var min_ranking;

            console.log(lobby_info_res.Item.lobby_nlp_genres);
            console.log(JSON.stringify(lobby_info_res.Item.lobby_nlp_genres));

            let lobby_nlp_genres = lobby_info_res.Item.lobby_nlp_genres.L.map(function(item) { return item.S; });
            let thumbs_map = lobby_info_res.Item.thumbs_map.M;

            console.log(lobby_nlp_genres);

            let num_seed_genres_used = Math.max(0, 3 - lobby_length);
            let seed_genres = lobby_nlp_genres.slice(0, num_seed_genres_used);

            /* (4) Check to see if track can be added to lobby_weighted_track_rankings */

            let active_track = lobby_info_res.Item.active_track.M.id.S;

            console.log("LOBBY_WEIGHTED_TRACK_RANKINGS");
            console.log(lobby_weighted_track_rankings);

            if (lobby_length == 1) {
                min_ranking = 0;
            } else {
                min_ranking = Math.min(...Object.keys(lobby_weighted_track_rankings).map(w => parseFloat(w)));
            }

            var weighted_ranking = 0;

            console.log("THUMBS MAP");
            console.log(thumbs_map);

            for (var user_id in thumbs_map) {

                console.log(user_id);
                console.log(thumbs_map[user_id]);

                // Get user weighting
                let user_weighting_res = await dynamo.getItem({
                    TableName: "device",
                    Key: {
                        "device_id": {"S": user_id}
                    },
                    AttributesToGet: ["user_weighting"]
                }).promise();

                let user_weighting = parseFloat(user_weighting_res.Item.user_weighting.N);

                console.log(user_weighting);

                weighted_ranking = Math.max( -0.5 * weighted_ranking, parseFloat(weighted_ranking + (user_weighting * parseFloat(thumbs_map[user_id].N))));


            }

            console.log("Weighted Ranking: " + weighted_ranking.toString());
            console.log("Min ranking: " + min_ranking.toString());

            if (Object.keys(lobby_weighted_track_rankings).length < 5 || min_ranking < weighted_ranking) {

                let track_features = await axios.get("https://api.spotify.com/v1/audio-features/" + active_track, {
                    headers: {
                        "Authorization": "Bearer " + req.access_token
                    }
                });

                console.log(track_features);

                let track_info = await axios.get("https://api.spotify.com/v1/tracks/" + active_track, {
                    headers: {
                        "Authorization": "Bearer " + req.access_token
                    }
                });

                console.log(track_info);

                let artist_id = track_info["data"]["artists"][0]["id"];


                console.log(track_features);


                const rnn_track_object = {
                    "artist_id": {"S": artist_id},
                    "track_features": {"L": [
                        {"N": track_features.data.acousticness.toString()},
                        {"N": track_features.data.danceability.toString()},
                        {"N": track_features.data.energy.toString()},
                        {"N": track_features.data.instrumentalness.toString()},
                        {"N": track_features.data.liveness.toString()},
                        {"N": track_features.data.loudness.toString()},
                        {"N": track_features.data.speechiness.toString()},
                        {"N": track_features.data.valence.toString()}
                    ]}
                };

                if (Object.keys(lobby_weighted_track_rankings).length < 5) {
                    lobby_weighted_track_rankings[weighted_ranking.toString()] = {"M": rnn_track_object};
                } else if (min_ranking < weighted_ranking) {
                    delete lobby_weighted_track_rankings[min_ranking.toString()];
                    lobby_weighted_track_rankings[weighted_ranking.toString()] = {"M": rnn_track_object};
                }



            }

            var rnn_input_1 = [];
            var rnn_input_2 = [];

            var temp_api_seed_artists = [];

            console.log(lobby_weighted_track_rankings);

            await dynamo.updateItem({
                TableName: "lobby",
                Key: {
                    lobby_key: {"S": lobby_key}
                },
                UpdateExpression: "set lobby_weighted_track_rankings = :r",
                ExpressionAttributeValues: {
                    ":r": {"M": lobby_weighted_track_rankings},
                },
                ReturnValues: "NONE"
            }).promise();

            for (var wr in lobby_weighted_track_rankings) {
                rnn_input_1.push(lobby_weighted_track_rankings[wr].M.artist_id.S);
                rnn_input_2.push(lobby_weighted_track_rankings[wr].M.track_features.L.map(function(item) {
                    return parseFloat(item.N);
                }));
                temp_api_seed_artists.push(lobby_weighted_track_rankings[wr].M.artist_id.S);
            }


            if (rnn_input_1.length != 0 && rnn_input_1.length < 5) {
                for (var i = rnn_input_1.length; i < 5; i++) {
                    rnn_input_1[i] = rnn_input_1[rnn_input_1.length - 1];
                    rnn_input_2[i] = rnn_input_2[rnn_input_2.length - 1];
                }
            }

            console.log(rnn_input_1);
            console.log(rnn_input_2);

            const rnn_url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_artists";

            let rnn_artists = await axios.post(rnn_url, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    weighted_tracks: rnn_input_1,
                    track_features: rnn_input_2
                })
            });
            console.log(rnn_artists);

            let seed_artists = rnn_artists.data;

            let rnn_recommendations = await queryRecommendations(req.access_token, lobby_key, lobby_length, seed_genres, temp_api_seed_artists, []);

            let recommendations = await shuffleArray(base_playlist_tracks.concat(rnn_recommendations), lobby_key, lobby_length);

            res = {
                statusCode: 200,
                body: JSON.stringify(recommendations)
            };

            console.log(res);



            return res;
        }





    } catch (error) {

        res = {
            statusCode: 500,
            body: error
        };

        console.log(res);

        return res;

    }
};

async function queryRecommendations(access_token, lobby_key, lobby_length, seed_genres, seed_artists, seed_tracks) {

    var body = {
        limit: 10,
        seed_artists: seed_artists,
        seed_genres: seed_genres,
        seed_tracks: seed_tracks
    };

    console.log(body);

    let recommendations = await axios({
        method: "get",
        url: "https://api.spotify.com/v1/recommendations?" + queryString.stringify(body),
        headers: {
            "Authorization": "Bearer " + access_token
        }
    });



    return recommendations.data.tracks;
}


async function getBase(access_token, playlist_id) {

    const base_url = "https://api.spotify.com/v1/playlists/" + playlist_id;

    let base_playlist_res = await axios.get(base_url, {
        headers: {
            "Authorization": "Bearer " + access_token
        }
    });

    console.log("BASE PLAYLIST TRACKS");
    let base_tracks = base_playlist_res.data.tracks.items;

    console.log(base_tracks);
    console.log(base_tracks.length);

    var base_set = new Set();

    while (base_set.size < Math.min(10,base_tracks.length)) {
        base_set.add(base_tracks[Math.floor(Math.random() * base_tracks.length)]["track"]);
    }

    console.log(Array.from(base_set));

    return Array.from(base_set);
}

async function shuffleArray(array, lobby_key, lobby_length) {

    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }


    let recommendations_dynamo = [];

    array.forEach((item) => {

        let artistString = item.artists.map((val) => val.name).join(", ");

        recommendations_dynamo.push({"M": {
            "track_id": {"S": item.id},
            "track_name": {"S": item.name},
            "track_artists": {"S": artistString},
            "track_cover_image_url": {"S": item.album.images[1].url},
            "track_duration_ms": {"N": item.duration_ms.toString()}
        }});
    });

    console.log(recommendations_dynamo);

    /* (4) Put recommendations in lobby item */

    await dynamo.updateItem({
        TableName: "lobby",
        Key: {
            "lobby_key": {"S": lobby_key}
        },
        UpdateExpression: "set recommendations = :r, lobby_length = lobby_length + :val",
        ExpressionAttributeValues: {
            ":r": {"L": recommendations_dynamo},
            ":val": {"N": lobby_length + 1}
        },
        ReturnValues: "NONE"
    }).promise();

    return array;
}

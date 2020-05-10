"use static";
const queryString = require("querystring");
const axios = require("axios");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event, context, callback) => {
    console.log("POST /get_playlist");
    console.log(event);

    const req = queryString.parse(event.body);
    var spotify_id;
    var res;


    /*
    ** 1. Get spotify user id from Spotify API
    ** 2. Put Item in DynamoDB (Replaces any other occurence with same key)
    ** 3. Get user's owned playlists from Spotify API
    ** 4. Return playlists as stringified JSON
    */


    /* (1) Get spotify user id from Spotify API */

    try {

        let user = await axios({
            method: "get",
            url: "https://api.spotify.com/v1/me",
            headers: {
                "Authorization": "Bearer " + req.access_token
            }
        });

        spotify_id = user.data.id;

        /* (2) Put Item in DynamoDB (Replaces any other occurence with same key) */

        dynamo.putItem({
            TableName: "device",
            Item: {
                "device_id": {"S": req.uid},
                "spotify_user_id": {"S": spotify_id},
                "access_token": {"S": req.access_token},
                "user_weighting": {"N": "1"}
            }
        }, (err, data) => {
            if (err) {
                res = {
                    statusCode: 500,
                    body: JSON.stringify({
                        data: err
                    })
                };
                console.log(res);
                return res;
            } else {
                console.log("UPDATED ITEM: " + data);
            }
        });

        /* (3) Get user's owned playlists from Spotify API */

        let playlists = await axios({
            method: "get",
            url: "https://api.spotify.com/v1/users/" + spotify_id + "/playlists",
            headers: {
                "Authorization": "Bearer " + req.access_token
            }
        });

        /* (4) Return playlists as stringified JSON */

        res = {
            statusCode: 200,
            body: JSON.stringify(playlists.data.items)
        };

        console.log(res);
        return res;

    } catch (error) {

        res = {
            statusCode: 500,
            body: JSON.stringify({
                data: error
            })
        };

        console.log(res);
        return res;
    }
};

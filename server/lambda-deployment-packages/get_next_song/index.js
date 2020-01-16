"use static";
const queryString = require("querystring");
const axios = require("axios");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
    const req = queryString.parse(event.body);
    var res;

    /*
    ** 1. Get lobby_key from device table
    ** 2. Get lobby-wide votes object
    ** 3. Work out next track
    ** 4. Get track info
    ** 5. Convert artists array into a string of artist names separated by commas
    ** 6. Create track objects
    ** 7. Put track map in lobby item
    ** 8. Remove lobby-track items from this lobby
    ** 9. Return stringified track object
    */

    try {

        /* (1) Get lobby_key from device table */

        let lobby_key_res = await dynamo.getItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            AttributesToGet: ["lobby_key"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;

        /* (2) Get lobby-wide votes object */

        let vote_array_res = await dynamo.query({
            TableName: "lobby-track",
            ProjectionExpression: "track_id, vote_no",
            KeyConditionExpression: "lobby_key = :lk",
            ExpressionAttributeValues: {
                ":lk": {"S": lobby_key}
            }
        }).promise();

        let vote_array = vote_array_res.Items;

        /* (3) Work out next track */

        var max = -1;
        var nextTrack = "";
        var deleteRequests = [];

        vote_array.forEach((item) => {
            if (item.vote_no.N > max) {
                max = item.vote_no.N;
                nextTrack = item.track_id.S;
            }
            deleteRequests.push({
                DeleteRequest: {
                    Key: {
                        "lobby_key": {"S": lobby_key},
                        "track_id": {"S": item.track_id.S}
                    }
                }
            });
        });


        /* (4) Get track info */

        let track_res = await axios({
            method: "get",
            url: "https://api.spotify.com/v1/tracks/" + nextTrack,
            headers: {
                "Authorization": "Bearer "+ req.access_token
            }
        });

        console.log(track_res);

        /* (5) Convert artists array into a string of artist names separated by commas */

        var newArr = track_res.data.artists.map(function(val, index) {
            return val.name;
        });

        var artistsString = newArr.join(", ");

        /* (6) Create track objects */

        let track = {
            id: nextTrack,
            name: track_res.data.name,
            image_url: track_res.data.album.images[0].url,
            artists: artistsString,
            length: track_res.data.duration_ms
        };

        let track_dynamo = {
            id: {"S": nextTrack},
            name: {"S": track_res.data.name},
            image_url: {"S": track_res.data.album.images[0].url},
            artists: {"S": artistsString},
            length: {"N": track_res.data.duration_ms.toString()}
        };


        /* (7) Put track map in lobby item */

        let update_lobby_res = await dynamo.updateItem({
            TableName: "lobby",
            Key: {
                lobby_key: {"S": lobby_key}
            },
            UpdateExpression: "set active_track = :t",
            ExpressionAttributeValues: {
                ":t": {"M": track_dynamo}
            },
            ReturnValues: "ALL_NEW"
        }).promise();


        /* (8) Remove lobby-track items from this lobby */

        console.log(deleteRequests);

        await dynamo.batchWriteItem({
            RequestItems: {
                "lobby-track": deleteRequests
            }
        }).promise();


        /* (9) Return stringified track object */

        res = {
            statusCode: 200,
            body: JSON.stringify(track)
        };

        console.log(res);
        return res;

    } catch (error) {

        res = {
            statusCode: 500,
            body: error
        };

        console.log(res);
        return res;

    }
};

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
            AttributesToGet: ["lobby_key"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;

        /* (2) Query the recommendations feature in Spotify API */

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

        let recommendations = await axios({
            method: "get",
            url: "https://api.spotify.com/v1/recommendations?" + queryString.stringify(body),
            headers: {
                "Authorization": "Bearer " + req.access_token
            }
        });

        /* (3) Create recommendations array for DDB */

        let recommendations_dynamo = [];

        recommendations.data.tracks.forEach((item) => {

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
            UpdateExpression: "set recommendations = :r",
            ExpressionAttributeValues: {
                ":r": {"L": recommendations_dynamo}
            },
            ReturnValues: "NONE"
        }).promise();

        /* (5) Return response (res) */

        res = {
            statusCode: 200,
            body: JSON.stringify(recommendations.data.tracks)
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

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
    ** 1. Query the recommendations feature in Spotify API
    ** 2. return result (res)
    */

    /* (1) Query the recommendations feature in Spotify API */
    try {

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

        /* (2) Return response (res) */

        res = {
            statusCode: 200,
            body: JSON.stringify(recommendations.data.tracks)
        };

        console.log(res);

        return res;


    } catch (error) {

        res = {
            statusCode: 500,
            body: JSON.stringify(error)
        };

        console.log(res);

        return res;

    }
};

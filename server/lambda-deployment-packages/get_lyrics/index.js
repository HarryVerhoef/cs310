"use static";
const queryString = require("querystring");
const axios = require("axios");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
    const req = queryString.parse(event.body);
    console.log(req);
    var res;

    /*
    ** 1. Check if lobby exists
    ** 2. Add new item to device table
    */


    try {

        const req = queryString.parse(event.body);

        console.log(req);

        // console.log(event);

        const song_name = req.name;

        const song_artist = req.artist;

        const track_id = req.track_id;

        const genius_search_url = "https://api.genius.com/search?" + queryString.stringify({"q": song_name + song_artist});

        let genius_search_res = await axios.get(genius_search_url, {
            headers: {
                "Authorization": "Bearer " + process.env.access_token
            }
        });


        let hits = genius_search_res["data"]["response"]["hits"];

        console.log(hits);

        if (hits.length > 0) {

            console.log(hits.length);

            let probable_genius_id = hits[0]["result"]["id"];

            let genius_id_url = "https://api.genius.com/songs/" + probable_genius_id + "?text_format=plain";

            let genius_id_res = await axios.get(genius_id_url, {
                headers: {
                    "Authorization": "Bearer " + process.env.access_token
                }
            });


            let valid_lyrics = checkForMatch(genius_id_res["data"]["response"]["song"]["media"], track_id);

            if (valid_lyrics) {

                console.log("CONFIDENT");

                // Get lyrics from genius_id_res
                let song_description = genius_id_res["data"]["response"]["song"]["description"]["plain"];

                res = {
                    statusCode: 200,
                    body: JSON.stringify({description: song_description})
                };

                console.log(res);
                return res;

            } else {

                // Get lyrics from genius_id_res
                let song_description = genius_id_res["data"]["response"]["song"]["description"]["plain"];

                res = {
                    statusCode: 200,
                    body: JSON.stringify({description: song_description})
                };

                console.log(res);
                return res;
            }

        } else {
            res = {
                statusCode: 404,
                body: JSON.stringify({description: "Sorry, no description was found for this track."})
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
}


function checkForMatch(media, track_id) {
    for (var i in media) {
        console.log(media[i]);
        if (media[i]["provider"] == "spotify" && media[i]["type"] == "audio") {
            if (media[i]["url"] == "https://open.spotify.com/track/" + track_id) {
                return true;
            }
            return false;
        }
    }
    return false;
}

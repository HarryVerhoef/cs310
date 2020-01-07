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

    // GET USER ID FROM ACCESS_TOKEN
    try {
        let user = await axios({
            method: "get",
            url: "https://api.spotify.com/v1/me",
            headers: {
                "Authorization": "Bearer " + req.access_token
            }
        });


        spotify_id = user.data.id;

        // PUT ITEM IN DynamoDB
        dynamo.putItem({
            TableName: "device",
            Item: {
                "device_id": {"S": req.uid},
                "spotify_user_id": {"S": spotify_id},
                "access_token": {"S": req.access_token}
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

        let playlists = await axios({
            method: "get",
            url: "https://api.spotify.com/v1/users/" + spotify_id + "/playlists",
            headers: {
                "Authorization": "Bearer " + req.access_token
            }
        });

        res = {
            statusCode: 200,
            body: JSON.stringify(playlists.data.items)
        };

        console.log(res);

        return res;

    } catch (error) {
        console.log("ERROR" + error);
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

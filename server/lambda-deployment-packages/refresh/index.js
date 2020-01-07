"use static";
const queryString = require("querystring");
const axios = require("axios");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();
const client_id = "ff19e2ea3546447e916e43dcda51a298";
const client_secret = process.env.CLIENT_SECRET;


exports.handler = async (event, context, callback) => {
    console.log("POST /refresh");
    console.log(event);
    const req = queryString.parse(event.body);
    console.log(req);
    const url = "https://accounts.spotify.com/api/token";
    const body = {
        grant_type: "refresh_token",
        refresh_token: req.refresh_token,
        redirect_uri: "juke://spotify-login-callback"
    };
    const config = {
        headers: {
            "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
        }
    };

    try {
        let response = await axios.post(url, queryString.stringify(body), config);
        console.log(response.data);
        let res = {
            statusCode: 200,
            body: JSON.stringify(response.data)
        };

        // UPDATE device item
        dynamo.updateItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            UpdateExpression: "set access_token = :a spotify_user_id = :s",
            ExpressionAttributeValues: {
                ":a": {"S": response.data.access_token},
                ":s": {"S"}: spotify_id
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
            } else {
                console.log("UPDATED ITEM: " + data);
            }
        });
        console.log(res);
        return res;

    } catch (error) {
        console.log(error);
        const res = {
            statusCode: 500,
            body: JSON.stringify(error)
        };
        return res;
    }
};

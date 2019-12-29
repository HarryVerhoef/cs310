"use static";
const queryString = require("querystring");
const axios = require("axios");
const doc = require("dynamo-doc");
const dynamo = doc.DynamoDB();
const client_id = "ff19e2ea3546447e916e43dcda51a298";
const client_secret = process.env.CLIENT_SECRET;


exports.handler = async (event, context, callback) => {
    console.log("POST /get_playlist");
    console.log("CLIENT_SECRET: " + client_secret);
    console.log(event);
    const req = queryString.parse(event.body);

    var spotify_user_object;
    var res;

    // GET USER ID FROM ACCESS_TOKEN
    try {
        let response = await axios({
            method: "get",
            url: "https://api.spotify.com/v1/me",
            headers: {
                "Authorization": "Bearer " + req.access_token
            }
        });
        spotify_user_object = response;
        res = {
            statusCode: 200,
            body: JSON.stringify(response.data.items)
        }
    } catch (error) {
        res = {
            statusCode: 500,
            body: JSON.stringify({
                data: error
            })
        }
        return res;
    }

    // UPDATE ITEM IN DynamoDB
    dynamo.updateItem({
        TableName: "device",
        Key: {
            "device_id": req.uid
        },
        UpdateExpression: "set access_token = :a spotify_user_id = :s",
        ExpressionAttributeValues: {
            ":a": {"S": req.access_token},
            ":s": {"S": spotify_user_object.id}
        },
        ReturnValues: "UPDATED_NEW",
    }, (err, data) => {
        if (err) {
            res = {
                statusCode: 500,
                body: JSON.stringify({
                    data: data
                })
            }
            return res;
        } else {
            console.log("UPDATED ITEM: " + data);
        }
    });

    return res;
};

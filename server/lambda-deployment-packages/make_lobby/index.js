"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();
const crypto = require("crypto");

exports.handler = async (event, context, callback) => {
    const req = queryString.parse(event.body);
    var res;
    console.log(req);

    /*
    ** 1. Generate lobby key
    ** 2. Put lobby item in to lobby table
    ** 3. Update device item with new lobby key
    ** 4. Return res
    */

    /* (1) Generate lobby key */

    const roomKey = crypto.randomBytes(2).toString("hex").toUpperCase();

    /* (2) Put item in to DynamoDB */

    try {
        await dynamo.putItem({
        TableName: "lobby",
        Item: {
            "lobby_key": {"S": roomKey},
            "lobby_name": {"S": req.name},
            "playlist_id": {"S": req.playlist_id},
            "chat": {"BOOL": (req.chat == "true")},
            "lyrics": {"BOOL": (req.lyrics == "true")},
            "volume": {"BOOL": (req.volume == "true")},
            "lobby_length": {"N": "0"},
            "num_users": {"N": "1"},
            "thumbs_map": {"M": {}},
            "net_thumbs": {"N": "0"},
            "lobby_weighted_track_rankings": {"M": {}},
            "voted_users": {"L": []}
            }
        }, (err, data) => {
            if (err) {
                console.log(err);
                res = {
                    statusCode: 500,
                    body: JSON.stringify({
                        data: err
                    })
                };
                console.log(res);
                return res;
            } else {
                console.log("PUT ITEM: " + data);
            }
        }).promise();

        /* (3) Update device item with new lobby key */

        await dynamo.updateItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            UpdateExpression: "set lobby_key = :l",
            ExpressionAttributeValues: {
                ":l": {"S": roomKey}
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
        }).promise();

    } catch (error) {
        res = {
            statusCode: 500,
            body: JSON.stringify(error)
        }
        return res;
    }

    res = {
        statusCode: 200,
        body: JSON.stringify({
            key: roomKey,
            name: req.name,
            playlist_id: req.playlist_id,
            chat: req.chat,
            lyrics: req.lyrics,
            volume: req.volume
        })
    };

    console.log(res);
    return res;
};

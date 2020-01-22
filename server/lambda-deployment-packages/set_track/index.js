"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
    const req = queryString.parse(event.body);
    var res;

    console.log(req);

    /*
    ** 1. Get lobby_key from uid
    ** 2. Create track map
    ** 3. Set active_track to track map in lobby item
    ** 4. Return success status
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

        /* (2) Create track map */

        let track_dynamo = {
            id: {"S": req.track_id},
            name: {"S": req.name},
            image_url: {"S": req.uri},
            artists: {"S": req.artists},
            length: {"N": req.duration_ms},
            time_invoked: {"N": req.time}
        };

        console.log(JSON.stringify(track_dynamo));

        /* (3) Set active_track to track map in lobby item */

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

        let update_lobby = update_lobby_res.Attributes;

        /* (4) Return success status */

        res = {
            statusCode: 200,
            body: JSON.stringify(update_lobby)
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

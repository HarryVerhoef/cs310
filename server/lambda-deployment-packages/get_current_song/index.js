"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
    const req = queryString.parse(event.body);
    var res;

    /*
    ** 1. Get lobby_key from device table
    ** 2. Get track map from lobby table
    ** 3. return stringified track map
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

        /* (2) Get track map from lobby table */

        let track_map_res = await dynamo.getItem({
            TableName: "lobby",
            Key: {
                "lobby_key": {"S": lobby_key}
            },
            AttributesToGet: ["track"]
        }).promise();

        let track_map = track_map_res.Item.track.M;

        /* (3) Return stringified track map */

        res = {
            statusCode: 200,
            body: JSON.stringify(track_map)
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

"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();


exports.handler = async (event) => {
    const req = queryString.parse(event.body);
    var res;

    /*
    ** 1. Get lobby_key from device table
    ** 2. Remove item corresponding to lobby_key in lobby table
    ** 3. Remove items corresponding to lobby_key in lobby-track
    ** 4. Return success status
    */

    /* (1) Get lobby_key from device table */

    try {
        //

        let lobby_key_res = await dynamo.getItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            AttributesToGet: ["lobby_key"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;

        let old_lobby_res = await dynamo.deleteItem({
            TableName: "lobby",
            Key: {
                "lobby_key": {"S": lobby_key}
            },
            ReturnValues: "ALL_OLD"
        }).promise();

        let old_lobby = old_lobby_res;

        /* (3) Remove items corresponding to lobby_key in lobby-track */

        let old_lobby_track_res = await dynamo.deleteItem({
            TableName: "lobby-track",
            Key: {
                "lobby_key": {"S": lobby_key}
            },
            ReturnValues: "ALL_OLD"
        }).promise();

        res = {
            statusCode: 200,
            body: JSON.stringify(old_lobby)
        };

        console.log(res);
        return res;

    } catch(error) {

        res = {
            statusCode: 500,
            body: JSON.stringify(error)
        };

        console.log(res);
        return res;
    }
};

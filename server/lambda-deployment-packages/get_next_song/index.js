"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
    const req = queryString.parse(event.body);
    var res;

    /*
    ** 1. Get lobby_key from device table
    ** 2. Get lobby-wide votes object
    ** 3. Return stringified votes object
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

        /* (2) Get lobby-wide votes object */

        let vote_array_res = await dynamo.query({
            TableName: "lobby-track",
            ProjectionExpression: "track_id, vote_no",
            KeyConditionExpression: "lobby_key = :lk",
            ExpressionAttributeValues: {
                ":lk": {"S": lobby_key}
            }
        }).promise();

        let vote_array = vote_array_res.Items;

        /* (4) Remove lobby-track items from this lobby */

        let old_lobby_track_res = await dynamo.deleteItem({
            TableName: "lobby-track",
            Key: {
                "lobby_key": {"S": lobby_key}
            },
            ReturnValues: "ALL_OLD"
        }).promise();

        /* (3) Return stringified votes object */

        res = {
            statusCode: 200,
            body: JSON.stringify(vote_array)
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

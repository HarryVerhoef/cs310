"use static";
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event, context, callback) => {
    console.log(event);
    var res;


    try {

        /* (1) Get lobby_key from device table */
        let lobby_key_res = await dynamo.getItem({
            TableName: "device",
            Key: {
                "device_id": {"S": event.queryStringParameters.uid}
            },
            AttributesToGet: ["lobby_key"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;

        /* (2) Update lobby-connection table with (lobby_key, connection_id) key */

        const putParams = {
            TableName: "lobby-connection",
            Item: {
                "lobby_key": {"S": lobby_key},
                "connection_id": {"S": event.requestContext.connectionId}
            }
        };

        await dynamo.putItem(putParams).promise();

        res = {
            statusCode: 200,
            body: JSON.stringify("Connected!")
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

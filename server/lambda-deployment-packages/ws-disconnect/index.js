"use static";
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {

    console.log(event);
    var res;

    /*
    ** 1. Scan to obtain item with same connection_id
    ** 2. Remove said item
    ** 3. Return success status
    */

    try {

        /* (1) Scan to obtain item with same connection_id */

        let lobby_connection_res = await dynamo.scan({
            TableName: "lobby-connection",
            FilterExpression: "connection_id = :c",
            ExpressionAttributeValues: {
                ":c": {"S": event.requestContext.connectionId}
            },
            ProjectionExpression: "lobby_key, connection_id"
        }).promise();

        /* (2) Remove said item */

        await dynamo.deleteItem({
            TableName: "lobby-connection",
            Key: {
                "lobby_key": {"S": lobby_connection_res.Items[0].lobby_key},
                "connection_id": {"S": lobby_connection_res.Items[0].connection_id}
            }
        }).promise();

        /* (3) Return success status */

        res = {
            statusCode: 200,
            body: JSON.stringify("Disconnected"),
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

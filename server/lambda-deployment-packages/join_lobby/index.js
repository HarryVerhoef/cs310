"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
    const req = queryString.parse(event.body);
    console.log(req);
    var res;

    /*
    ** 1. Check if lobby exists
    ** 2. Add new item to device table
    */


    try {

        /* (1) Check if lobby exists */

        var lobby_res = await dynamo.getItem({
            TableName: "lobby",
            Key: {
                "lobby_key": {"S": event.lobby_key}
            }
        }).promise();

        if (lobby_res.Item) {
            console.log("Lobby exists: " + lobby_res.Item);

            /* (2) Add new item to device table */

            var new_device_res = await dynamo.putItem({
                TableName: "device",
                Item: {
                    "device_id": {"S": req.uid},
                    "lobby_key": {"S": req.lobby_key}
                },
                ReturnValues: "ALL_NEW"
            }).promise();

            res = {
                statusCode: 200,
                body: JSON.stringify({
                    lobby_key: new_device_res.Attributes.lobby_key
                })
            };

            console.log(res);
            return res;

        } else {
            res = {
                statusCode: 500,
                body: JSON.stringify("Lobby doesn't exist")
            };

            console.log(res);
            return res;
        }


    } catch (error) {

        res = {
            statusCode: 500,
            body: error
        };

        console.log(res);
        return res;

    }
}

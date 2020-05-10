"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

// WebSocket Function

exports.handler = async (event) => {
    console.log(event);
    const req = JSON.parse(event.body);
    var res;
    console.log(req);

    var apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: "2018-11-29",
        endpoint: event.requestContext.domainName + "/" + event.requestContext.stage,
        signatureVersion: "v4"
    });


    /*
    ** 1. Get lobby_key from uid
    ** 2. Get list of users
    ** 3. Send active song to list of users with next flag
    */

    try {

        /* (1) Get lobby key from uid */

        let lobby_key_res = await dynamo.getItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            AttributesToGet: ["lobby_key"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;

        /* (4) Get connection_ids of users in lobby */

        let connected_users_res = await dynamo.query({
            TableName: "lobby-connection",
            ProjectionExpression: "connection_id",
            KeyConditionExpression: "lobby_key = :lk",
            ExpressionAttributeValues: {
                ":lk": {"S": lobby_key}
            }
        }).promise();

        let connected_users = connected_users_res.Items;

        console.log(connected_users);

        const postCalls = connected_users.map(async (item) => {
            try {
                await apigwManagementApi.postToConnection({
                    ConnectionId: item.connection_id.S,
                    Data: JSON.stringify({
                        action: "next",
                        body: req.track
                    })
                }).promise();
            } catch (e) {
                if (e.statusCode === 410) {
                    console.log(`Found stale connection, deleting ${item.connection_id.S}`);
                    await dynamo.deleteItem({
                        TableName: "lobby-connection",
                        Key: {
                            "lobby_key": {"S": lobby_key},
                            "connection_id": {"S": item.conneciton_id.S}
                        }
                    }).promise();
                } else {
                    throw e;
                }
            }
        });

        await Promise.all(postCalls);

        res = {
            statusCode: 200,
            body: JSON.stringify(req.track)
        };

        console.log(res)
        return res;

    } catch (error) {
        console.log(error);

        res = {
            statusCode: 500,
            body: error
        };
        console.log(res);

        return res;
    }


};

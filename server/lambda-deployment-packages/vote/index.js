"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

// WebSocket Function

exports.handler = async (event, context, callback) => {
    const req = JSON.parse(event.body);
    console.log(req);
    var res;

    var apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: "2018-11-29",
        endpoint: event.requestContext.domainName + "/" + event.requestContext.stage,
        signatureVersion: "v4"
    });

    console.log(apigwManagementApi.endpoint);



    // console.log(event);

    /*
    ** 1. Get lobby key from device table
    ** 2. Update lobby-track item with vote
    ** 3. Create lobby-wide vote object
    ** 4. Get connection_ids of users in lobby
    ** 5. Send the current state of votes to all connected users
    **
    */

    /*
    ** Return vote object format:
    ** {
    ** . track_id: <num_votes>,
    **   ...
    ** }
    */
    try {

        /* (1) Get lobby key from device table */
        let lobby_key_res = await dynamo.getItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            AttributesToGet: ["lobby_key"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;

        /* (2) Update lobby-track item with vote */

        let vote_no_res = await dynamo.updateItem({
            TableName: "lobby-track",
            Key: {
                "lobby_key": {"S": lobby_key},
                "track_id": {"S": req.track_id}
            },
            UpdateExpression: "ADD vote_no :i",
            ExpressionAttributeValues: {
                ":i": {"N": "1"}
            },
            ReturnValues: "UPDATED_NEW"
        }).promise();

        let vote_no = vote_no_res.Attributes.vote_no.N;

        console.log("vote_no: " + vote_no);

        /* (3) Create lobby-wide vote object */
        let vote_array_res = await dynamo.query({
            TableName: "lobby-track",
            ProjectionExpression: "track_id, vote_no",
            KeyConditionExpression: "lobby_key = :lk",
            ExpressionAttributeValues: {
                ":lk": {"S": lobby_key}
            }
        }).promise();

        let vote_array = vote_array_res.Items;

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
                await apigwManagementApi.postToConnection({ ConnectionId: item.connection_id.S, Data: JSON.stringify(vote_array) }).promise();
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
            body: JSON.stringify(vote_array)
        };

        console.log("RES: " + JSON.stringify(res));
        return res;

    } catch(error) {

        console.log(error);
        res = {
            statusCode: 500,
            body: error
        };

        console.log(res);

        return res;
    }
};

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
            AttributesToGet: ["lobby_key", "user_weighting", "user_vote"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;
        let user_weighting = lobby_key_res.Item.user_weighting.N;
        let old_user_vote = lobby_key_res.Item.user_vote;

        /* (2) Update lobby-track item with vote numbers */

        if (old_user_vote) {

            // Remove old vote from lobby_track

            await dynamo.updateItem({
                TableName: "lobby-track",
                Key: {
                    "lobby_key": {"S": lobby_key},
                    "track_id": {"S": old_user_vote.S}
                },
                UpdateExpression: "DELETE voted_users :e",
                ExpressionAttributeValues: {
                    ":e": {"SS": [req.uid]},
                },
                ReturnValues: "UPDATED_NEW"
            }).promise();

            await dynamo.updateItem({
                TableName: "lobby-track",
                Key: {
                    "lobby_key": {"S": lobby_key},
                    "track_id": {"S": old_user_vote.S}
                },
                UpdateExpression: "ADD vote_no :v",
                ExpressionAttributeValues: {
                    ":v": {"N": (-user_weighting).toString()}
                },
                ReturnValues: "UPDATED_NEW"
            }).promise();

        }

        let user_list_res = await dynamo.updateItem({
            TableName: "lobby-track",
            Key: {
                "lobby_key": {"S": lobby_key},
                "track_id": {"S": req.track_id}
            },
            UpdateExpression: "ADD voted_users :e, vote_no :v",
            ExpressionAttributeValues: {
                ":e": {"SS": [req.uid]},
                ":v": {"N": user_weighting.toString()}
            },
            ReturnValues: "UPDATED_NEW"
        }).promise();

        await dynamo.updateItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            UpdateExpression: "SET user_vote = :v",
            ExpressionAttributeValues: {
                ":v": {"S": req.track_id}
            }
        }).promise();

        let vote_no = user_list_res.Attributes.voted_users.SS.length;

        let vote_number = user_list_res.Attributes.vote_no.N;

        console.log("vote_no: " + vote_no);

        console.log(vote_number);

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

        console.log(vote_array);

        /* (4) Get connection_ids of users in lobby */

        let connected_users_res = await dynamo.query({
            TableName: "lobby-connection",
            ProjectionExpression: "connection_id, device_id",
            KeyConditionExpression: "lobby_key = :lk",
            ExpressionAttributeValues: {
                ":lk": {"S": lobby_key}
            }
        }).promise();

        let connected_users = connected_users_res.Items;

        console.log(connected_users);

        const postCalls = connected_users.map(async (item) => {
            try {
                console.log(item);
                if (item.device_id.S != req.uid) {
                    await apigwManagementApi.postToConnection({
                        ConnectionId: item.connection_id.S,
                        Data: JSON.stringify({
                            action: "vote",
                            body: vote_array
                        })
                    }).promise();
                }

            } catch (e) {
                if (e.statusCode === 410) {
                    // HTTP ERROR 410: Gone Client
                    // Delete connection
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

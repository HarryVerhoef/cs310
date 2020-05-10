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
    ** 3. Get current votes
    ** 4. Return stringified response object
    */


    try {

        /* (1) Check if lobby exists */

        var lobby_res = await dynamo.getItem({
            TableName: "lobby",
            Key: {
                "lobby_key": {"S": req.lobby_key}
            }
        }).promise();

        let lobby = lobby_res.Item;
        console.log(lobby);

        if (lobby) {
            console.log("Lobby exists: " + JSON.stringify(lobby));

            /* (2) Add new item to device table */

            var new_device_res = await dynamo.putItem({
                TableName: "device",
                Item: {
                    "device_id": {"S": req.uid},
                    "lobby_key": {"S": lobby.lobby_key.S},
                    "user_weighting": {"N": "1"}
                },
                ReturnValues: "NONE"
            }).promise();

            /* (4) Get current votes */

            let vote_array_res = await dynamo.query({
                TableName: "lobby-track",
                ProjectionExpression: "track_id, vote_no",
                KeyConditionExpression: "lobby_key = :lk",
                ExpressionAttributeValues: {
                    ":lk": {"S": lobby.lobby_key.S}
                }
            }).promise();

            let vote_array = vote_array_res.Items;

            /* (5) Update number of users in lobby */

            await dynamo.updateItem({
                TableName: "lobby",
                Key: {
                    lobby_key: {"S": lobby.lobby_key.S}
                },
                UpdateExpression: "ADD num_users :v",
                ExpressionAttributeValues: {
                    ":v": {"N": "1"}
                }
            }).promise();

            /* (5) Return stringified response  */

            res = {
                statusCode: 200,
                body: JSON.stringify({
                    lobby_key: lobby.lobby_key.S,
                    lobby_name: lobby.lobby_name.S,
                    active_song: lobby.active_track.M,
                    votes: vote_array
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
};

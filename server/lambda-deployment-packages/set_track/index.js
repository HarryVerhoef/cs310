"use static";
const queryString = require("querystring");
const axios = require("axios");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
    const req = queryString.parse(event.body);
    var res;

    console.log(req);

    /*
    ** 1. Get lobby_key from uid
    ** 2. Create track map
    ** 3. Set active_track to track map in lobby item
    ** 4. Return success status
    */

    try {

        /* (1) Get lobby_key from uid */

        let lobby_key_res = await dynamo.getItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            AttributesToGet: ["lobby_key"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;

        /* (2) Get current track up/down vote info */

        let up_down_res = await dynamo.getItem({
            TableName: "lobby",
            Key: {
                "lobby_key": {"S": lobby_key}
            },
            AttributesToGet: ["net_thumbs", "num_users", "thumbs_map", "active_track"]
        }).promise();

        let weight_adjustment = up_down_res.Item.net_thumbs.N / up_down_res.Item.num_users.N;

        console.log(weight_adjustment);

        if (weight_adjustment != 0) {
            let voted_users_res = await dynamo.getItem({
                TableName: "lobby-track",
                Key: {
                    "lobby_key": {"S": lobby_key},
                    "track_id": {"S": req.track_id}
                },
                AttributesToGet: ["voted_users"]
            }).promise();

            let voted_users_current = voted_users_res.Item.voted_users.SS;

            console.log(voted_users_current);

            /* (3) Calculate weighted ranking for current track */



            /* (4) Apply weight adjustment to all users who voted for current track */

            for (var device_id in voted_users_current) {
                await dynamo.updateItem({
                    TableName: "device",
                    Key: {
                        device_id: {"S": device_id}
                    },
                    UpdateExpression: "ADD user_weighting :w",
                    ExpressionAttributeValues: {
                        ":w": {"N": weight_adjustment.toString()}
                    },
                    ReturnValues: "ALL_NEW"
                }).promise();
            }

            let vote_array_res = await dynamo.query({
                TableName: "lobby-track",
                ProjectionExpression: "track_id",
                KeyConditionExpression: "lobby_key = :lk",
                ExpressionAttributeValues: {
                    ":lk": {"S": lobby_key}
                }
            }).promise();

            let vote_array = vote_array_res.Items;

            var deleteRequests = [];
            vote_array.forEach((item) => {
                deleteRequests.push({
                    DeleteRequest: {
                        Key: {
                            "lobby_key": {"S": lobby_key},
                            "track_id": {"S": item.track_id.S}
                        }
                    }
                });
            });

            console.log(deleteRequests);

            await dynamo.batchWriteItem({
                RequestItems: {
                    "lobby-track": deleteRequests
                }
            }).promise();
        }



        /* (2) Create track map */

        let track_dynamo = {
            id: {"S": req.track_id},
            name: {"S": req.name},
            image_url: {"S": req.uri},
            artists: {"S": req.artists},
            length: {"N": req.duration_ms},
            time_invoked: {"N": req.time}
        };

        console.log(JSON.stringify(track_dynamo));

        /* (6) Get users who voted for the next track */

        // let lobby_track_res = await dynamo.getItem({
        //     TableName: "lobby-track",
        //     Key: {
        //         "lobby_key": {"S": lobby_key},
        //         "track_id": {"S": req.track_id}
        //     },
        //     AttributesToGet: ["user_list"]
        // }).promise();

        // let user_list = (lobby_track_res.Item) ? lobby_track_res.Item.user_list.L : [];



        /* (3) Set active_track to track map in lobby item, and update voted_users */

        let update_lobby_res = await dynamo.updateItem({
            TableName: "lobby",
            Key: {
                lobby_key: {"S": lobby_key}
            },
            UpdateExpression: "set active_track = :t, thumbs_map = :m",
            ExpressionAttributeValues: {
                ":t": {"M": track_dynamo},
                // ":l": {"L": user_list},
                ":m": {"M": {}}
            },
            ReturnValues: "ALL_NEW"
        }).promise();

        let update_lobby = update_lobby_res.Attributes;

        /* (4) Return success status */

        res = {
            statusCode: 200,
            body: JSON.stringify(update_lobby)
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

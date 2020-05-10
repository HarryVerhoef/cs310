"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
    const req = queryString.parse(event.body);
    console.log(req);
    var res;

    /*
    ** 1. Get lobby_key from uid
    ** 2. Update thumbs_map, upvotes and downvotes accordingly
    ** 3. Return upvotes and downvotes
    */

    try {

        /* (1) Get lobby_key and user_weighting from uid */

        let lobby_key_res = await dynamo.getItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            AttributesToGet: ["lobby_key", "user_weighting"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;
        let user_weighting = lobby_key_res.Item.user_weighting.N;

        /* (2) Update thumbs map accordingly */

        var thumb_status = (req.thumb_status == "up" ? 1 : -1);


        /* Get current user thumb status */

        let thumb_status_res = await dynamo.getItem({
            TableName: "lobby",
            Key: {
                "lobby_key": {"S": lobby_key}
            },
            AttributesToGet: ["thumbs_map"]
        }).promise();

        let current_user_thumb_status = parseInt((thumb_status_res.Item.thumbs_map.M[req.uid] || {"N": "0"}).N);


        console.log((thumb_status * user_weighting).toString());



        let thumbs_update_res = await dynamo.updateItem({
            TableName: "lobby",
            Key: {
                "lobby_key": {"S": lobby_key}
            },
            UpdateExpression: "SET thumbs_map.#uid = :v, net_thumbs = net_thumbs + :i",
            ExpressionAttributeNames: {
                "#uid": req.uid
            },
            ExpressionAttributeValues: {
                ":v": {"N": (thumb_status * user_weighting).toString()},
                ":i": {"N": (thumb_status - current_user_thumb_status).toString()}
            },
            ReturnValues: "ALL_NEW"
        }).promise();

        console.log(JSON.stringify(thumbs_update_res.Attributes.thumbs_map.M));

        res = {
            statusCode: 200,
            body: JSON.stringify({
                net_thumbs: thumbs_update_res.Attributes.net_thumbs.N
            })
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

"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

exports.handler = async (event, context, callback) => {
    console.log(event);

    const req = queryString.parse(event.body);
    var res;

    /*
    ** 1. Get lobby_key and user_weighting from uid
    ** 2. Get recommendations list from lobby item
    ** 3. Return recommendations list
    */


    try {

        /* (1) Get lobby_key from uid */

        let lobby_key_res = await dynamo.getItem({
            TableName: "device",
            Key: {
                "device_id": {"S": req.uid}
            },
            AttributesToGet: ["lobby_key", "user_weighting"],
        }).promise();

        let lobby_key = lobby_key_res.Item.lobby_key.S;
        let user_weighting = lobby_key_res.Item.user_weighting.N;

        /* (2) Get recommendations list fromm lobby item */

        let recommendation_list_res = await dynamo.getItem({
            TableName: "lobby",
            Key: {
                "lobby_key": {"S": lobby_key}
            },
            AttributesToGet: ["recommendations"]
        }).promise();

        let recommendations = recommendation_list_res.Item.recommendations;

        /* (3) Return recommendations list */

        res = {
            statusCode: 200,
            body: JSON.stringify({
                recommendations: recommendations,
                user_weighting: user_weighting
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

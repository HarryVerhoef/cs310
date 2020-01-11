"use static";
const queryString = require("querystring");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB();

// WebSocket Function

exports.handler = async (event, context, callback) => {
    const req = JSON.parse(event.body);
    console.log(req);
    var res;

    // console.log(event);

    /*
    ** 1. Get lobby key from device table
    ** 2. Update lobby-track item with vote
    ** 3. Create lobby-wide vote object
    ** 4. return the current state of votes
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

        console.log(lobby_key);

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

        res = {
            statusCode: 200,
            body: JSON.stringify(vote_array)
        };

        console.log(res);

        // callback(null, res);

        return res;

    } catch(error) {
        console.log(error);
        res = {
            statusCode: 500,
            body: error
        };

        console.log(res);
        // callback(null, res);


        return res;
    }
};

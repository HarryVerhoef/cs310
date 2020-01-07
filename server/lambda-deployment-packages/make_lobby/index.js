exports.handler = async (event) => {
    "use static";
    const queryString = require("querystring");
    const AWS = require("aws-sdk");
    const dynamo = new AWS.DynamoDB();
    const crypto = require("crypto");

    const req = queryString.parse(event.body);
    var res;

    /*
    ** 1. Generate lobby key
    ** 2. Put lobby item in to lobby table
    ** 3. Update device item with new lobby key
    ** 4. Return res
    */

    /* (1) Generate lobby key */
    const roomKey = crypto.randomBytes(2).toString("hex");

    /* (2) Put item in to DynamoDB */
    dynamo.putItem({
        TableName: "lobby",
        Item: {
            "lobby_key": {"S": roomKey},
            "playlist_id": {"S": req.playlist_id},
            "chat": {"BOOL": req.chat},
            "lyrics": {"BOOL": req.lyrics},
            "volume": {"BOOL": req.volume}
        }
    }, (err, data) => {
        if (err) {
            res = {
                statusCode: 500,
                body: JSON.stringify({
                    data: err
                })
            };
            console.log(res);
            return res;
        } else {
            console.log("PUT ITEM: " + data);
        }
    });

    /* (3) Update device item with new lobby key */
    dynamo.updateItem({
        TableName: "device",
        Key: {
            "device_id": {"S": req.uid}
        },
        UpdateExpression: "set lobby_key = :l",
        ExpressionAttributeValues: {
            ":l": {"S": roomKey}
        }
    }, (err, data) => {
        if (err) {
            res = {
                statusCode: 500,
                body: JSON.stringify({
                    data: err
                })
            };
            console.log(res);
        } else {
            console.log("UPDATED ITEM: " + data);
        }
    });

    const response = {
        statusCode: 200,
        body: JSON.stringify(roomKey),
    };
    return response;
};

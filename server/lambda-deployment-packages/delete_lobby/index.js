"use static";
const qs = require("query-string");
const AWS = require("aws-sdk");
const dynamo = AWS.DynamoDB();


exports.handler = async (event) => {
    const req = qs.parse(event.body);
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

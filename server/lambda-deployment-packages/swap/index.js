"use static";
const queryString = require("querystring");
const axios = require("axios");

const client_id = "ff19e2ea3546447e916e43dcda51a298";
const client_secret = process.env.CLIENT_SECRET;


exports.handler = async (event, context, callback) => {
    console.log("POST /swap");
    console.log(event);

    const code = queryString.parse(event.body).code;


    /*
    ** 1. Send OAuth request to Spotify API
    ** 2. Return stringified response
    */


    const url = "https://accounts.spotify.com/api/token";
    const body = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "juke://spotify-login-callback"
    };
    const config = {
        headers: {
            "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
        }
    };

    try {

        /* (1) Send OAuth request to Spotify API */

        let response = await axios.post(url, queryString.stringify(body), config);


        /* (2) Return stringified response */

        let res = {
            statusCode: 200,
            body: JSON.stringify(response.data)
        };

        console.log(res);
        return res;

    } catch (error) {

        const res = {
            statusCode: 500,
            body: JSON.stringify(error)
        };

        console.log(res);
        return res;
    }
};

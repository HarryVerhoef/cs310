"use static";
const queryString = require("querystring");
const axios = require("axios");

const client_id = "ff19e2ea3546447e916e43dcda51a298";
const client_secret = process.env.CLIENT_SECRET;


exports.handler = async (event, context, callback) => {
    console.log("POST /swap");
    console.log(event);
    const code = queryString.parse(event.body).code;

    const url = "https://accounts.spotify.com/api/token";
    const body = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "juke://spotify-login-callback"
    }
    const config = {
        headers: {
            "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
        }
    }

    try {
        let response = await axios.post(url, queryString.stringify(body), config);
        console.log(response.data);
        let res = {
            statusCode: 200,
            body: JSON.stringify(response.data)
        }
        return res;
    } catch (error) {
        console.log(error);
        const res = {
            statusCode: 500,
            body: JSON.stringify(error)
        }
        return res;
    }
};

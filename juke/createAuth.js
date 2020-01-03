const client_id = "ff19e2ea3546447e916e43dcda51a298";
const client_secret = process.env.secret;

console.log("Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"));

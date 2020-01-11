exports.handler = async (event) => {
    console.log(event);

    const res = {
        statusCode: 200,
        body: JSON.stringify("Disconnected"),
    };

    return res;
};

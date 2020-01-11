exports.handler = async (event) => {

    console.log(event);

    const res = {
        statusCode: 500,
        body: JSON.stringify("Default route")
    };

    return res;
};

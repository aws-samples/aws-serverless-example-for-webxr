exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Automatically confirm the user
    event.response.autoConfirmUser = true;

    // Return to Amazon Cognito
    return event;
};
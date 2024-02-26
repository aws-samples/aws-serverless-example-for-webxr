const amplifyConfig = {
  Auth: {
    // REQUIRED - Amazon Cognito Identity Pool ID
    identityPoolId: 'REPLACE_WITH_YOUR_IDENTITY_POOL_ID',
    
    // REQUIRED - Amazon Cognito Region
    region: 'US-EAST-1',
    
    // REQUIRED- Amazon Cognito User Pool ID
    userPoolId: 'REPLACE_WITH_YOUR_USER_POOL_ID',

    userPoolWebClientId: 'REPLACE_WITH_USER_POOL_WEB_CLIENT_ID',

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: true,
  },
  Api: {
    url: 'REPLACE_WITH_YOUR_API_GATEWAY_URL'
  }
};

export default amplifyConfig;
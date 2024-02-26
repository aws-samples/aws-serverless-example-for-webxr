import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
export declare class CognitoStack extends cdk.NestedStack {
    id: string;
    identityPool: cognito.CfnIdentityPool;
    userPool: cognito.UserPool;
    userPoolClient: cognito.UserPoolClient;
    authRole: cdk.aws_iam.Role;
    constructor(scope: Construct, id: string, userPasswordAuth: boolean, userSRPAuth: boolean, cognitoIdentityProviders?: cognito.UserPoolClientIdentityProvider[], samlProviders?: string[], openIdProviders?: string[]);
    CreateUserPool(scope: Construct, id: string, props?: cognito.UserPoolProps): cdk.aws_cognito.UserPool;
    CreateUserPoolClient(id: string, userPool: cognito.UserPool, supportedProviders: cognito.UserPoolClientIdentityProvider[], userPasswordBool: boolean, userSrpBool: boolean): cdk.aws_cognito.UserPoolClient;
    CreateIdentityPool(scope: Construct, id: string, allowUnAuthUsers?: boolean, cognitoUserPool?: cognito.UserPool, cognitoUserPoolClient?: cognito.UserPoolClient, samlArns?: string[], openIdArns?: string[]): cdk.aws_cognito.CfnIdentityPool;
    GenerateDefaultRoles(scope: Construct, id: string, identityPool: cognito.CfnIdentityPool): cdk.aws_iam.Role;
    ExportConfig(): {
        Auth: {
            identityPoolId: string;
            region: string;
            userPoolId: string;
            userPoolWebClientId: string;
            mandatorySignIn: boolean;
        };
    };
}

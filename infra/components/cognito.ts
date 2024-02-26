import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda';

export class CognitoStack extends cdk.NestedStack {
    id: string;
    identityPool: cognito.CfnIdentityPool;
    userPool: cognito.UserPool;
    userPoolClient: cognito.UserPoolClient;
    authRole: cdk.aws_iam.Role;
    constructor(scope: Construct, id: string, userPasswordAuth: boolean, userSRPAuth: boolean, cognitoIdentityProviders?: cognito.UserPoolClientIdentityProvider[], samlProviders?: string[], openIdProviders?: string[], ) {
        super(scope, id);
        this.id = id;
        this.userPool = this.CreateUserPool(scope, id)
        this.userPoolClient = this.CreateUserPoolClient(id, this.userPool, cognitoIdentityProviders ? cognitoIdentityProviders : [cognito.UserPoolClientIdentityProvider.COGNITO], userPasswordAuth, userSRPAuth);
        this.identityPool = this.CreateIdentityPool(scope, id, false, this.userPool, this.userPoolClient);
        this.identityPool.samlProviderArns = samlProviders;
        this.identityPool.openIdConnectProviderArns = openIdProviders;
        this.authRole = this.GenerateDefaultRoles(scope, id, this.identityPool);
    }

     CreateUserPool(scope: Construct, id: string, props?: cognito.UserPoolProps) {
        const preSignupLambda = new LambdaStack(scope, "preSignupLambda", cdk.aws_lambda.Runtime.NODEJS_18_X, '../lambdaScripts/preSignup', 'handler', cdk.Duration.minutes(5), 512, 512);
        const preSignupFunction = preSignupLambda.getLambdaFunction();
        console.log("lambda function is" + preSignupFunction);
        const userPool = new cognito.UserPool(scope, id + "_UserPool_test", {
            selfSignUpEnabled: true,
            signInAliases: {
                username: true,
                email: true,
            },
            autoVerify: {
                email: false,
                phone: false
            },
            lambdaTriggers: {
                preSignUp: preSignupFunction
            },
            ...props
        });
        return userPool;
    }

    CreateUserPoolClient(id: string, userPool: cognito.UserPool, supportedProviders: cognito.UserPoolClientIdentityProvider[], userPasswordBool: boolean, userSrpBool: boolean) {
        const userPoolClient = userPool.addClient(id + "_Client", {
            supportedIdentityProviders: supportedProviders ? supportedProviders : [cognito.UserPoolClientIdentityProvider.COGNITO],
            authFlows: {
                userPassword: userPasswordBool ? userPasswordBool : true,
                userSrp: userSrpBool ? userSrpBool : true
            }
        })
        return userPoolClient;
    }

    CreateIdentityPool(scope: Construct, id: string, allowUnAuthUsers: boolean = false, cognitoUserPool?: cognito.UserPool, cognitoUserPoolClient?: cognito.UserPoolClient, samlArns?: string[], openIdArns?: string[]) {
        const identityPool = new cognito.CfnIdentityPool(scope, id + "_IdPool", {
            allowUnauthenticatedIdentities: allowUnAuthUsers,
            cognitoIdentityProviders: cognitoUserPool ? [{ clientId: cognitoUserPoolClient?.userPoolClientId, providerName: cognitoUserPool.userPoolProviderName }] : undefined,
            samlProviderArns: samlArns ? samlArns : undefined,
            openIdConnectProviderArns: openIdArns ? openIdArns : undefined
        })
        return identityPool;
    }

    GenerateDefaultRoles(scope: Construct, id: string, identityPool: cognito.CfnIdentityPool) {
        const unauthenticatedRole = new cdk.aws_iam.Role(scope, id + '_CognitoDefaultUnauthenticatedRole', {
            assumedBy: new cdk.aws_iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
                "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
            }, "sts:AssumeRoleWithWebIdentity"),
        });
        unauthenticatedRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
                "mobileanalytics:PutEvents",
                "cognito-sync:*"
            ],
            resources: ["*"],
        }));
        const authenticatedRole = new cdk.aws_iam.Role(scope, id + '_CognitoDefaultAuthenticatedRole', {
            assumedBy: new cdk.aws_iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
                "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
            }, "sts:AssumeRoleWithWebIdentity"),
        });
        authenticatedRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
                "mobileanalytics:PutEvents",
                "cognito-sync:*",
                "cognito-identity:*"
            ],
            resources: ["*"],
        }));
        const defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(scope, id + '_CognitoRolesAttachment', {
            identityPoolId: identityPool.ref,
            roles: {
                'unauthenticated': unauthenticatedRole.roleArn,
                'authenticated': authenticatedRole.roleArn
            }
        });
        return authenticatedRole;
    }

    ExportConfig() {
        return {
            Auth: {
                // (required) only for Federated Authentication - Amazon Cognito Identity Pool ID
                identityPoolId:this.identityPool.ref,

                // (required)- Amazon Cognito Region
                region:this.region,

                // (optional) - Amazon Cognito User Pool ID
                userPoolId: this.userPool.userPoolId,

                // (optional) - Amazon Cognito Web Client ID (26-char alphanumeric string, App client secret needs to be disabled)
                userPoolWebClientId: this.userPoolClient.userPoolClientId,

                // (optional) - Enforce user authentication prior to accessing AWS resources or not
                mandatorySignIn: true,

            }
        }
    }
}

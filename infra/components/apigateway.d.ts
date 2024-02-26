import * as cdk from 'aws-cdk-lib';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
export declare class restGatewayNestedStack extends cdk.NestedStack {
    gateway: restGateway;
    constructor(scope: Construct, id: string, description?: string, stageName?: string);
}
export declare class restGateway extends apig.RestApi {
    scope: Construct;
    id: String;
    apiGatewayARN: string;
    apiGatewayURL: string;
    knownResources: {
        [key: string]: apig.Resource;
    };
    stageName: string;
    constructor(scope: Construct, id: string, description?: string, stageName?: string);
    addCorsOptions(resource: apig.Resource): void;
    GetAPIGatewayArn(): string;
    AddCognitoAuthorizer(scope: Construct, id: string, UserPools: cognito.UserPool[]): cdk.aws_apigateway.CognitoUserPoolsAuthorizer;
    AddAPIGAuthorizer(scope: Construct, id: string, authFn: lambda.Function): cdk.aws_apigateway.RequestAuthorizer;
    AddResource(FullPath: string): cdk.aws_apigateway.Resource;
    AddMethodIntegration(integration: apig.AwsIntegration, route: string | undefined, methodString: string, auth: apig.Authorizer): boolean;
    AttachWebACL(scope: Construct, id: string): cdk.aws_wafv2.CfnWebACLAssociation;
    GetWebACL(scope: Construct, id: string): cdk.aws_wafv2.CfnWebACL;
    ExportConfig(): {
        API: {
            endpoints: {
                name: string;
                endpoint: string;
                region: string;
            }[];
        };
    };
}

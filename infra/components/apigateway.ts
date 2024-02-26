import * as cdk from 'aws-cdk-lib';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as helpers from './helperScripts';
import { Construct } from 'constructs';

export class restGatewayNestedStack extends cdk.NestedStack {
    gateway: restGateway;
    constructor(scope: Construct, id: string, description?: string, stageName?: string) {
        super(scope, id)
        this.gateway = new restGateway(scope, id + "_G", description, stageName)
    }
}
export class restGateway extends apig.RestApi {
    scope: Construct;
    id: String;
    apiGatewayARN: string
    apiGatewayURL: string
    knownResources: { [key: string]: apig.Resource } = {};
    stageName: string
    constructor(scope: Construct, id: string, description?: string, stageName: string = "dev") {
        const props =
        {
            description: description ? description : 'API Gateway Construct',
            deployOptions: {
                stageName: stageName ? stageName : 'dev',
            },
        };

        super(scope, id, props)
        this.scope = scope;
        this.id = id;
        this.apiGatewayURL = this.url;
        this.stageName = stageName;
        helpers.OutputVariable(scope, 'API Rest URL', this.url, "Restful API Gateway URL");
    }

    addCorsOptions(resource: apig.Resource) {
        resource.addMethod('OPTIONS', new apig.MockIntegration({
            integrationResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,AuthToken'",
                    'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
                    'method.response.header.Access-Control-Allow-Credentials': "'false'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'",
                },
            }],
            passthroughBehavior: apig.PassthroughBehavior.NEVER,
            requestTemplates: {
                "application/json": "{\"statusCode\": 200}"
            },
        }), {
            methodResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                },
            }]
        });
    }

    GetAPIGatewayArn() {
        // return `arn:aws:execute-api:${this.env.region}:${this.env.account}:${this.restApiId}/dev`
        return `arn:aws:apigateway:${this.env.region}::/restapis/${this.restApiId}/stages/${this.stageName}`
    }
    AddCognitoAuthorizer(scope: Construct, id: string, UserPools: cognito.UserPool[]) {
        const auth = new apig.CognitoUserPoolsAuthorizer(scope, id, {
            cognitoUserPools: UserPools
        })
        return auth;
    }
    AddAPIGAuthorizer(scope: Construct, id: string, authFn: lambda.Function) {
        const auth = new apig.RequestAuthorizer(scope, id, {
            handler: authFn,
            identitySources: [apig.IdentitySource.header('Authorization')]
        });
        return auth;
    }
    AddResource(FullPath: string) {
        //Check if there is already a resource.
        if (this.knownResources[FullPath] !== undefined) {
            return this.knownResources[FullPath];
        }
        //Split up the path.
        //check if the base resources already exist, and then return the last one.
        const rootPath = this.root;
        const parts = FullPath.split("/");
        let currentResource = this.knownResources[parts[0]];
        if (this.knownResources[parts[0]] !== undefined) {
            currentResource = this.knownResources[parts[0]];
        }
        else {
            currentResource = rootPath.addResource(parts[0]);
            this.knownResources[parts[0]] = currentResource;
        }
        if (parts.length > 1) {
            for (let i = 1; i < parts.length; i++) {
                let currentPath = parts.slice(0, i).join("/");
                console.log(currentPath);
                try {
                    currentResource = currentResource.addResource(parts[i]);
                    this.knownResources[currentPath] = currentResource;
                }
                catch {
                    currentResource = this.knownResources[currentPath];
                }
            }
        }
        this.addCorsOptions(currentResource);
        return currentResource;
    }

    AddMethodIntegration(integration: apig.AwsIntegration, route: string = "", methodString: string, auth: apig.Authorizer) {
        const resource = this.AddResource(route);
        const method = resource.addMethod(
            methodString,
            integration,
            {
                authorizer: auth,
                authorizationType: auth.authorizationType
            })
        return true;
    }
    AttachWebACL(scope: Construct, id: string) {
        const webACL = this.GetWebACL(scope, id);
        return new cdk.aws_wafv2.CfnWebACLAssociation(
            this,
            this.id + '_CDKWebACLAssoc',
            {
                webAclArn: webACL.attrArn,
                resourceArn: this.GetAPIGatewayArn()
            }
        );
    }
    GetWebACL(scope: Construct, id: string) {
        const wafWebACL = new cdk.aws_wafv2.CfnWebACL(scope, id + "_WebACL",
            {
                description: "BasicWAF",
                defaultAction: {
                    allow: {},
                },
                scope: "REGIONAL",
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: "WAFACLGLOBAL",
                    sampledRequestsEnabled: true
                }
            });
        return wafWebACL
    }
    ExportConfig() {
        return {
            API: {
                endpoints: [
                    {
                        name: this.restApiName,
                        endpoint: this.apiGatewayURL,
                        region: this.env.region
                    },
                ],
            }
        }
    }
}

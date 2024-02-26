import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
export declare class LambdaStack extends cdk.NestedStack {
    lambdaFunction: lambda.Function;
    constructor(scope: Construct, id: string, runTime: lambda.Runtime, codePathString: string, mainFunc: string, timeOut?: cdk.Duration, memory?: number, storage?: number, envs?: {
        [key: string]: string;
    }, layers?: lambda.LayerVersion[]);
    MethodIntegration(): cdk.aws_apigateway.LambdaIntegration;
    getLambdaFunction(): lambda.IFunction;
}
export declare class LambdaFunctionConstruct extends lambda.Function {
    constructor(scope: Construct, id: string, runTime: lambda.Runtime, codePathString: string, mainFunc: string, timeOut?: cdk.Duration, memory?: number, storage?: number, envs?: {
        [key: string]: string;
    }, layers?: lambda.LayerVersion[]);
    MethodIntegration(): cdk.aws_apigateway.LambdaIntegration;
}
export declare class LambdaCustomResource extends LambdaFunctionConstruct {
    crp: cr.Provider;
    lambdaFunction: lambda.Function;
    constructor(scope: Construct, id: string, runTime: lambda.Runtime, codePathString: string, mainFunc: string, timeOut?: cdk.Duration, memory?: number, storage?: number, envs?: {
        [key: string]: string;
    }, bucket?: cdk.aws_s3.Bucket);
    Execute(scope: Construct, id: string, properties: object): cdk.CustomResource;
}
export declare class ConfigGenerator extends LambdaCustomResource {
    bucket: cdk.aws_s3.Bucket;
    constructor(scope: Construct, id: string, Configuration: object, existingBucket?: cdk.aws_s3.Bucket);
}

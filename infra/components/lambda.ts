import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as helpers from './helperScripts';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import path = require('path');
import { Construct } from 'constructs';
import { S3Bucket } from './s3';
import {CognitoStack} from "./cognito";

export class LambdaStack extends cdk.NestedStack {
    lambdaFunction:lambda.Function
    constructor(scope: Construct, id: string, runTime: lambda.Runtime, codePathString: string, mainFunc: string, timeOut?: cdk.Duration, memory: number=128, storage: number=512, envs: { [key: string]: string; }={}, layers: lambda.LayerVersion[]=[]) {
        super(scope,id);
        this.lambdaFunction = new LambdaFunctionConstruct(scope,id+"_FUNC",runTime,codePathString,mainFunc,timeOut,memory,storage,envs,layers)
    }
    MethodIntegration(){
        return new apig.LambdaIntegration(this.lambdaFunction,{proxy:true});
    }
    public getLambdaFunction(): lambda.IFunction {
        return this.lambdaFunction;
    }
}

export class LambdaFunctionConstruct extends lambda.Function {
    constructor(scope: Construct, id: string, runTime: lambda.Runtime, codePathString: string, mainFunc: string, timeOut?: cdk.Duration, memory: number=128, storage: number=512, envs: { [key: string]: string; }={}, layers: lambda.LayerVersion[]=[]) {
        const pathArray = codePathString.split("/");
        const lambdaHandler = pathArray[pathArray.length - 1] + "." + mainFunc
        const props = {
            runtime: runTime,
            handler: lambdaHandler,
            code: lambda.Code.fromAsset(path.join(__dirname, codePathString)),
            timeout: timeOut ? timeOut : cdk.Duration.seconds(3),
            memorySize: memory,
            ephemeralStorageSize: cdk.Size.mebibytes(storage),
            environment: envs,
            layers: layers
        }
        super(scope,id,props);
    }

    MethodIntegration(){
        return new apig.LambdaIntegration(this, { proxy: true })   
    }
}
export class LambdaCustomResource extends LambdaFunctionConstruct{
    crp: cr.Provider
    lambdaFunction: lambda.Function
    constructor(scope: Construct, id: string, runTime: lambda.Runtime, codePathString: string, mainFunc: string, timeOut?: cdk.Duration,memory:number=128,storage:number=512,envs: { [key: string]: string; }={},bucket?:cdk.aws_s3.Bucket) {
        super(scope,id,runTime,codePathString,mainFunc,timeOut,memory,storage,envs)
        this.crp = new cr.Provider(scope, id+"_crp", {
            onEventHandler: this
        });
    }
    Execute(scope: Construct, id: string, properties: object) {
        return new cdk.CustomResource(scope, id, {
            serviceToken: this.crp.serviceToken,
            properties: {
                "Params": properties
            }
        });
    }
}
export class ConfigGenerator extends LambdaCustomResource{
    bucket:cdk.aws_s3.Bucket;
    constructor(scope:Construct,id:string,Configuration:object,existingBucket?:cdk.aws_s3.Bucket){
        const configBucket=existingBucket?existingBucket:new S3Bucket(scope,id+"-ConfigBucket",cdk.RemovalPolicy.DESTROY)
        const envs={
            'BucketName':configBucket.bucketName
        };
        super(scope,id,cdk.aws_lambda.Runtime.PYTHON_3_9,'./component_scripts/configCreator','lambda_handler',undefined,undefined,undefined,envs)
        this.bucket=configBucket;
        this.bucket.grantWrite(this);
        this.Execute(scope,id+"_execute",Configuration);
    }
}

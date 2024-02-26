import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import { S3Bucket } from './s3';
import { restGateway } from './apigateway';
export declare class WebSiteDeployment extends cdk.NestedStack {
    deploymentBucket: cdk.aws_s3.Bucket;
    cloudfrontDistribution: cloudfront.Distribution;
    apiUrl: string;
    region: string;
    constructor(scope: Construct, id: string, folderPath: string, rootObject: string | undefined, apiGateway: restGateway, s3Bucket: S3Bucket);
    CreateCloudFrontDistribution(scope: Construct, id: string, s3Origin: cloudfrontOrigins.S3Origin, filePath: string, webACL: wafv2.CfnWebACL): cdk.aws_cloudfront.Distribution;
    AddDistributionBehavior(path: string, addedOrigin: cloudfrontOrigins.RestApiOrigin | cloudfrontOrigins.S3Origin): void;
    GetResponseHeadersPolicy(scope: Construct, id: string): cdk.aws_cloudfront.ResponseHeadersPolicy;
    GetWebACL(scope: Construct, id: string): cdk.aws_wafv2.CfnWebACL;
}

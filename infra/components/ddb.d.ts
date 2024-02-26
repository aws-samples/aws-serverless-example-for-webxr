import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export declare class DDBTable extends ddb.Table {
    constructor(scope: Construct, id: string, partitionKey: string, sortKey?: string, billingMode?: ddb.BillingMode, removalPolicy?: cdk.RemovalPolicy);
}

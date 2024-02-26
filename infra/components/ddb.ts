import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DDBTable extends ddb.Table{
    constructor(scope:Construct,id:string,partitionKey:string,sortKey?:string,billingMode?:ddb.BillingMode,removalPolicy?:cdk.RemovalPolicy){
        super(scope,id,{
            partitionKey:{
                name:partitionKey,
                type:ddb.AttributeType.STRING
            },
            sortKey:sortKey?{
                name:sortKey,
                type:ddb.AttributeType.STRING
            }:undefined,
            billingMode:billingMode?billingMode:undefined,
            removalPolicy:removalPolicy?removalPolicy:undefined
        })
    }
}
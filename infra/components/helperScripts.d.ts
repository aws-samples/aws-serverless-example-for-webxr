import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export declare function OutputVariable(scope: Construct, _id: string, _value: string | object, _description: string): void;
export declare function cfnParamString(scope: Construct, id: string, dataType?: string, description?: string): cdk.CfnParameter;
export declare class arnPermissions {
    arns: string[];
    permissions: string[];
    constructor(arns: string[], permissions: string[]);
    addArns(arns: string[]): void;
    addPermissions(permissions: string[]): void;
}

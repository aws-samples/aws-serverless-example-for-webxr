import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export function OutputVariable(scope:Construct,_id:string,_value:string|object,_description:string){
    new cdk.CfnOutput(scope,_id,{
        value:JSON.stringify(_value),
        description:_description,
    })
}

export function cfnParamString(scope:Construct,id:string,dataType?:string,description?:string){
    return new cdk.CfnParameter(scope,id,{
        type:dataType||'String',
        default:undefined,
        description:description||"A String should be here"
    })
}
export class arnPermissions {
    arns:string[]=[];
    permissions:string[]=[];
    constructor(arns:string[],permissions:string[]) {
        this.arns=arns;
        this.permissions=permissions;
    }
    addArns(arns:string[]){
        arns.forEach(element => {
            this.arns.push(element)
        });
    }
    addPermissions(permissions:string[]){
        permissions.forEach(element => {
            this.permissions.push(element)
        });
    }
}
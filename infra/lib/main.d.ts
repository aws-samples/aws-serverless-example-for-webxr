import * as cdk from 'aws-cdk-lib';
export declare class MainStack extends cdk.Stack {
    mainStack: Main;
    constructor(app: cdk.App, id: string, props?: cdk.StackProps);
}
export declare class Main {
    constructor(scope: cdk.Stack, contextValues: any);
}

import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
export declare class S3Bucket extends Bucket {
    constructor(scope: Construct, id: string, removalPolicy?: RemovalPolicy, addTLSPolicy?: boolean);
    ExportConfig(): {
        Storage: {
            AWSS3: {
                bucket: string;
            };
        };
    };
    requireTLSAddToResourcePolicy(): void;
}

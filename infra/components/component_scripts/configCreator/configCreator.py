import json
import boto3
import os
import botocore
from helpers import *
s3 = boto3.client('s3')
BucketName=os.environ['BucketName']

def lambda_handler(event,context):
    print(event)
    return customResource("configCreator",event,on_create,on_update,on_delete)
    
def on_create(event):
    s3.put_object(Body=json.dumps(event["Params"]),Bucket=BucketName,Key='config.json')
    return

def on_update(event):
    s3.put_object(Body=json.dumps(event["Params"]),Bucket=BucketName,Key='config.json')
    return

def on_delete(event):
    s3.delete_object(Bucket=BucketName,Key='config.json')
    return
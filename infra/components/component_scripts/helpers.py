from email.mime import base
from inspect import trace
import json
from logging import exception
from urllib import response
import boto3
from boto3.dynamodb.conditions import Key,Attr
import traceback
import os,random,string,time
import re
import base64
import zipfile

ddbr=boto3.resource('dynamodb')
s3=boto3.client('s3')
# Start Utility Calls--------------------------------------------------------------------------------------------------
def genId(length=10):
    kpLength=length
    name=''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(kpLength))
    return name

def create_response_xml(status_code, xml_response):
    response = {
        "statusCode": status_code,
        "headers": {
        'Content-Type': 'text/xml',
        },
        "body": xml_response,
    }
    return response

def customResource(id,event,onCreate,onUpdate,OnDelete):
    try:
        request_type=event['RequestType'].lower()
        properties=event["ResourceProperties"]
        if request_type == 'create':
            body=onCreate(properties)
            return CRResponse(event,id,body,'SUCCESS')
        if request_type == 'update':
            body=onUpdate(properties)
            return CRResponse(event,id,body,'SUCCESS')
        if request_type=='delete':
            body=OnDelete(properties)
            return CRResponse(event,id,body,'SUCCESS')
        else:
            return CRResponse(event,id,body,'FAILED')
    except Exception as e:
        print(e)
        return CRResponse(event,id,{"Exception":str(e)},'SUCCESS')

def CRResponse(event,physicalresourceId,body,status):
    if 'StackId' not in event:
        event['StackId']="Test"
        event['LogicalResourceId']="Test"
        event['RequestId']="Test"
    response={
        "Status":status,
        'PhysicalResourceId' : genId(10),
        'StackId' : event['StackId'],
        'RequestId' : event['RequestId'],
        'LogicalResourceId' : event['LogicalResourceId'],
        'Data' : json.dumps(body)
    }
    return response

def JsonResponse(statusCode,body,mime='application/json'):
    try:
        response= {
        'statusCode': statusCode,
        'headers':{
            'Content-Type':mime,
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET, PUT'
        },
        'body': json.dumps(body)
        }
        return response
    except Exception as e:
        print("Response Error")
        response= {
        'statusCode': 401,
        'headers':{
            'Content-Type':'application/json'
        },
        'body': "Check CloudWatch Logs for Response Error"
        }
        return response

def check_dict(dict1,dict2):
    try:
        missingKeys=[]
        if dict1.keys()==dict2.keys():
            return len(missingKeys),missingKeys
        else:
            for key in dict2.keys():
                if not key in dict1:
                    missingKeys.append(key)
            return len(missingKeys),missingKeys
    except Exception as e:
        print(e)
        raise BaseException("Error in Check_Dict")

def stacktrace():
    # tb=json.dumps(traceback.format_exc())
    tb=json.dumps(traceback.format_stack(),indent=4)
    print(tb)
    return tb

def execute(test):
    try:
        test()
    except Exception as e:
        print(e)
def filterSymbols(_string):
    return re.sub(r'[^\w]','',_string)

def getUsername(lambdaEvent):
    try:
        return lambdaEvent['requestContext']['authorizer']['claims']['cognito:username']
    except Exception as e:
        print(lambdaEvent)
        raise BaseException("Username Error")

def unzipdir(zipLoc,dirLoc):
    with zipfile.ZipFile(zipLoc,'r') as zipObj:
        zipObj.extractall(dirLoc)
def zipdir(dirLoc,zipLoc):
    ziph = zipfile.ZipFile(zipLoc, 'w')
    print("Compressing")
    for root, dirs, files in os.walk(dirLoc+'/'):
        for file in files:
            ziph.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), os.path.join(dirLoc, '')))

# End Utility Calls----------------------------------------------------------------------------------------------------

# Start DynamoDB Calls-------------------------------------------------------------------------------------------------
def get_item(tableName,key):
    #Key is a json object in the form of 
    # {
    #    'one': 'foo',
    #    'two': 'bar'
    #}
    try:
        print("Retrieving from DDB:"+tableName+":"+json.dumps(key))
        table=ddbr.Table(tableName)
        response=table.get_item(
            Key=key
        )
        print(response)
        print("Returning Response from DDB")
        return response['Item']
    except Exception as e:
        print(e)
        raise BaseException("Error in Get Item")

def get_items(tableName,key):
    #Key is a KeyCondition Expression using from boto3.dynamodb.conditions import Key
    try:
        print("Getting multiple items from :"+tableName)
        table=ddbr.Table(tableName)
        response=table.query(KeyConditionExpression=key)
        print("Returning items from:"+tableName)
        return response['Items']
    except Exception as e:
        print(e)
        raise BaseException("Error in Get Items")

def put_data(tableName,item):
    print(tableName)
    print(item)
    #item is a JSON object of what you are putting into the database
    try:
        print("Putting Data in DDB:"+tableName+":"+json.dumps(item))
        table=ddbr.Table(tableName)
        if isinstance(item,dict):
            response=table.put_item(Item=item)
            return True
        if isinstance(item,list):
            for i in item:
                table.put_item(Item=i)
            return True
    except Exception as e:
        print(e)
        raise BaseException("Error in Put Data")
def scan_db(tableName,projectionExpression):
    try:
        print("Scanning "+tableName)
        table=ddbr.Table(tableName)
        response=table.scan(ProjectionExpression=projectionExpression)
        print("Got Scan")
        return response['Items']
    except Exception as e:
        print(e)
        raise BaseException("Error in Scan_DB")

def query(tableName,key,value):
    try:
        print("Querying "+tableName+" for "+key+":"+value)
        table=ddbr.Table(tableName)
        query=table.query(KeyConditionExpression=Key(key).eq(value))['Items']
        print("Got Query")
        return query
    except Exception as e:
        print(e)
        raise BaseException("Error in Query")


def scan(tableName):
    try:    
        table=ddbr.Table(tableName)
        scan=table.scan()['Items']
        return scan
    except Exception as e:
        print(e)
        raise BaseException("Error in Scan")

def delete_items(tableName):
    try:    
        table=ddbr.Table(tableName)
        scan=table.scan()['Items']
        for item in scan:
            table.delete_item(Key=item)
        return response['Items']
    except Exception as e:
        print(e)
        raise BaseException("Error in Delete Items")
def delete_item(tableName,key):
    try:    
        table=ddbr.Table(tableName)
        table.delete_item(Key=key)
        return True
    except Exception as e:
        print(e)
        raise BaseException("Error in Get Item")
def scan_filter(tableName,field,value):
    try:
        print("Scanning "+tableName)
        table=ddbr.Table(tableName)
        response=table.scan(FilterExpression=Attr(field).eq(value))
        print("Got Scan")
        return response['Items']
    except Exception as e:
        print(e)
        raise BaseException("Error in Scan_Filter")
def scan_fe(tableName,filterExpression):
    try:
        print("Scanning "+tableName)
        table=ddbr.Table(tableName)
        response=table.scan(FilterExpression=filterExpression)
        print("Got Scan")
        return response['Items']
    except Exception as e:
        print(e)
        raise BaseException("Error in Scan_Filter")

# End DynamoDB Calls---------------------------------------------------------------------------------------------------


#Start S3 Functions
def getPSURL(bucketName,key,expiration=3600):
    try:
        response=s3.generate_presigned_url('get_object',Params={
            'Bucket':bucketName,
            'Key':key
        },ExpiresIn=expiration)
        return response
    except Exception as e:
        print(e)
        return ""
def putPSURL(bucketName,key,expiration=3600):
    try:
        response=s3.generate_presigned_url('put_object',Params={
            'Bucket':bucketName,
            'Key':key
        },ExpiresIn=expiration)
        return response
    except Exception as e:
        print(e)
        return ""

#End S3 Functions
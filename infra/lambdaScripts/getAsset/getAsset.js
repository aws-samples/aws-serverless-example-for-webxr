import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({});
const bucketName = process.env.BUCKET_NAME;

const getPresignedUrl = async (key, expires) => {
    try {
        let expirationDate = Date.now();
        expirationDate += expires ? expires * 1000 : 900 * 1000; // default is 15 minutes

        expirationDate = new Date(expirationDate);
        const params = {
            Bucket: bucketName,
            Key: key,
            ResponseExpires: expirationDate
        };

        console.log('Parameters:', JSON.stringify(params));
        console.log('Expires In:', expires ? expires : 900);

        const command = new GetObjectCommand(params);
        const signedUrl = await getSignedUrl(client, command, { expiresIn: expires ? expires : 900 });

        console.log('Signed URL:', signedUrl);
        return signedUrl;

    } catch (error) {
        console.error(error);
        throw new Error('Error generating pre-signed URL');
    }
};

const jsonResponse = (statusCode, body) => {
    return {
        'statusCode': statusCode,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            "Access-Control-Allow-Credentials": true,
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        'body': JSON.stringify(body)
    };
};

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const key = event.queryStringParameters.assetKey;
        const expires = event.queryStringParameters.expires;

        if (!key) {
            return jsonResponse(400, { message: "Key parameter is required" });
        }

        const psUrl = await getPresignedUrl(key, expires);
        console.log('ps_url:', psUrl);

        const response = jsonResponse(200, { "ps_url": psUrl });
        console.log('Response:', JSON.stringify(response, null, 2));


        return response;
    } catch (error) {
        console.error(error);
        return jsonResponse(500, { "message": error.toString() });
    }
};
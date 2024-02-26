import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dbClient = new DynamoDBClient({});

const leaderboardTable = process.env.TABLE_NAME;

export const handler = async (event, context) => {
    const body = JSON.parse(event.body);
    try {
        const params = {
            TableName: leaderboardTable,
            Item: {
                playerId: { S: body.playerId },
                score: { N: `${body.score}` },
                status: { N: "1" }
            }
        };
        await dbClient.send(new PutItemCommand(params));
    } catch (err) {
        return JsonResponse(500, "Error storing high score.");
    }

    return JsonResponse(200, "High score stored.");
}

const JsonResponse = (statusCode, body, mime = 'application/json') => {
    let response = {};
    try {
        response = {
            'statusCode': statusCode,
            'headers': {
                'Content-Type': mime,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET, PUT'
            },
            'body': JSON.stringify(body)
        }
        return response;
    } catch (error) {
        console.log(error);
        response = {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': "Check CloudWatch Logs for Response Error"
        }
        return response
    }
}
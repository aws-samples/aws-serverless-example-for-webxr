import { DynamoDBClient, GetItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

const dbClient = new DynamoDBClient({});

const leaderboardTable = process.env.TABLE_NAME;

const getPlayerRecordScore = async (playerId) => {
    try {
        const params = {
            TableName: leaderboardTable,
            Key: {
                playerId: { S: playerId }
            }
        };
        
        let data = await dbClient.send(new GetItemCommand(params));
        data = data.Item;
        if (data == undefined) {
            console.log("No player data found.");
            return 0;
        }

        return parseInt(data.score.N);
    } catch (err) {
        throw err;
    }
}

const getWorldRecordAndRanking = async (playerId) => {
    try {
        const params = {
            TableName: leaderboardTable,
            IndexName: "rankingIndex",
            Limit: 1000,
            KeyConditionExpression: "#status = :v1",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":v1": { N: "1"}
            },
            ScanIndexForward: false
        }

        const data = await dbClient.send(new QueryCommand(params));

        if (data.Items == undefined || data.Items.length == 0 || data.ScannedCount == 0) {
            return {
                ranking: 0,
                worldRecord: 0
            }
        }
        const worldRecord = data.Items[0].score.N;

        const count = data.ScannedCount;
        let ranking = 1;
        let previousScore = worldRecord;
        let rankAccumulator = 0;

        for(let i = 0; i < count; i++){
            if(data.Items[i].score.N != previousScore){
                ranking += rankAccumulator;
                rankAccumulator = 0;
            }
            rankAccumulator++;

            if(data.Items[i].playerId.S == playerId){
                break; 
            }
        }

        return {
            ranking: ranking,
            worldRecord: parseInt(worldRecord)
        }

    } catch (err) {
        throw err;
    }
}

export const handler = async (event, context) => {
    try {
        const playerId = event.pathParameters.playerId.toLowerCase();

        const recordScore = await getPlayerRecordScore(playerId);

        const worldData = await getWorldRecordAndRanking(playerId);

        const response = {
            "recordScore": recordScore,
            "worldRecord": worldData.worldRecord,
            "ranking": worldData.ranking
        };

        return JsonResponse(200, response);
    } catch (err) {
        console.log(err);
        return JsonResponse(500, "Error getting player info.");
    }
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
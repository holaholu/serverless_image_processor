import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.BUCKET_NAME || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*'
};

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Delete the stats file
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'stats/monthly-usage.json'
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Rate limits reset successfully' })
    };
  } catch (error) {
    console.error('Error resetting limits:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to reset limits' })
    };
  }
};

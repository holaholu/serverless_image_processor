import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.BUCKET_NAME || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,DELETE',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Credentials': true
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const filename = event.pathParameters?.filename;

    if (!filename) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Filename is required' })
      };
    }

    // Delete both the original upload and processed version if they exist
    const keys = [
      `uploads/${filename}`,
      `processed/${filename}`
    ];

    for (const key of keys) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
          })
        );
      } catch (error) {
        // Ignore errors if file doesn't exist
        console.log(`Error deleting ${key}:`, error);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Files deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error'
      })
    };
  }
};

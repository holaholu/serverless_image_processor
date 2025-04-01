import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.BUCKET_NAME || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS requests for CORS
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

    // Generate a presigned URL
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `processed/${filename}`
    });
    
    const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

    // Redirect to the presigned URL
    return {
      statusCode: 302,
      headers: {
        ...corsHeaders,
        'Location': presignedUrl
      },
      body: ''
    };
  } catch (error) {
    console.error('Error generating download URL:', error);
    const typedError = error as Error;
    return {
      statusCode: typedError.name === 'NoSuchKey' ? 404 : 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to generate download URL',
        details: typedError.message
      })
    };
  }
};

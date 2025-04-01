import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

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

    // Get the image from S3
    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `processed/${filename}`
      })
    );

    if (!s3Response.Body) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Image not found' })
      };
    }

    // Convert the readable stream to a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of s3Response.Body as Readable) {
      chunks.push(Buffer.from(chunk));
    }
    const imageBuffer = Buffer.concat(chunks);

    // Return the image with appropriate headers
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': s3Response.ContentType || 'image/jpeg',
        'Content-Length': imageBuffer.length.toString()
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error getting image:', error);
    return {
      statusCode: error.name === 'NoSuchKey' ? 404 : 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to get image',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

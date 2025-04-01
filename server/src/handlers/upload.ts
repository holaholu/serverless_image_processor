import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const { v4: uuidv4 } = require('uuid');
import { LIMITS, MB_TO_BYTES, checkRateLimit, checkStorageLimit } from '../utils/limits';

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.BUCKET_NAME || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*'
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No image data provided' }),
      };
    }

    const data = JSON.parse(event.body);
    const { image, fileName, contentType } = data;

    if (!image || !fileName || !contentType) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }


    // Remove header from base64 string if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Check file size
    if (buffer.length > MB_TO_BYTES(LIMITS.MAX_FILE_SIZE_MB)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `File size exceeds ${LIMITS.MAX_FILE_SIZE_MB}MB limit`,
          limit: LIMITS.MAX_FILE_SIZE_MB
        }),
      };
    }

    // Get client IP address
    const ipAddress = event.requestContext.identity.sourceIp;

    // Check rate limit
    const isWithinRateLimit = await checkRateLimit(s3Client, BUCKET_NAME, ipAddress);
    if (!isWithinRateLimit) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Rate limit reached. Maximum ${LIMITS.MAX_UPLOADS_PER_IP} uploads allowed every ${LIMITS.IMAGE_EXPIRY_HOURS} hours.`,
          limit: LIMITS.MAX_UPLOADS_PER_IP,
          timeWindow: LIMITS.IMAGE_EXPIRY_HOURS
        }),
      };
    }

    // Check storage limit
    const isWithinStorageLimit = await checkStorageLimit(s3Client, BUCKET_NAME);
    if (!isWithinStorageLimit) {
      return {
        statusCode: 507,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Storage limit reached. Please try again later.',
          limit: LIMITS.MAX_STORAGE_GB
        }),
      };
    }


    const key = `uploads/${uuidv4()}-${fileName}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ContentEncoding: 'base64',
          ACL: 'public-read'
        })
      );
    } catch (error) {
      console.error('S3 upload error:', error);
      console.error('Bucket:', BUCKET_NAME);
      console.error('Key:', key);
      throw error;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Image uploaded successfully',
        key,
        uploadedFilename: key.split('/').pop()
      }),
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to upload image' }),
    };
  }
};

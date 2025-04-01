import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.BUCKET_NAME || '';

export const handler: APIGatewayProxyHandler = async (event) => {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': true
      },
      body: ''
    };
  }
  try {
    const processedImages = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'processed/',
      })
    );

    const thumbnails = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'thumbnails/',
      })
    );

    const images = processedImages.Contents?.map((obj) => {
      const key = obj.Key || '';
      const thumbnail = thumbnails.Contents?.find(
        (thumb) => thumb.Key === key.replace('processed/', 'thumbnails/')
      );

      return {
        id: key.split('/').pop()?.split('-')[0],
        name: key.split('/').pop(),
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
        thumbnailUrl: thumbnail
          ? `https://${BUCKET_NAME}.s3.amazonaws.com/${thumbnail.Key}`
          : null,
        lastModified: obj.LastModified,
        size: obj.Size,
      };
    }) || [];

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        images: images.sort((a, b) => 
          (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
        ),
      }),
    };
  } catch (error) {
    console.error('Error listing images:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: 'Failed to list images' }),
    };
  }
};

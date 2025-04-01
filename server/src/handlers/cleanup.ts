import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { LIMITS } from '../utils/limits';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME || '';

export const handler = async () => {
  try {
    const now = new Date();
    const expiryTime = new Date(now.getTime() - (LIMITS.IMAGE_EXPIRY_HOURS * 60 * 60 * 1000));

    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'uploads/',
    });

    let isTruncated = true;
    let continuationToken = undefined;
    const objectsToDelete = [];

    while (isTruncated) {
      if (continuationToken) {
        listCommand.input.ContinuationToken = continuationToken;
      }

      const response = await s3Client.send(listCommand);
      
      if (response.Contents) {
        const expiredObjects = response.Contents.filter(obj => {
          return obj.LastModified && obj.LastModified < expiryTime;
        });

        objectsToDelete.push(...expiredObjects.map(obj => ({
          Key: obj.Key as string
        })));
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }

    // Delete expired objects in batches of 1000 (S3 limit)
    if (objectsToDelete.length > 0) {
      for (let i = 0; i < objectsToDelete.length; i += 1000) {
        const batch = objectsToDelete.slice(i, i + 1000);
        await s3Client.send(new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: batch,
            Quiet: true
          }
        }));
      }

      console.log(`Cleaned up ${objectsToDelete.length} expired images`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Cleaned up ${objectsToDelete.length} expired images`,
      }),
    };
  } catch (error) {
    console.error('Error cleaning up expired images:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to clean up expired images',
      }),
    };
  }
};

import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Free tier limits
export const LIMITS = {
  MAX_FILE_SIZE_MB: 20, // Maximum file size in MB
  MAX_FILE_DIMENSION: 2048, // Maximum image dimension
  MAX_UPLOADS_PER_IP: process.env.STAGE === 'prod' ? 5 : Infinity, // Rate limit in production only
  IMAGE_EXPIRY_HOURS: 6, // Images will be deleted after 6 hours
  MAX_STORAGE_GB: process.env.STAGE === 'prod' ? 4.5 : Infinity, // Storage limit in production only
};

// Convert MB to bytes
export const MB_TO_BYTES = (mb: number) => mb * 1024 * 1024;

// Check storage limit
export async function checkStorageLimit(s3Client: S3Client, bucketName: string): Promise<boolean> {
  // Skip check if not in production
  if (process.env.STAGE !== 'prod') return true;

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    let totalSize = 0;
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
      const response = await s3Client.send(command);
      
      if (response.Contents) {
        totalSize += response.Contents.reduce((acc, obj) => acc + (obj.Size || 0), 0);
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;

      if (isTruncated && continuationToken) {
        command.input.ContinuationToken = continuationToken;
      }
    }

    // Convert bytes to GB
    const totalGB = totalSize / (1024 * 1024 * 1024);
    return totalGB < LIMITS.MAX_STORAGE_GB;
  } catch (error) {
    console.error('Error checking storage limit:', error);
    return false;
  }
}

// Rate limiting using S3
interface MonthlyStats {
  [month: string]: {
    ipUploads: {
      [ip: string]: {
        count: number;
        lastUpload: string;
      };
    };
  };
}

export async function checkRateLimit(s3Client: S3Client, bucketName: string, ipAddress: string): Promise<boolean> {
  // Skip check if not in production
  if (process.env.STAGE !== 'prod') return true;

  const now = new Date();
  const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const statsKey = 'stats/monthly-usage.json';

  try {
    // Try to get existing stats
    let monthlyStats: MonthlyStats = {};
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: statsKey,
      }));

      const bodyContents = await response.Body?.transformToString();
      if (bodyContents) {
        monthlyStats = JSON.parse(bodyContents);
      }
    } catch (error: any) {
      // If file doesn't exist, we'll create it
      if (error.name !== 'NoSuchKey') {
        throw error;
      }
    }

    // Initialize month if it doesn't exist
    if (!monthlyStats[month]) {
      monthlyStats[month] = {
        ipUploads: {},
      };
    }

    // Check IP rate limit
    const ipData = monthlyStats[month].ipUploads[ipAddress] || { count: 0, lastUpload: now.toISOString() };
    const lastUploadTime = new Date(ipData.lastUpload);
    const hoursSinceLastUpload = (now.getTime() - lastUploadTime.getTime()) / (1000 * 60 * 60);

    // Reset IP count if time window has passed
    if (hoursSinceLastUpload >= LIMITS.IMAGE_EXPIRY_HOURS) {
      ipData.count = 0;
      ipData.lastUpload = now.toISOString();
    }

    // Check if IP has exceeded limit
    if (ipData.count >= LIMITS.MAX_UPLOADS_PER_IP) {
      return false;
    }

    // Update counts
    monthlyStats[month].ipUploads[ipAddress] = {
      count: ipData.count + 1,
      lastUpload: now.toISOString(),
    };

    // Save updated stats
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: statsKey,
      Body: JSON.stringify(monthlyStats, null, 2),
      ContentType: 'application/json',
    }));

    return true;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false;
  }
}





import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.BUCKET_NAME || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Credentials': true
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
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

    const formData = JSON.parse(event.body);
    const { image, option, fileName } = formData;

    if (!image || !option) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing image or processing option' }),
      };
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    let processedImage;

    // Process the image based on the selected option
    switch (option) {
      case 'resize':
        processedImage = await sharp(imageBuffer)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .toBuffer();
        break;
      case 'grayscale':
        processedImage = await sharp(imageBuffer)
          .grayscale()
          .toBuffer();
        break;
      case 'blur':
        processedImage = await sharp(imageBuffer)
          .blur(3)
          .toBuffer();
        break;
      case 'sharpen':
        processedImage = await sharp(imageBuffer)
          .sharpen()
          .toBuffer();
        break;
      case 'rotate':
        processedImage = await sharp(imageBuffer)
          .rotate(90)
          .toBuffer();
        break;
      case 'sepia':
        processedImage = await sharp(imageBuffer)
          .modulate({ brightness: 1, saturation: 0.7 })
          .tint({ r: 240, g: 200, b: 160 })
          .toBuffer();
        break;
      case 'negative':
        processedImage = await sharp(imageBuffer)
          .negate()
          .toBuffer();
        break;
      case 'tint':
        processedImage = await sharp(imageBuffer)
          .tint({ r: 0, g: 0, b: 255 })
          .toBuffer();
        break;
      case 'saturate':
        processedImage = await sharp(imageBuffer)
          .modulate({ saturation: 2 })
          .toBuffer();
        break;
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid processing option' }),
        };
    }

    // Use the fileName provided by the client
    const processedKey = `processed/${fileName}`;

    // Upload the processed image to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: processedKey,
        Body: processedImage,
        ContentType: 'image/jpeg',
      })
    );

    // Generate a presigned URL for the processed image
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: processedKey,
    });
    const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 }); // URL expires in 1 hour

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Image processed successfully',
        url: presignedUrl,
        name: fileName
      }),
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

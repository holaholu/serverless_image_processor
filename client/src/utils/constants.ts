export const LIMITS = {
  IMAGE_EXPIRY_HOURS: 6, // Images will be deleted after 6 hours
  MAX_FILE_SIZE_MB: 20, // Maximum file size in MB
  MAX_UPLOADS_PER_IP: 5, // Maximum uploads per IP address
  ALLOWED_FILE_TYPES: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif']
  }
};

export interface Limits {
  IMAGE_EXPIRY_HOURS: number;
  MAX_FILE_SIZE_MB: number;
  MAX_UPLOADS_PER_IP: number;
  ALLOWED_FILE_TYPES: {
    [key: string]: string[];
  };
}

export const LIMITS: Limits;

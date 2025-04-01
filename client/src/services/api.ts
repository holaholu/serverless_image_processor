const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is not set');
}

export interface ImageUploadResponse {
  message: string;
  key: string;
  uploadedFilename?: string;
}

export interface ImageUploadError {
  error: string;
  limit?: number;
}

export interface ProcessedImage {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string | null;
  lastModified: string;
  size: number;
}

export interface ImagesResponse {
  images: ProcessedImage[];
}

export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResponse> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: base64Data,
            fileName: file.name,
            contentType: file.type,
          }),
        });

        if (!response.ok) {
          const errorData: ImageUploadError = await response.json();
          
          // Handle specific error cases
          switch (response.status) {
            case 400:
              if (errorData.limit) {
                throw new Error(`File size exceeds ${errorData.limit}MB limit`);
              }
              throw new Error(errorData.error || 'Invalid file');
            case 429:
              throw new Error(`Monthly upload limit reached (${errorData.limit} uploads per month). Please try again next month.`);
            case 507:
              throw new Error(`Storage limit reached (${errorData.limit}GB). Please try again later.`);
            default:
              throw new Error(errorData.error || 'Failed to upload image');
          }
        }

        const data = await response.json();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress((event.loaded / event.total) * 100);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

export const resetLimits = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/reset-limits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reset limits');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Reset limits error:', error);
    throw error;
  }
};

export const getImages = async (): Promise<ProcessedImage[]> => {
  try {
    const response = await fetch(`${API_URL}/images`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }

    const data: ImagesResponse = await response.json();
    return data.images;
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
};

export const deleteImage = async (filename: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/delete/${filename}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete image');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export const processImage = async (file: File, option: string): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const timestamp = Date.now();
        const fileName = `${timestamp}-${option}.jpg`;
        
        const response = await fetch(`${API_URL}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: base64Data,
            option,
            fileName,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to process image');
        }

        const data = await response.json();
        console.log('Process response:', data); // Debug log
        const processedUrl = `${API_URL}/download/${fileName}`;

        resolve({
          id: timestamp.toString(),
          name: fileName,
          url: processedUrl,
          thumbnailUrl: null,
          lastModified: new Date().toISOString(),
          size: file.size,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

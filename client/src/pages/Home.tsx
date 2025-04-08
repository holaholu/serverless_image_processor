import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Heading,
  Text,
  VStack,
  Icon,
  HStack,
  Link,
  IconButton,
  Divider,
  Progress,
  useToast,
  Select,
  Button,
  SimpleGrid
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import { FaGithub, FaLinkedin, FaEnvelope, FaReact, FaAws, FaMagic } from 'react-icons/fa';
import { SiTypescript, SiVite, SiChakraui } from 'react-icons/si';
import { useNavigate } from 'react-router-dom';
import { uploadImage, processImage, deleteImage } from '../services/api';

const MAX_FILE_SIZE_MB = 20;
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif']
};

const PROCESSING_OPTIONS = [
  { value: 'resize', label: 'Reduce Image Size' },
  { value: 'grayscale', label: 'Convert to Grayscale' },
  { value: 'blur', label: 'Apply Blur Effect' },
  { value: 'sharpen', label: 'Sharpen Image' },
  { value: 'rotate', label: 'Rotate Image' },
  { value: 'sepia', label: 'Sepia Effect' },
  { value: 'negative', label: 'Negative Effect' },
  { value: 'tint', label: 'Add Blue Tint' },
  { value: 'saturate', label: 'Increase Saturation' }
];

const Home = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [processingOption, setProcessingOption] = useState('resize');
  const [processedImage, setProcessedImage] = useState<{ url: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`;
    }

    // Check file type
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      return 'Invalid file type. Please upload a JPEG, PNG, or GIF image.';
    }

    return null;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file before upload
    const error = validateFile(file);
    if (error) {
      toast({
        title: 'Invalid file',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      setSelectedFile(file);
      const response = await uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadedFileKey(response.key);

      toast({
        title: 'Image uploaded successfully',
        description: 'Choose a processing option below',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'There was an error uploading your image. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [navigate, toast]);



  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxFiles: 1,
    disabled: isUploading,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  });

  return (
    <VStack
      minH="100vh"
      w="100%"
      color="white"
      spacing={8}
      align="stretch"
    >
        {/* Content */}
          {/* Header */}
          <VStack pt={8} px={4}>
            <Heading as="h1" size="2xl" textAlign="center" color="white" textShadow="2px 2px 4px rgba(0,0,0,0.2)">
              Serverless Image Processor
            </Heading>



            {/* Features Section */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={8} w="full">
              <VStack
                bg="whiteAlpha.200"
                p={6}
                borderRadius="lg"
                spacing={4}
                backdropFilter="blur(8px)"
                borderWidth={1}
                borderColor="whiteAlpha.200"
              >
                <Icon as={FaMagic} boxSize={8} color="blue.300" />
                <Heading size="md" color="whiteAlpha.900">Size Optimization</Heading>
                <Text textAlign="center" color="whiteAlpha.800">
                  Reduce image size while maintaining quality. Perfect for web optimization and faster loading times.
                </Text>
              </VStack>

              <VStack
                bg="whiteAlpha.200"
                p={6}
                borderRadius="lg"
                spacing={4}
                backdropFilter="blur(8px)"
                borderWidth={1}
                borderColor="whiteAlpha.200"
              >
                <Icon as={FaReact} boxSize={8} color="purple.300" />
                <Heading size="md" color="whiteAlpha.900">Artistic Effects</Heading>
                <Text textAlign="center" color="whiteAlpha.800">
                  Apply stunning effects like grayscale, sepia, blur, and negative. Transform your images with just one click.
                </Text>
              </VStack>

              <VStack
                bg="whiteAlpha.200"
                p={6}
                borderRadius="lg"
                spacing={4}
                backdropFilter="blur(8px)"
                borderWidth={1}
                borderColor="whiteAlpha.200"
              >
                <Icon as={FaAws} boxSize={8} color="green.300" />
                <Heading size="md" color="whiteAlpha.900">Cloud Processing</Heading>
                <Text textAlign="center" color="whiteAlpha.800">
                  Leverage AWS Lambda for fast, scalable image processing. Your images are processed securely in the cloud.
                </Text>
              </VStack>
            </SimpleGrid>
          </VStack>

          {/* Upload Box */}
          <Box
            mx="auto"
            maxW="container.md"
            w="full"
            px={4}
            {...getRootProps()}
            borderWidth={2}
            borderRadius="xl"
            borderStyle="dashed"
            borderColor={isDragActive ? 'whiteAlpha.600' : 'whiteAlpha.300'}
            p={12}
            textAlign="center"
            bg={isDragActive ? 'whiteAlpha.200' : 'whiteAlpha.100'}
            _hover={{ bg: 'whiteAlpha.200', borderColor: 'whiteAlpha.600' }}
            transition="all 0.3s ease"
            cursor="pointer"
            shadow="sm"
            backdropFilter="blur(8px)"
          >
            <input {...getInputProps()} />
            <VStack spacing={6}>
              <Icon as={AttachmentIcon} w={12} h={12} color="white" />
              <Text fontSize="xl" fontWeight="medium" color="white">
                {isDragActive
                  ? '✨ Drop your image here...'
                  : 'Drag & drop an image here, or click to select'}
              </Text>
              <Text color="whiteAlpha.900" fontSize="md">
                Supports JPEG, PNG, and GIF up to {MAX_FILE_SIZE_MB}MB
              </Text>
              <Text color="whiteAlpha.900" fontSize="md">
                5 image uploads allowed every six hours
              </Text>
              {isUploading && (
                <Progress
                  width="100%"
                  value={uploadProgress}
                  size="sm"
                  colorScheme="whiteAlpha"
                  rounded="full"
                  isAnimated
                  bg="whiteAlpha.200"
                />
              )}
            </VStack>
          </Box>

          {/* Processing Options */}
          {selectedFile && (
            <Box
              mx="auto"
              maxW="container.md"
              w="full"
              px={4}
              p={6}
              borderWidth={1}
              borderRadius="xl"
              borderColor="whiteAlpha.300"
              bg="whiteAlpha.200"
              backdropFilter="blur(8px)"
            >
              <VStack spacing={4}>
                <HStack width="full" justify="space-between" align="center">
                  <Text fontSize="lg" color="white" fontWeight="medium">
                    Process {selectedFile.name}
                  </Text>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={async () => {
                      try {
                        // Delete both uploaded and processed images if they exist
                        if (processedImage) {
                          await deleteImage(processedImage.name);
                        }
                        if (uploadedFileKey) {
                          const uploadedFileName = uploadedFileKey.split('/').pop();
                          if (uploadedFileName) {
                            await deleteImage(uploadedFileName);
                          }
                        }
                        setSelectedFile(null);
                        setProcessedImage(null);
                        setUploadedFileKey(null);
                        toast({
                          title: 'Images deleted successfully',
                          description: 'You can now upload a new image',
                          status: 'success',
                          duration: 5000,
                          isClosable: true,
                        });
                      } catch (error) {
                        console.error('Delete error:', error);
                        toast({
                          title: 'Delete failed',
                          description: error instanceof Error ? error.message : 'Failed to delete images',
                          status: 'error',
                          duration: 5000,
                          isClosable: true,
                        });
                      }
                    }}
                    leftIcon={<AttachmentIcon />}
                  >
                    Replace Upload
                  </Button>
                </HStack>
                <Select
                  value={processingOption}
                  onChange={(e) => {
                    setProcessingOption(e.target.value);
                    setProcessedImage(null);
                  }}
                  bg="whiteAlpha.200"
                  color="white"
                  borderColor="whiteAlpha.300"
                  _hover={{ borderColor: 'whiteAlpha.400' }}
                  size="lg"
                  fontSize="md"
                  iconColor="white"
                  placeholder="Select processing option"
                >
                  {PROCESSING_OPTIONS.map(option => (
                    <option key={option.value} value={option.value} style={{color: 'black'}}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Button
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  leftIcon={<Icon as={AttachmentIcon} />}
                  isLoading={isProcessing}
                  loadingText="Processing..."
                  onClick={async () => {
                    if (!selectedFile) return;
                    setIsProcessing(true);
                    try {
                      const result = await processImage(selectedFile, processingOption);
                      setProcessedImage({
                        url: result.url,
                        name: result.name
                      });
                      toast({
                        title: 'Image processed successfully',
                        description: 'Your processed image is ready for download',
                        status: 'success',
                        duration: 5000,
                        isClosable: true,
                      });
                    } catch (error) {
                      console.error('Processing error:', error);
                      toast({
                        title: 'Processing failed',
                        description: error instanceof Error ? error.message : 'Failed to process image',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                      });
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                >
                  Process Image
                </Button>
              </VStack>

              {/* Processed Image Display */}
              {processedImage && (
                <Box mt={6} p={4} bg="whiteAlpha.200" borderRadius="lg">
                  <VStack spacing={4}>
                    <img
                      src={processedImage.url}
                      alt="Processed"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <HStack width="full" spacing={4}>
                      <Button
                        as="a"
                        href={processedImage.url}
                        download={processedImage.name}
                        colorScheme="green"
                        size="lg"
                        flex="1"
                        leftIcon={<AttachmentIcon />}
                      >
                        Download Processed Image
                      </Button>
                      <Button
                        colorScheme="red"
                        size="lg"
                        onClick={async () => {
                          try {
                            await deleteImage(processedImage.name);
                            setProcessedImage(null);
                            toast({
                              title: 'Image deleted successfully',
                              status: 'success',
                              duration: 5000,
                              isClosable: true,
                            });
                          } catch (error) {
                            console.error('Delete error:', error);
                            toast({
                              title: 'Delete failed',
                              description: error instanceof Error ? error.message : 'Failed to delete image',
                              status: 'error',
                              duration: 5000,
                              isClosable: true,
                            });
                          }
                        }}
                        leftIcon={<AttachmentIcon />}
                      >
                        Delete Image
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </Box>
          )}



          <Divider my={8} />

          {/* Technologies Section */}
          <VStack spacing={6}>
            <Heading as="h2" size="md" color="whiteAlpha.900" textShadow="1px 1px 2px rgba(0,0,0,0.2)">
              Built with
            </Heading>
            <HStack spacing={8} justify="center">
              <Link href="https://reactjs.org" isExternal>
                <Icon as={FaReact} w={8} h={8} color="white" opacity={0.9} _hover={{ opacity: 1, transform: 'scale(1.1)' }} transition="all 0.2s" />
              </Link>
              <Link href="https://www.typescriptlang.org" isExternal>
                <Icon as={SiTypescript} w={8} h={8} color="white" opacity={0.9} _hover={{ opacity: 1, transform: 'scale(1.1)' }} transition="all 0.2s" />
              </Link>
              <Link href="https://aws.amazon.com" isExternal>
                <Icon as={FaAws} w={8} h={8} color="white" opacity={0.9} _hover={{ opacity: 1, transform: 'scale(1.1)' }} transition="all 0.2s" />
              </Link>
              <Link href="https://vitejs.dev" isExternal>
                <Icon as={SiVite} w={8} h={8} color="white" opacity={0.9} _hover={{ opacity: 1, transform: 'scale(1.1)' }} transition="all 0.2s" />
              </Link>
              <Link href="https://chakra-ui.com" isExternal>
                <Icon as={SiChakraui} w={8} h={8} color="white" opacity={0.9} _hover={{ opacity: 1, transform: 'scale(1.1)' }} transition="all 0.2s" />
              </Link>
            </HStack>
          </VStack>
      {/* Footer */}
      <VStack as="footer" py={8} mt={8} borderTop="1px" borderColor="whiteAlpha.200" spacing={4} px={4}>
          <Heading as="h2" size="sm" color="whiteAlpha.900">
            Connect with Me
          </Heading>
          <HStack spacing={6}>
            <Link href="https://github.com/holaholu" isExternal>
              <IconButton
                aria-label="GitHub"
                icon={<FaGithub />}
                size="lg"
                variant="ghost"
                color="white"
                _hover={{ transform: 'scale(1.1)', bg: 'whiteAlpha.200' }}
                transition="all 0.2s"
              />
            </Link>
            <Link href="mailto:olaoluhimself@yahoo.com" isExternal>
              <IconButton
                aria-label="Contact Me"
                icon={<FaEnvelope />}
                size="lg"
                variant="ghost"
                color="white"
                _hover={{ transform: 'scale(1.1)', bg: 'whiteAlpha.200' }}
                transition="all 0.2s"
                title="Click to send me an email"
              />
            </Link>
          </HStack>
          <Text fontSize="sm" color="whiteAlpha.800">
            © {new Date().getFullYear()} Ola Adisa. All rights reserved.
          </Text>
      </VStack>
    </VStack>
  );
};

export default Home;

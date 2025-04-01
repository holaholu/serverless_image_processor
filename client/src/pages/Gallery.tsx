import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Link,
  Tooltip,
  IconButton,
  Icon,
  Divider,
  SimpleGrid,
  Image,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { FaGithub, FaLinkedin, FaEnvelope, FaReact, FaAws } from 'react-icons/fa';
import { SiTypescript, SiVite, SiChakraui } from 'react-icons/si';
import { useEffect, useState } from 'react';
import { ProcessedImage, getImages } from '../services/api';

const Gallery = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const fetchedImages = await getImages();
        setImages(fetchedImages);
      } catch (error) {
        console.error('Error fetching images:', error);
        toast({
          title: 'Error fetching images',
          description: 'Please try again later',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [toast]);

  return (
    <Box w="100%" minH="100vh" bgGradient="linear(to-b, blue.600, purple.600)" color="white">
      <VStack spacing={8} w="100%" maxW="container.xl" mx="auto" py={8} px={4}>
        <Box textAlign="center">
          <Heading 
            as="h1" 
            mb={4}
            fontSize="5xl"
            bgGradient="linear(to-r, white, whiteAlpha.900)"
            bgClip="text"
            letterSpacing="tight"
          >
            Gallery
          </Heading>
          <Text
            fontSize="xl"
            color="whiteAlpha.900"
            textShadow="0 1px 2px rgba(0,0,0,0.2)"
          >
            Your processed images
          </Text>
        </Box>

        {loading ? (
          <VStack py={12}>
            <Spinner size="xl" />
            <Text>Loading images...</Text>
          </VStack>
        ) : images.length === 0 ? (
          <VStack py={12}>
            <Text fontSize="lg">No images found. Upload some images to get started!</Text>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} w="100%">
            {images.map((image) => (
              <Box
                key={image.id}
                bg="whiteAlpha.100"
                borderRadius="lg"
                overflow="hidden"
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-4px)',
                  shadow: 'lg',
                  bg: 'whiteAlpha.200',
                }}
              >
                <Image
                  src={image.thumbnailUrl || image.url}
                  alt={image.name}
                  w="100%"
                  h="200px"
                  objectFit="cover"
                  loading="lazy"
                />
                <Box p={4}>
                  <Text fontSize="sm" noOfLines={1}>
                    {image.name}
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.700">
                    {new Date(image.lastModified).toLocaleDateString()}
                  </Text>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {/* Footer Content */}
        <VStack spacing={6} pt={16} pb={8}>
          {/* Tech Stack */}
          <Box textAlign="center" width="100%">
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
              Built with
            </Text>
            <HStack spacing={6} justify="center" wrap="wrap">
              {[
                { name: 'React', icon: FaReact, url: 'https://reactjs.org' },
                { name: 'TypeScript', icon: SiTypescript, url: 'https://www.typescriptlang.org' },
                { name: 'Vite', icon: SiVite, url: 'https://vitejs.dev' },
                { name: 'Chakra UI', icon: SiChakraui, url: 'https://chakra-ui.com' },
                { name: 'AWS', icon: FaAws, url: 'https://aws.amazon.com' },
              ].map((tech) => (
                <Tooltip key={tech.name} label={tech.name}>
                  <Link
                    href={tech.url}
                    isExternal
                    _hover={{ color: 'teal.200' }}
                    transition="color 0.2s"
                  >
                    <Icon as={tech.icon} boxSize={6} />
                  </Link>
                </Tooltip>
              ))}
            </HStack>
          </Box>

          <Divider maxW="200px" opacity={0.2} />

          {/* Copyright */}
          <Text fontSize="sm" color="whiteAlpha.800">
            © {new Date().getFullYear()} Ola Adisa. All rights reserved.
          </Text>

          {/* Social Links */}
          <HStack spacing={6} justify="center">
            <Link
              href="https://github.com/holaholu"
              isExternal
              _hover={{ color: 'teal.200' }}
              transition="color 0.2s"
            >
              <Icon as={FaGithub} boxSize={6} />
            </Link>
            <Link
              href="https://www.linkedin.com/in/olaoluadisa/"
              isExternal
              _hover={{ color: 'teal.200' }}
              transition="color 0.2s"
            >
              <Icon as={FaLinkedin} boxSize={6} />
            </Link>
            <IconButton
              aria-label="Contact me"
              icon={<FaEnvelope />}
              variant="ghost"
              size="lg"
              _hover={{ color: 'teal.200', bg: 'transparent' }}
              onClick={() => window.location.href = 'mailto:olaoluhimself@yahoo.com'}
            />
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default Gallery;

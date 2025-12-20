import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  Progress,
  Icon,
  Image,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Badge
} from '@chakra-ui/react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import axios from '../../config/axios.js';
import BrandingLogo from '../shared/BrandingLogo';

const LogoUpload = ({ currentLogo, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(currentLogo || null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only JPEG, PNG, SVG, GIF, and WebP files are allowed',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result);
    };
    reader.readAsDataURL(file);
    
    setFileName(file.name);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast({
        title: 'No file selected',
        description: 'Please select a logo file first',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const formData = new FormData();
    formData.append('logo', fileInputRef.current.files[0]);

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const response = await axios.post('/api/auth/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setIsLoading(false);
      setUploadProgress(0);

      toast({
        title: 'Logo uploaded successfully',
        description: 'Your agency logo has been updated',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFileName('');

      // Call success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      setIsLoading(false);
      setUploadProgress(0);
      
      const errorMessage = error.response?.data?.message || 'Failed to upload logo';
      toast({
        title: 'Upload failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // Create a synthetic event for the file input handler
      const syntheticEvent = {
        target: { files }
      };
      handleFileSelect(syntheticEvent);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Agency Logo
        </Text>
        <Text fontSize="sm" color="gray.600">
          Upload your company logo to display in the navbar and sidebar
        </Text>
      </Box>

      <Divider />

      {/* Current Logo Preview */}
      {currentLogo || previewUrl ? (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={3}>
            Logo Preview:
          </Text>
          <Center
            p={4}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="gray.50"
          >
            <BrandingLogo 
              logoUrl={previewUrl || currentLogo}
              agencyName="Your Agency"
              size="lg"
              showText={false}
            />
          </Center>
        </Box>
      ) : (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <AlertTitle>No logo uploaded yet</AlertTitle>
            <AlertDescription>
              Upload a logo to customize your agency branding
            </AlertDescription>
          </VStack>
        </Alert>
      )}

      {/* Upload Area */}
      <FormControl>
        <FormLabel fontWeight="medium">Select Logo File</FormLabel>
        <Box
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          border="2px dashed"
          borderColor="brand.200"
          borderRadius="md"
          p={8}
          textAlign="center"
          cursor="pointer"
          transition="all 0.3s"
          _hover={{
            borderColor: 'brand.500',
            bg: 'brand.50'
          }}
          bg="gray.50"
          onClick={() => fileInputRef.current?.click()}
        >
          <VStack spacing={2}>
            <Icon
              as={ArrowUpTrayIcon}
              w={10}
              h={10}
              color="brand.500"
            />
            <VStack spacing={0}>
              <Text fontWeight="medium" color="gray.700">
                Drag and drop your logo here
              </Text>
              <Text fontSize="sm" color="gray.500">
                or click to select a file
              </Text>
            </VStack>
          </VStack>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/svg+xml,image/gif,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <FormHelperText>
          Supported formats: JPEG, PNG, SVG, GIF, WebP (max 5MB)
        </FormHelperText>
      </FormControl>

      {/* File Name Display */}
      {fileName && (
        <HStack
          p={3}
          bg="blue.50"
          borderRadius="md"
          border="1px solid"
          borderColor="blue.200"
          spacing={3}
        >
          <Text fontSize="sm" flex={1} noOfLines={1}>
            Selected: <Badge ml={2} colorScheme="blue">{fileName}</Badge>
          </Text>
        </HStack>
      )}

      {/* Upload Progress */}
      {isLoading && uploadProgress > 0 && (
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">
              Uploading...
            </Text>
            <Text fontSize="sm" color="gray.600">
              {uploadProgress}%
            </Text>
          </HStack>
          <Progress value={uploadProgress} colorScheme="brand" borderRadius="md" />
        </Box>
      )}

      {/* Upload Button */}
      <HStack spacing={3} justify="flex-end">
        <Button
          variant="outline"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setFileName('');
            setPreviewUrl(currentLogo || null);
          }}
          isDisabled={!fileName || isLoading}
        >
          Cancel
        </Button>
        <Button
          colorScheme="brand"
          onClick={handleUpload}
          isLoading={isLoading}
          isDisabled={!fileName}
          loadingText="Uploading..."
        >
          Upload Logo
        </Button>
      </HStack>
    </VStack>
  );
};

export default LogoUpload;

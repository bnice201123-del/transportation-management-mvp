import React, { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  VStack,
  Button,
  IconButton,
  useToast,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  HStack,
  Input,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';

const ProfileImageUpload = ({ userId, currentImage, size = 'xl', showEditButton = true, onImageUpdate }) => {
  const { user, fetchUserProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const cancelRef = useRef();

  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Check if current user can edit this profile
  const canEdit = user && (user._id === userId || user.roles?.includes('admin'));

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a JPEG or PNG image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      onPreviewOpen();
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewImage) return;

    setUploading(true);
    try {
      const response = await axios.post(`/api/users/${userId}/profile-image`, {
        profileImage: previewImage
      });

      toast({
        title: 'Success',
        description: 'Profile image updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Update the user profile in context if it's the current user
      if (user._id === userId && fetchUserProfile) {
        await fetchUserProfile();
      }

      // Call the callback if provided
      if (onImageUpdate) {
        onImageUpdate(response.data.profileImage);
      }

      onPreviewClose();
      setPreviewImage(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.message || 'Failed to upload image',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setUploading(true);
    try {
      await axios.delete(`/api/users/${userId}/profile-image`);

      toast({
        title: 'Success',
        description: 'Profile image deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Update the user profile in context if it's the current user
      if (user._id === userId && fetchUserProfile) {
        await fetchUserProfile();
      }

      // Call the callback if provided
      if (onImageUpdate) {
        onImageUpdate(null);
      }

      onDeleteClose();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: error.response?.data?.message || 'Failed to delete image',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const getDisplayName = () => {
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'User';
  };

  return (
    <Box position="relative">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        display="none"
      />

      <VStack spacing={3}>
        <Box position="relative">
          <Avatar
            size={size}
            name={getDisplayName()}
            src={currentImage}
            bg={currentImage ? 'transparent' : 'blue.500'}
            cursor={canEdit && showEditButton ? 'pointer' : 'default'}
            onClick={currentImage ? onPreviewOpen : undefined}
          />
          
          {canEdit && showEditButton && (
            <HStack
              position="absolute"
              bottom="-10px"
              right="-10px"
              spacing={1}
            >
              <Tooltip label="Change Photo" placement="top">
                <IconButton
                  icon={<EditIcon />}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                  onClick={() => fileInputRef.current?.click()}
                  isDisabled={uploading}
                />
              </Tooltip>
              
              {currentImage && (
                <Tooltip label="Delete Photo" placement="top">
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    borderRadius="full"
                    onClick={onDeleteOpen}
                    isDisabled={uploading}
                  />
                </Tooltip>
              )}
            </HStack>
          )}
        </Box>

        {canEdit && showEditButton && !currentImage && (
          <Button
            size="sm"
            leftIcon={<EditIcon />}
            onClick={() => fileInputRef.current?.click()}
            isDisabled={uploading}
            colorScheme="blue"
            variant="outline"
          >
            Upload Photo
          </Button>
        )}
      </VStack>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{previewImage ? 'Preview Image' : 'View Profile Image'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box textAlign="center">
              <Avatar
                size="2xl"
                src={previewImage || currentImage}
                name={getDisplayName()}
                mb={4}
              />
              {previewImage && (
                <Text fontSize="sm" color="gray.600">
                  Preview of your new profile image
                </Text>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            {previewImage ? (
              <>
                <Button variant="ghost" mr={3} onClick={() => {
                  setPreviewImage(null);
                  onPreviewClose();
                }}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleUpload}
                  isLoading={uploading}
                  loadingText="Uploading..."
                >
                  Upload
                </Button>
              </>
            ) : (
              <Button onClick={onPreviewClose}>Close</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Profile Image
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete your profile image? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={uploading}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ProfileImageUpload;

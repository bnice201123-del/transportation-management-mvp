import React from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Text,
  HStack,
  VStack,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FaTrash, FaTimes } from 'react-icons/fa';

const DeleteConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmButtonText = "Delete",
  isLoading = false 
}) => {
  const cancelRef = React.useRef();

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <HStack>
              <FaTrash color="red" />
              <Text>{title}</Text>
            </HStack>
          </AlertDialogHeader>

          <AlertDialogBody>
            <VStack spacing={4} align="start">
              <Alert status="warning">
                <AlertIcon />
                This action cannot be undone.
              </Alert>
              
              <Text>{message}</Text>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              onClick={onClose}
              leftIcon={<FaTimes />}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={onConfirm}
              ml={3}
              isLoading={isLoading}
              loadingText="Deleting..."
              leftIcon={<FaTrash />}
            >
              {confirmButtonText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
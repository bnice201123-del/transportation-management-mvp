import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  HStack,
  Text,
  useColorModeValue,
  Box
} from '@chakra-ui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useSidebar } from '../../contexts/SidebarContext';

const ReturnToDispatchButton = ({ variant = 'solid', size = 'md', showText = true }) => {
  const navigate = useNavigate();
  const { hideSidebar } = useSidebar();
  const buttonBg = useColorModeValue('blue.500', 'blue.600');
  const buttonHoverBg = useColorModeValue('blue.600', 'blue.700');
  const buttonColor = 'white';

  const handleNavigateToDispatcher = () => {
    // Close sidebar
    hideSidebar();
    
    // Navigate to dispatcher landing page
    navigate('/dispatcher');
  };

  return (
    <Button
      display={{ base: "none", md: "flex" }}
      leftIcon={<Box as={ArrowLeftIcon} w={4} h={4} />}
      onClick={handleNavigateToDispatcher}
      colorScheme="blue"
      variant={variant}
      size={size}
      bg={variant === 'solid' ? buttonBg : undefined}
      color={variant === 'solid' ? buttonColor : 'blue.500'}
      _hover={{
        bg: variant === 'solid' ? buttonHoverBg : 'blue.50',
        transform: 'translateX(-2px)',
        shadow: 'md'
      }}
      transition="all 0.2s"
    >
      {showText && (
        <Text display={{ base: 'none', md: 'inline' }}>
          Return to Dispatch Control Center
        </Text>
      )}
      {showText && (
        <Text display={{ base: 'inline', md: 'none' }}>
          Dispatch Center
        </Text>
      )}
    </Button>
  );
};

export default ReturnToDispatchButton;

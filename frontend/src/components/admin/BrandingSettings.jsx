import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  Radio,
  RadioGroup,
  Stack,
  Divider,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Badge,
  Image,
  Icon
} from '@chakra-ui/react';
import { FaLandmark, FaFileAlt } from 'react-icons/fa';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import axios from '../../config/axios';
import BrandingLogo from '../shared/BrandingLogo';
import { useAuth } from '../../contexts/AuthContext';

const BrandingSettings = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [brandingType, setBrandingType] = useState(user?.brandingType || 'TEXT');
  const [hasLogo, setHasLogo] = useState(!!user?.logoUrl);
  const [hasCompanyName, setHasCompanyName] = useState(!!user?.companyName);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  useEffect(() => {
    if (user) {
      setBrandingType(user.brandingType || 'TEXT');
      setHasLogo(!!user.logoUrl);
      setHasCompanyName(!!user.companyName);
    }
  }, [user]);

  const handleBrandingTypeChange = async (value) => {
    setBrandingType(value);
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/update-branding-type', {
        brandingType: value
      });

      // Update both local state and auth context
      if (response.data.user) {
        setUser(response.data.user);
      }

      toast({
        title: 'Branding updated',
        description: `Switched to ${value === 'LOGO' ? 'Logo' : 'Text'} branding`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update branding';
      toast({
        title: 'Update failed',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      // Revert on error
      setBrandingType(user?.brandingType || 'TEXT');
    } finally {
      setLoading(false);
    }
  };

  // Determine current status
  const getStatus = () => {
    if (!hasLogo && !hasCompanyName) {
      return { type: 'none', text: 'No branding configured', color: 'orange' };
    }
    if (brandingType === 'LOGO' && !hasLogo) {
      return { type: 'fallback', text: 'Falling back to text branding (logo not set)', color: 'blue' };
    }
    if (brandingType === 'TEXT' && !hasCompanyName) {
      return { type: 'fallback', text: 'Falling back to default (company name not set)', color: 'blue' };
    }
    return { type: 'active', text: 'Branding is configured', color: 'green' };
  };

  const status = getStatus();

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="md" mb={2}>Branding Choice</Heading>
        <Text color={textColor} fontSize="sm">
          Select how your agency branding appears across the system
        </Text>
      </Box>

      <Divider />

      {/* Status Alert */}
      {status.type !== 'active' && (
        <Alert status={status.color === 'orange' ? 'warning' : 'info'} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Branding Status</AlertTitle>
            <AlertDescription>{status.text}</AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Current Branding Preview */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Heading size="sm">Current Branding Preview</Heading>
        </CardHeader>
        <Divider />
        <CardBody>
          <Center minH="120px">
            {hasLogo || hasCompanyName ? (
              <BrandingLogo 
                logoUrl={user?.logoUrl}
                agencyName={user?.companyName || 'Your Agency'}
                size="lg"
                showText={brandingType === 'TEXT' || !hasLogo}
              />
            ) : (
              <VStack spacing={2}>
                <Icon 
                  as={BuildingOfficeIcon} 
                  w={12} 
                  h={12} 
                  color="gray.400"
                />
                <Text color="gray.500" fontSize="sm">
                  No branding configured
                </Text>
              </VStack>
            )}
          </Center>
        </CardBody>
      </Card>

      <Divider />

      {/* Branding Type Selection */}
      <Box>
        <Heading size="sm" mb={4}>Choose Branding Type</Heading>
        
        <RadioGroup 
          value={brandingType} 
          onChange={handleBrandingTypeChange}
          isDisabled={loading}
        >
          <Stack spacing={4}>
            {/* Text Branding Option */}
            <Card 
              border="2px solid"
              borderColor={brandingType === 'TEXT' ? 'brand.500' : borderColor}
              bg={brandingType === 'TEXT' ? 'brand.50' : bgColor}
              cursor={!loading && hasCompanyName ? 'pointer' : 'not-allowed'}
              transition="all 0.2s"
              _hover={!loading && hasCompanyName ? { borderColor: 'brand.400' } : {}}
              opacity={loading ? 0.6 : 1}
            >
              <CardBody>
                <HStack spacing={4} align="flex-start">
                  <Radio 
                    value="TEXT" 
                    mt={1} 
                    isDisabled={loading || !hasCompanyName}
                    colorScheme="brand"
                  />
                  <VStack align="start" spacing={2} flex={1}>
                    <HStack spacing={2}>
                      <Icon as={FaFileAlt} color="brand.500" />
                      <Heading size="sm">Text Branding</Heading>
                      {hasCompanyName && (
                        <Badge colorScheme="green" size="sm">Configured</Badge>
                      )}
                      {!hasCompanyName && (
                        <Badge colorScheme="gray" size="sm">Not Set</Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color={textColor}>
                      Display your company name: <strong>{user?.companyName || 'Not set'}</strong>
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Shows as text in navbar, sidebar, and other locations
                    </Text>
                    {!hasCompanyName && (
                      <Text fontSize="xs" color="orange.600" fontWeight="medium">
                        ⚠️ Company name not set - will use default fallback
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            {/* Logo Branding Option */}
            <Card 
              border="2px solid"
              borderColor={brandingType === 'LOGO' ? 'brand.500' : borderColor}
              bg={brandingType === 'LOGO' ? 'brand.50' : bgColor}
              cursor={!loading && hasLogo ? 'pointer' : 'not-allowed'}
              transition="all 0.2s"
              _hover={!loading && hasLogo ? { borderColor: 'brand.400' } : {}}
              opacity={loading ? 0.6 : 1}
            >
              <CardBody>
                <HStack spacing={4} align="flex-start">
                  <Radio 
                    value="LOGO" 
                    mt={1} 
                    isDisabled={loading || !hasLogo}
                    colorScheme="brand"
                  />
                  <VStack align="start" spacing={2} flex={1}>
                    <HStack spacing={2}>
                      <Icon as={FaLandmark} color="brand.500" />
                      <Heading size="sm">Logo Branding</Heading>
                      {hasLogo && (
                        <Badge colorScheme="green" size="sm">Configured</Badge>
                      )}
                      {!hasLogo && (
                        <Badge colorScheme="gray" size="sm">Not Set</Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color={textColor}>
                      Display your agency logo only (no text)
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Shows logo image in navbar, sidebar, and other locations
                    </Text>
                    {!hasLogo && (
                      <Text fontSize="xs" color="orange.600" fontWeight="medium">
                        ⚠️ Logo not uploaded - will fall back to text branding
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          </Stack>
        </RadioGroup>

        {/* Save Status Indicator */}
        {loading && (
          <HStack mt={4} spacing={2} p={3} bg="blue.50" borderRadius="md">
            <Spinner size="sm" color="brand.500" />
            <Text fontSize="sm" color="brand.600" fontWeight="medium">
              Saving your branding choice...
            </Text>
          </HStack>
        )}
      </Box>

      <Divider />

      {/* Fallback Rules Info */}
      <Card bg={useColorModeValue('gray.50', 'gray.900')} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Heading size="sm">Fallback Rules</Heading>
        </CardHeader>
        <Divider />
        <CardBody>
          <VStack align="start" spacing={2} fontSize="sm">
            <HStack>
              <Box w="4px" h="4px" borderRadius="full" bg="blue.500" />
              <Text>
                <strong>Logo selected but not uploaded:</strong> Falls back to text branding
              </Text>
            </HStack>
            <HStack>
              <Box w="4px" h="4px" borderRadius="full" bg="blue.500" />
              <Text>
                <strong>No logo or company name set:</strong> Shows default app icon/name
              </Text>
            </HStack>
            <HStack>
              <Box w="4px" h="4px" borderRadius="full" bg="blue.500" />
              <Text>
                <strong>Live preview updates:</strong> Changes apply immediately across the system
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Where Branding Appears */}
      <Card bg={useColorModeValue('purple.50', 'purple.900')} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Heading size="sm">Where Your Branding Appears</Heading>
        </CardHeader>
        <Divider />
        <CardBody>
          <VStack align="start" spacing={2} fontSize="sm">
            <HStack>
              <Badge colorScheme="purple">Navbar</Badge>
              <Text>Top-left of all pages (mobile & desktop)</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="purple">Sidebar</Badge>
              <Text>Header of sidebar drawer on mobile devices</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="purple">Login Screen</Badge>
              <Text>Driver and main login pages (optional)</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="purple">Exports</Badge>
              <Text>PDFs and exported documents (future)</Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Loading State */}
      {loading && (
        <Center py={4}>
          <Spinner size="sm" mr={2} />
          <Text fontSize="sm">Updating branding...</Text>
        </Center>
      )}
    </VStack>
  );
};

export default BrandingSettings;

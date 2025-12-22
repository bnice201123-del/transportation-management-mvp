import React, { useState } from 'react';
import { Box, Image, VStack, Text, Icon, useBreakpointValue } from '@chakra-ui/react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

const BrandingLogo = ({ 
  logoUrl, 
  agencyName = 'Drive', 
  size = 'auto', 
  showText = false,
  brandingType = null // NEW: 'TEXT' or 'LOGO'
}) => {
  const [imageError, setImageError] = useState(false);

  // Auto-responsive sizing based on screen breakpoints
  const responsiveSize = useBreakpointValue({
    base: 'sm',      // mobile: 0px - 480px
    sm: 'sm',        // small mobile: 480px - 768px
    md: 'md',        // tablet: 768px - 992px
    lg: 'lg',        // desktop: 992px - 1280px
    xl: 'xl',        // large desktop: 1280px - 1536px
    '2xl': '2xl'     // extra large: 1536px+
  }, 'md');

  // Use responsive size if 'auto', otherwise use provided size
  const finalSize = size === 'auto' ? responsiveSize : size;

  // NEW: Determine what to display based on brandingType
  // If brandingType is set, respect it; otherwise use showText prop
  const shouldShowLogo = brandingType ? brandingType === 'LOGO' : !showText;
  const shouldShowText = brandingType ? brandingType === 'TEXT' : showText;

  // Determine what to display
  if (shouldShowLogo && logoUrl && !imageError) {
    return (
      <Box
        bg={{ base: 'blue.50', lg: 'transparent' }}
        borderRadius="lg"
        padding={{ base: '4px', sm: '6px', md: '8px', lg: '0px', xl: '0px' }}
        boxShadow={{ base: '0 2px 8px rgba(0, 0, 0, 0.08)', lg: 'none' }}
        border={{ base: '1px solid', lg: 'none' }}
        borderColor={{ base: 'blue.200', lg: 'transparent' }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        _hover={{
          boxShadow: { base: '0 4px 12px rgba(0, 0, 0, 0.12)', lg: 'none' },
          borderColor: { base: 'gray.200', lg: 'transparent' },
          transition: 'all 0.2s'
        }}
      >
        <VStack 
          spacing={{ base: 1, md: 2, lg: 3 }} 
          alignItems="center"
        >
          <Image
            src={logoUrl}
            alt={`${agencyName} logo`}
            maxWidth={{ base: '50px', sm: '60px', md: '90px', lg: '90px', xl: '190px' }}
            maxHeight={{ base: '20px', sm: '24px', md: '36px', lg: '30px', xl: '70px' }}
            height="auto"
            width="auto"
            objectFit="contain"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          {showText && brandingType !== 'LOGO' && (
            <Text 
              fontSize={{ base: 'xs', sm: 'sm', md: 'md', lg: 'lg' }}
              fontWeight="bold"
              color="brand.600"
              textAlign="center"
              noOfLines={1}
            >
              {agencyName}
            </Text>
          )}
        </VStack>
      </Box>
    );
  }

  // Fallback: Display text branding or default icon
  return (
    <Box
      bg={{ base: 'blue.50', lg: 'transparent' }}
      borderRadius="lg"
      padding={{ base: '4px', sm: '6px', md: '8px', lg: '0px', xl: '0px' }}
      boxShadow={{ base: '0 2px 8px rgba(0, 0, 0, 0.08)', lg: 'none' }}
      border={{ base: '1px solid', lg: 'none' }}
      borderColor={{ base: 'blue.200', lg: 'transparent' }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      _hover={{
        boxShadow: { base: '0 4px 12px rgba(0, 0, 0, 0.12)', lg: 'none' },
        borderColor: { base: 'gray.200', lg: 'transparent' },
        transition: 'all 0.2s'
      }}
      minHeight={{ base: '24px', sm: '28px', md: '40px', lg: '0px' }}
    >
      {(agencyName && (shouldShowText || brandingType === 'TEXT')) ? (
        <Text
          fontSize={{ base: 'xs', sm: 'sm', md: 'md', lg: 'lg' }}
          fontWeight="bold"
          color="blue.600"
          textAlign="center"
          noOfLines={2}
          px={{ base: 2, md: 3 }}
        >
          {agencyName}
        </Text>
      ) : (
        <VStack spacing={{ base: 1, md: 2 }} alignItems="center">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="brand.100"
            borderRadius="md"
            border="1px solid"
            borderColor="brand.200"
            w={{ base: '40px', sm: '48px', md: '60px', lg: '80px' }}
            h={{ base: '40px', sm: '48px', md: '60px', lg: '80px' }}
          >
            <Icon
              as={BuildingOfficeIcon}
              w={{ base: 5, sm: 6, md: 8, lg: 10 }}
              h={{ base: 5, sm: 6, md: 8, lg: 10 }}
              color="brand.600"
            />
          </Box>
        </VStack>
      )}
    </Box>
  );
};

export default BrandingLogo;

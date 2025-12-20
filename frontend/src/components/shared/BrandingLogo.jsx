import React, { useState } from 'react';
import { Box, Image, VStack, Text, Icon } from '@chakra-ui/react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

const BrandingLogo = ({ 
  logoUrl, 
  agencyName = 'Drive', 
  size = 'md', 
  showText = false 
}) => {
  const [imageError, setImageError] = useState(false);

  // Define size configurations
  const sizeConfig = {
    sm: { imgHeight: '24px', imgWidth: '60px', textSize: 'xs', spacing: 1 },
    md: { imgHeight: '32px', imgWidth: '80px', textSize: 'sm', spacing: 2 },
    lg: { imgHeight: '48px', imgWidth: '120px', textSize: 'md', spacing: 3 }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Determine what to display
  if (logoUrl && !imageError) {
    return (
      <VStack spacing={config.spacing} alignItems="center">
        <Image
          src={logoUrl}
          alt={`${agencyName} logo`}
          height={config.imgHeight}
          width={config.imgWidth}
          objectFit="contain"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        {showText && (
          <Text 
            fontSize={config.textSize}
            fontWeight="bold"
            color="brand.600"
            textAlign="center"
            noOfLines={1}
          >
            {agencyName}
          </Text>
        )}
      </VStack>
    );
  }

  // Fallback: Default placeholder icon
  return (
    <VStack spacing={config.spacing} alignItems="center">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={config.imgHeight}
        width={config.imgWidth}
        bg="brand.100"
        borderRadius="md"
        border="1px solid"
        borderColor="brand.200"
      >
        <Icon
          as={BuildingOfficeIcon}
          w={config.imgHeight}
          h={config.imgHeight}
          color="brand.600"
        />
      </Box>
      {showText && (
        <Text 
          fontSize={config.textSize}
          fontWeight="bold"
          color="brand.600"
          textAlign="center"
          noOfLines={1}
        >
          {agencyName}
        </Text>
      )}
    </VStack>
  );
};

export default BrandingLogo;

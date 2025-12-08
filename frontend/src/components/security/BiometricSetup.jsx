import React from 'react';
import { Box, Card, CardBody, Heading, VStack, Alert, AlertIcon } from '@chakra-ui/react';

const BiometricSetup = () => {
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Biometric Authentication Setup</Heading>
      <Card>
        <CardBody>
          <Alert status="info">
            <AlertIcon />
            Biometric authentication features are currently being configured. This will allow users to set up fingerprint, face recognition, and other biometric login methods.
          </Alert>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default BiometricSetup;

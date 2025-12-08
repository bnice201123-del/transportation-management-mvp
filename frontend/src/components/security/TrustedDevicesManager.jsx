import React from 'react';
import { Box, Card, CardBody, Heading, VStack, Alert, AlertIcon } from '@chakra-ui/react';

const TrustedDevicesManager = () => {
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Trusted Devices Manager</Heading>
      <Card>
        <CardBody>
          <Alert status="info">
            <AlertIcon />
            Trusted devices management is currently being configured. This will allow users to manage their trusted devices and see login history by device.
          </Alert>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default TrustedDevicesManager;

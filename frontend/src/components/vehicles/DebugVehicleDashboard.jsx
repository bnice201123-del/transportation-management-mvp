import React from 'react';
import { Box, Container, Heading, Text } from '@chakra-ui/react';

const DebugVehicleDashboard = () => {
  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <Heading size="lg" color="orange.600" mb={6}>
          Vehicle Dashboard Debug
        </Heading>
        <Text>
          This is a minimal vehicle dashboard component to test for rendering errors.
        </Text>
      </Box>
    </Container>
  );
};

export default DebugVehicleDashboard;
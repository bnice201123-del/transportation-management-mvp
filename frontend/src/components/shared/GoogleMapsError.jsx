import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  Text,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Link,
  List,
  ListItem,
  ListIcon,
  Badge,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';
import { ExternalLinkIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { testGoogleMapsKey } from '../../utils/testGoogleMapsKey';

const GoogleMapsError = ({ apiKey }) => {
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleTest = async () => {
    setTesting(true);
    const result = await testGoogleMapsKey(apiKey);
    setTestResult(result);
    setTesting(false);
  };

  useEffect(() => {
    // Test API key on mount
    handleTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  return (
    <Box p={6} bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor}>
      <Alert status="error" mb={4}>
        <AlertIcon />
        <Box>
          <AlertTitle>Google Maps Failed to Load</AlertTitle>
          <AlertDescription fontSize="sm">
            The Google Maps API could not be loaded. Please check your configuration.
          </AlertDescription>
        </Box>
      </Alert>

      {testResult && (
        <Alert status={testResult.valid ? 'success' : 'warning'} mb={4}>
          <AlertIcon />
          <VStack align="start" spacing={1} flex={1}>
            <Text fontWeight="bold">{testResult.message}</Text>
            {testResult.details && (
              <VStack align="start" spacing={1} fontSize="sm" mt={2}>
                {testResult.details.map((detail, index) => (
                  <Text key={index}>• {detail}</Text>
                ))}
              </VStack>
            )}
          </VStack>
        </Alert>
      )}

      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontWeight="bold" mb={2}>Current API Key:</Text>
          <Code p={2} borderRadius="md" fontSize="sm" wordBreak="break-all">
            {apiKey || 'NOT SET'}
          </Code>
          <Button size="sm" mt={2} onClick={handleTest} isLoading={testing}>
            Test API Key
          </Button>
        </Box>

        <Accordion allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="bold">
                  Common Issues & Solutions
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                <Box>
                  <HStack mb={2}>
                    <WarningIcon color="orange.500" />
                    <Text fontWeight="semibold">Issue: Invalid API Key</Text>
                  </HStack>
                  <List spacing={2} fontSize="sm" ml={6}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Verify the key is correctly copied from Google Cloud Console
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Check for extra spaces or characters
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Ensure the key is saved in <Code>.env</Code> file as <Code>VITE_GOOGLE_MAPS_API_KEY</Code>
                    </ListItem>
                  </List>
                </Box>

                <Box>
                  <HStack mb={2}>
                    <WarningIcon color="orange.500" />
                    <Text fontWeight="semibold">Issue: API Not Enabled</Text>
                  </HStack>
                  <List spacing={2} fontSize="sm" ml={6}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Go to Google Cloud Console → APIs & Services → Library
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Enable: Maps JavaScript API, Places API, Directions API, Geocoding API
                    </ListItem>
                  </List>
                </Box>

                <Box>
                  <HStack mb={2}>
                    <WarningIcon color="orange.500" />
                    <Text fontWeight="semibold">Issue: Billing Not Enabled</Text>
                  </HStack>
                  <List spacing={2} fontSize="sm" ml={6}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Google Maps requires a billing account (includes $200/month free credit)
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Go to Google Cloud Console → Billing
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Link a billing account to your project
                    </ListItem>
                  </List>
                </Box>

                <Box>
                  <HStack mb={2}>
                    <WarningIcon color="orange.500" />
                    <Text fontWeight="semibold">Issue: Key Restrictions</Text>
                  </HStack>
                  <List spacing={2} fontSize="sm" ml={6}>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Check HTTP referrer restrictions include <Code>http://localhost:*</Code>
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Verify API restrictions allow Maps JavaScript API
                    </ListItem>
                  </List>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="bold">
                  Setup Instructions
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch" fontSize="sm">
                <Text fontWeight="semibold">Step 1: Create Google Cloud Project</Text>
                <List spacing={2} ml={4}>
                  <ListItem>1. Go to <Link href="https://console.cloud.google.com" isExternal color="blue.500">Google Cloud Console <ExternalLinkIcon /></Link></ListItem>
                  <ListItem>2. Click "Select a project" → "New Project"</ListItem>
                  <ListItem>3. Enter a project name and click "Create"</ListItem>
                </List>

                <Text fontWeight="semibold" mt={4}>Step 2: Enable APIs</Text>
                <List spacing={2} ml={4}>
                  <ListItem>1. Go to "APIs & Services" → "Library"</ListItem>
                  <ListItem>2. Search and enable each of these APIs:
                    <List ml={4} mt={1}>
                      <ListItem>• Maps JavaScript API</ListItem>
                      <ListItem>• Places API</ListItem>
                      <ListItem>• Directions API</ListItem>
                      <ListItem>• Geocoding API</ListItem>
                    </List>
                  </ListItem>
                </List>

                <Text fontWeight="semibold" mt={4}>Step 3: Create API Key</Text>
                <List spacing={2} ml={4}>
                  <ListItem>1. Go to "APIs & Services" → "Credentials"</ListItem>
                  <ListItem>2. Click "Create Credentials" → "API Key"</ListItem>
                  <ListItem>3. Copy the generated key</ListItem>
                </List>

                <Text fontWeight="semibold" mt={4}>Step 4: Configure .env File</Text>
                <List spacing={2} ml={4}>
                  <ListItem>1. Open <Code>frontend/.env</Code> file</ListItem>
                  <ListItem>2. Update the line:
                    <Code display="block" mt={1} p={2}>
                      VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
                    </Code>
                  </ListItem>
                  <ListItem>3. Save the file and restart the dev server</ListItem>
                </List>

                <Text fontWeight="semibold" mt={4}>Step 5: Enable Billing</Text>
                <List spacing={2} ml={4}>
                  <ListItem>1. Go to "Billing" in Google Cloud Console</ListItem>
                  <ListItem>2. Link a billing account (credit card required)</ListItem>
                  <ListItem>3. You get $200/month free credit</ListItem>
                </List>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <Box mt={4} p={4} bg="blue.50" borderRadius="md">
          <Text fontSize="sm" fontWeight="bold" color="blue.700" mb={2}>
            📖 Detailed Documentation
          </Text>
          <Text fontSize="sm" color="blue.600">
            See <Code>GOOGLE_MAPS_SETUP.md</Code> in the project root for complete setup instructions.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default GoogleMapsError;

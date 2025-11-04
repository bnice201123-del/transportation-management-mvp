import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  Button,
  SimpleGrid,
  Badge,
  Divider,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { CheckIcon, InfoIcon } from '@chakra-ui/icons';
import Navbar from '../shared/Navbar';

const ScrollTestPage = () => {
  const generateContent = () => {
    const items = [];
    for (let i = 1; i <= 50; i++) {
      items.push(
        <Card key={i} mb={4} variant="outline">
          <CardBody>
            <Heading size="md" mb={2}>Section {i}</Heading>
            <Text mb={4}>
              This is a test section with content to demonstrate scrolling functionality. 
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
              nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Badge colorScheme="blue">Feature {i}A</Badge>
                <Text fontSize="sm" mt={2}>
                  Additional content for feature {i}A with more details about functionality.
                </Text>
              </Box>
              <Box>
                <Badge colorScheme="green">Feature {i}B</Badge>
                <Text fontSize="sm" mt={2}>
                  Additional content for feature {i}B with implementation details.
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      );
    }
    return items;
  };

  return (
    <Box bg="gray.50">
      <Navbar title="Scroll Test Page" />
      
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          <Card bg="blue.50" borderColor="blue.200">
            <CardBody>
              <Heading size="lg" color="blue.700" mb={4}>
                📜 Scroll Test & Footer Demonstration
              </Heading>
              <Text mb={4}>
                This page demonstrates the scrollable content functionality and footer implementation 
                for the Transportation Management System. The page contains extensive content to test 
                scrolling behavior.
              </Text>
              
              <List spacing={2}>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  ✅ Responsive footer at bottom of all pages
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  ✅ Smooth scrolling with custom scrollbars
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  ✅ Proper content layout with sidebar
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckIcon} color="green.500" />
                  ✅ Mobile-responsive design
                </ListItem>
                <ListItem>
                  <ListIcon as={InfoIcon} color="blue.500" />
                  📱 Test on different screen sizes
                </ListItem>
              </List>
              
              <Divider my={4} />
              
              <Button colorScheme="blue" size="sm">
                Scroll down to see more content and the footer below ⬇️
              </Button>
            </CardBody>
          </Card>

          {generateContent()}

          <Card bg="green.50" borderColor="green.200">
            <CardBody>
              <Heading size="md" color="green.700" mb={4}>
                🎉 End of Content
              </Heading>
              <Text>
                If you can see this section and the footer below, the scrolling 
                functionality is working correctly! The footer should appear below 
                this content section.
              </Text>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default ScrollTestPage;
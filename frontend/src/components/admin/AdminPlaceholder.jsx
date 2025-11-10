import React from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { FaCog } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const AdminPlaceholder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Extract page name from URL
  const pathSegments = location.pathname.split('/');
  const pageName = pathSegments[pathSegments.length - 1];
  
  const getPageTitle = () => {
    switch (pageName) {
      case 'access': return 'Access Control';
      case 'import': return 'Bulk User Operations';
      case 'activity': return 'User Activity Monitor';
      case 'config': return 'System Configuration';
      case 'logs': return 'Audit Logs';
      default: return 'Admin Feature';
    }
  };

  const getPageDescription = () => {
    switch (pageName) {
      case 'access': return 'Manage user access permissions, session controls, and security policies';
      case 'import': return 'Import/export users in bulk, perform mass updates and operations';
      case 'activity': return 'Monitor user login history, activity patterns, and security events';
      case 'config': return 'Configure system-wide settings, preferences, and operational parameters';
      case 'logs': return 'View audit trails, system logs, and security event history';
      default: return 'This administrative feature is under development';
    }
  };

  const getPageIcon = () => {
    return <FaCog size={48} color="#3182ce" />;
  };

  return (
    <Box minHeight="100vh" bg={bgColor}>
      <Navbar />
      <Container maxW="4xl" py={16}>
        <VStack spacing={8} align="stretch">
          <Card bg={cardBg} shadow="xl">
            <CardBody textAlign="center" py={12}>
              <VStack spacing={6}>
                {getPageIcon()}
                
                <VStack spacing={3}>
                  <Badge colorScheme="blue" px={4} py={2} fontSize="sm">
                    COMING SOON
                  </Badge>
                  <Heading size="xl" color="blue.600">
                    {getPageTitle()}
                  </Heading>
                  <Text fontSize="lg" color="gray.600" maxW="md">
                    {getPageDescription()}
                  </Text>
                </VStack>

                <Alert status="info" borderRadius="lg" maxW="md">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="bold">
                      Feature Under Development
                    </Text>
                    <Text fontSize="sm">
                      This administrative feature is being developed and will be available in a future update.
                    </Text>
                  </VStack>
                </Alert>

                <VStack spacing={4} pt={4}>
                  <Button
                    leftIcon={<ArrowBackIcon />}
                    colorScheme="blue"
                    size="lg"
                    onClick={() => navigate('/admin/system')}
                  >
                    Back to System Administration
                  </Button>
                  
                  <HStack spacing={4}>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/overview')}
                    >
                      Admin Overview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/settings')}
                    >
                      System Settings
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Quick Links */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Available Admin Features</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">User Management</Text>
                    <Text fontSize="sm" color="gray.600">Manage users and registrations</Text>
                  </VStack>
                  <Button size="sm" onClick={() => navigate('/admin/users')}>
                    Access
                  </Button>
                </HStack>
                
                <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">System Settings</Text>
                    <Text fontSize="sm" color="gray.600">Configure system preferences</Text>
                  </VStack>
                  <Button size="sm" onClick={() => navigate('/admin/settings')}>
                    Access
                  </Button>
                </HStack>
                
                <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Security Dashboard</Text>
                    <Text fontSize="sm" color="gray.600">Monitor security and access</Text>
                  </VStack>
                  <Button size="sm" onClick={() => navigate('/admin/security')}>
                    Access
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminPlaceholder;
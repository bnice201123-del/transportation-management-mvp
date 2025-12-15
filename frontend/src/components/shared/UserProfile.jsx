import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Divider,
  useToast,
  Badge,
  SimpleGrid,
  Spinner,
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  Tooltip,
  Flex
} from '@chakra-ui/react';
import { EmailIcon, PhoneIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProfileImageUpload from './ProfileImageUpload';
import Navbar from './Navbar';
import WorkScheduleButton from './WorkScheduleButton';
import TrustedDevicesManager from '../security/TrustedDevicesManager';
import BiometricSetup from '../security/BiometricSetup';
import axios from '../../config/axios';

const UserProfile = () => {
  const { user, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const toast = useToast();

  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/users/${user._id}`, formData);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh user data
      if (fetchUserProfile) {
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Update Failed',
        description: error.response?.data?.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    return role?.charAt(0).toUpperCase() + role?.slice(1);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'dispatcher':
        return 'purple';
      case 'scheduler':
        return 'green';
      case 'driver':
        return 'blue';
      default:
        return 'gray';
    }
  };

  if (!user) {
    return (
      <>
        <Navbar title="User Profile" />
        <Center h="400px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </>
    );
  }

  return (
    <>
      <Navbar title="User Profile" />
      
      {/* Process Menu */}
      <Flex justify="center" mt={6} mb={6}>
        <Box 
          position="relative"
          onMouseLeave={() => {
            processMenuTimeoutRef.current = setTimeout(() => {
              setIsProcessMenuOpen(false);
            }, 150);
          }}
          onMouseEnter={() => {
            if (processMenuTimeoutRef.current) {
              clearTimeout(processMenuTimeoutRef.current);
            }
            setIsProcessMenuOpen(true);
          }}
        >
          <Tooltip label="View process options" placement="bottom">
            <Button
              variant="outline"
              size={{ base: "sm", md: "md" }}
              colorScheme="blue"
              _hover={{ bg: "blue.50" }}
              onClick={() => setIsProcessMenuOpen(!isProcessMenuOpen)}
            >
              Process
            </Button>
          </Tooltip>
          
          {isProcessMenuOpen && (
            <Box
              position="absolute"
              top="100%"
              left="50%"
              transform="translateX(-50%)"
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              boxShadow="0 10px 25px rgba(0,0,0,0.15)"
              p={6}
              mt={2}
              minW={{ base: "280px", sm: "600px", md: "900px" }}
              zIndex={1100}
              pointerEvents="auto"
            >
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
                {/* Column 1: Trip Creation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/create-trip')}>
                      Create Trip
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/manage-trips')}>
                      Manage Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/map')}>
                      View Map
                    </Button>
                  </VStack>
                </Box>

                {/* Column 2: Trip Views */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/upcoming')}>
                      Upcoming
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/completed')}>
                      Completed
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/all-trips')}>
                      All Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/active')}>
                      Active
                    </Button>
                  </VStack>
                </Box>

                {/* Column 3: Navigation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/riders')}>
                      All Riders
                    </Button>
                    {user?.role !== 'dispatcher' && user?.role !== 'scheduler' && (
                      <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/users')}>
                        All Users
                      </Button>
                    )}
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/drivers')}>
                      Drivers
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/tracking')}>
                      Tracking
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/profile')}>
                      Profile
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/scheduler')}>
                      Schedule
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/search')}>
                      Search
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/recurring-trips')}>
                      Recurring Trips
                    </Button>
                  </VStack>
                </Box>
              </Grid>
            </Box>
          )}
        </Box>
      </Flex>
      
      <Box bg="gray.50" minH="calc(100vh - 80px)" py={8}>
        <Container maxW="container.lg">
          <VStack spacing={6} align="stretch">
            
            {/* Profile Picture Card */}
            <Card>
              <CardHeader>
                <Heading size="md" color="gray.700">Profile Picture</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <ProfileImageUpload
                    userId={user._id}
                    currentImage={user.profileImage}
                    size="2xl"
                    showEditButton={true}
                    onImageUpdate={() => {}}
                  />
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Upload a JPEG or PNG image (max 5MB)
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <Heading size="md" color="gray.700">Personal Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter first name"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter last name"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel>
                      <HStack spacing={2}>
                        <EmailIcon />
                        <Text>Email Address</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>
                      <HStack spacing={2}>
                        <PhoneIcon />
                        <Text>Phone Number</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </FormControl>

                  <Divider my={2} />

                  <HStack spacing={3}>
                    <WorkScheduleButton 
                      userId={user?._id}
                      userName={user?.firstName ? `${user.firstName} ${user.lastName}` : user?.name}
                      variant="outline"
                      colorScheme="green"
                      size="lg"
                    />
                    <Button
                      colorScheme="blue"
                      size="lg"
                      onClick={handleSaveProfile}
                      isLoading={loading}
                      loadingText="Saving..."
                      flex={1}
                    >
                      Save Changes
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Account Information Card */}
            <Card>
              <CardHeader>
                <Heading size="md" color="gray.700">Account Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="medium" color="gray.600">User ID:</Text>
                    <Text color="gray.700" fontFamily="mono" fontSize="sm">{user._id}</Text>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontWeight="medium" color="gray.600">Role:</Text>
                    <Badge colorScheme={getRoleBadgeColor(user.role)} fontSize="md" px={3} py={1}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </HStack>

                  {user.roles && user.roles.length > 1 && (
                    <HStack justify="space-between" align="start">
                      <Text fontWeight="medium" color="gray.600">All Roles:</Text>
                      <HStack spacing={2} flexWrap="wrap" justify="flex-end">
                        {user.roles.map(role => (
                          <Badge key={role} colorScheme={getRoleBadgeColor(role)} fontSize="sm" px={2} py={1}>
                            {getRoleDisplayName(role)}
                          </Badge>
                        ))}
                      </HStack>
                    </HStack>
                  )}

                  {user.createdAt && (
                    <HStack justify="space-between">
                      <Text fontWeight="medium" color="gray.600">Member Since:</Text>
                      <Text color="gray.700">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Security Settings Card */}
            <Card>
              <CardHeader>
                <Heading size="md" color="gray.700">Security Settings</Heading>
              </CardHeader>
              <CardBody>
                <Tabs variant="enclosed" colorScheme="blue">
                  <TabList>
                    <Tab>Trusted Devices</Tab>
                    <Tab>Biometric Authentication</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <TrustedDevicesManager />
                    </TabPanel>
                    <TabPanel>
                      <BiometricSetup />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>

          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default UserProfile;

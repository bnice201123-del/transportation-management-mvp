import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  Divider,
  SimpleGrid,
  FormControl,
  FormLabel,
  Switch,
  Button,
  useToast,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  useColorModeValue
} from '@chakra-ui/react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BellIcon,
  ClockIcon,
  ShieldCheckIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const DispatcherProfile = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    tripAlerts: true,
    driverUpdates: true,
    emergencyAlerts: true,
    dailyReports: false
  });
  const [stats, setStats] = useState({
    totalDispatched: 0,
    activeTrips: 0,
    completedToday: 0,
    averageResponseTime: '0'
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    loadSettings();
    fetchStats();
  }, []);

  const loadSettings = async () => {
    try {
      // Load saved settings from localStorage
      const savedSettings = localStorage.getItem('dispatcherSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch trip stats for the dispatcher
      const tripsResponse = await axios.get('/api/trips');
      const trips = tripsResponse.data?.trips || tripsResponse.data || [];
      
      const today = new Date().toISOString().split('T')[0];
      const completedToday = trips.filter(t => 
        t.status === 'completed' && 
        t.scheduledDate?.startsWith(today)
      ).length;
      const activeTrips = trips.filter(t => 
        ['pending', 'assigned', 'in_progress'].includes(t.status)
      ).length;
      
      setStats({
        totalDispatched: trips.length,
        activeTrips,
        completedToday,
        averageResponseTime: '2.5'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Stats are optional, don't show error toast
    }
  };

  const handleSettingChange = (setting) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };
    setSettings(newSettings);
    localStorage.setItem('dispatcherSettings', JSON.stringify(newSettings));
    
    toast({
      title: 'Settings Updated',
      description: 'Your preferences have been saved',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Loading profile...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Profile Header Card */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardBody>
          <HStack spacing={6} flexDirection={{ base: 'column', md: 'row' }} align="start">
            <Avatar 
              size="2xl" 
              name={`${user?.firstName} ${user?.lastName}`}
              bg="brand.500"
            />
            <VStack align="start" flex={1} spacing={3}>
              <Box>
                <Heading size="lg">{user?.firstName} {user?.lastName}</Heading>
                <Text color={textColor} fontSize="sm" mt={1}>
                  Dispatcher ID: {user?._id?.slice(-8).toUpperCase()}
                </Text>
              </Box>
              <HStack spacing={4} flexWrap="wrap">
                <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                  Dispatcher
                </Badge>
                <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                  Active
                </Badge>
              </HStack>
            </VStack>
          </HStack>

          <Divider my={6} />

          {/* Contact Information */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <HStack spacing={3}>
              <Icon as={EnvelopeIcon} w={5} h={5} color="brand.500" />
              <Box>
                <Text fontSize="xs" color={textColor}>Email</Text>
                <Text fontWeight="medium">{user?.email || 'Not provided'}</Text>
              </Box>
            </HStack>
            <HStack spacing={3}>
              <Icon as={PhoneIcon} w={5} h={5} color="brand.500" />
              <Box>
                <Text fontSize="xs" color={textColor}>Phone</Text>
                <Text fontWeight="medium">{user?.phone || 'Not provided'}</Text>
              </Box>
            </HStack>
            <HStack spacing={3}>
              <Icon as={CalendarDaysIcon} w={5} h={5} color="brand.500" />
              <Box>
                <Text fontSize="xs" color={textColor}>Member Since</Text>
                <Text fontWeight="medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </Box>
            </HStack>
            <HStack spacing={3}>
              <Icon as={ShieldCheckIcon} w={5} h={5} color="brand.500" />
              <Box>
                <Text fontSize="xs" color={textColor}>Access Level</Text>
                <Text fontWeight="medium">Full Dispatch Control</Text>
              </Box>
            </HStack>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Performance Stats */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">Performance Overview</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            <Stat>
              <StatLabel>Total Dispatched</StatLabel>
              <StatNumber>{stats.totalDispatched}</StatNumber>
              <StatHelpText>All time</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Active Trips</StatLabel>
              <StatNumber color="blue.500">{stats.activeTrips}</StatNumber>
              <StatHelpText>Right now</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Completed Today</StatLabel>
              <StatNumber color="green.500">{stats.completedToday}</StatNumber>
              <StatHelpText>Last 24 hours</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Avg Response</StatLabel>
              <StatNumber>{stats.averageResponseTime}</StatNumber>
              <StatHelpText>Minutes</StatHelpText>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Notification Preferences */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardHeader>
          <HStack spacing={3}>
            <Icon as={BellIcon} w={5} h={5} color="brand.500" />
            <Heading size="md">Notification Preferences</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb={0}>Email Notifications</FormLabel>
              <Switch 
                colorScheme="brand"
                isChecked={settings.emailNotifications}
                onChange={() => handleSettingChange('emailNotifications')}
              />
            </FormControl>
            <Divider />
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb={0}>SMS Notifications</FormLabel>
              <Switch 
                colorScheme="brand"
                isChecked={settings.smsNotifications}
                onChange={() => handleSettingChange('smsNotifications')}
              />
            </FormControl>
            <Divider />
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb={0}>Trip Alerts</FormLabel>
              <Switch 
                colorScheme="brand"
                isChecked={settings.tripAlerts}
                onChange={() => handleSettingChange('tripAlerts')}
              />
            </FormControl>
            <Divider />
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb={0}>Driver Updates</FormLabel>
              <Switch 
                colorScheme="brand"
                isChecked={settings.driverUpdates}
                onChange={() => handleSettingChange('driverUpdates')}
              />
            </FormControl>
            <Divider />
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb={0}>Emergency Alerts</FormLabel>
              <Switch 
                colorScheme="brand"
                isChecked={settings.emergencyAlerts}
                onChange={() => handleSettingChange('emergencyAlerts')}
              />
            </FormControl>
            <Divider />
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb={0}>Daily Reports</FormLabel>
              <Switch 
                colorScheme="brand"
                isChecked={settings.dailyReports}
                onChange={() => handleSettingChange('dailyReports')}
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Recent Activity */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardHeader>
          <HStack spacing={3}>
            <Icon as={ClockIcon} w={5} h={5} color="brand.500" />
            <Heading size="md">Recent Activity</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text fontSize="sm">Last Login</Text>
              <Text fontSize="sm" color={textColor}>
                {new Date().toLocaleString()}
              </Text>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <Text fontSize="sm">Last Trip Dispatched</Text>
              <Text fontSize="sm" color={textColor}>2 hours ago</Text>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <Text fontSize="sm">Last Driver Assignment</Text>
              <Text fontSize="sm" color={textColor}>45 minutes ago</Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default DispatcherProfile;

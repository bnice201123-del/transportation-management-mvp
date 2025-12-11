import React, { useState, useEffect } from 'react';
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
  Switch,
  Select,
  Button,
  Divider,
  useToast,
  useColorMode,
  SimpleGrid,
  Badge,
  Icon,
  InputGroup,
  InputLeftElement,
  Input,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Radio,
  RadioGroup,
  Stack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Checkbox,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import {
  MoonIcon,
  SunIcon,
  BellIcon,
  TimeIcon,
  CalendarIcon,
  SettingsIcon,
  LockIcon,
  GlobeIcon,
  ViewIcon
} from '@chakra-ui/icons';
import Navbar from '../shared/Navbar';
import axios from '../../config/axios';

const AccountPreferences = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    // Display Preferences
    theme: colorMode,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    
    // Dashboard Preferences
    defaultDashboard: 'auto',
    compactView: false,
    showQuickActions: true,
    defaultMapView: 'standard',
    
    // Privacy Preferences
    profileVisibility: 'team',
    showEmail: true,
    showPhone: false,
    showLocation: true,
    allowTracking: true,
    
    // Communication Preferences
    emailDigest: 'daily',
    smsNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    soundVolume: 70,
    
    // Accessibility
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
    
    // Auto-features
    autoRefresh: true,
    refreshInterval: 30,
    autoSave: true,
    rememberFilters: true,
    
    // Calendar & Schedule
    weekStartsOn: 'sunday',
    showWeekends: true,
    defaultCalendarView: 'month',
    businessHoursOnly: false
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await axios.get('/api/users/preferences');
      if (response.data.preferences) {
        setPreferences(prev => ({ ...prev, ...response.data.preferences }));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await axios.put('/api/users/preferences', { preferences });
      
      toast({
        title: 'Success',
        description: 'Preferences saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Apply theme change immediately
      if (preferences.theme !== colorMode) {
        toggleColorMode();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save preferences',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <>
      <Navbar title="Account Preferences" />
      <Box bg="gray.50" minH="calc(100vh - 80px)" py={8}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="stretch">
            
            {/* Header */}
            <Card>
              <CardBody>
                <HStack justify="space-between" flexWrap="wrap" gap={4}>
                  <VStack align="start" spacing={1}>
                    <Heading size="lg" color="gray.700">Account Preferences</Heading>
                    <Text color="gray.600">Customize your experience and application settings</Text>
                  </VStack>
                  <Button
                    colorScheme="green"
                    size="lg"
                    onClick={handleSavePreferences}
                    isLoading={loading}
                    leftIcon={<SettingsIcon />}
                  >
                    Save All Changes
                  </Button>
                </HStack>
              </CardBody>
            </Card>

            <Tabs variant="enclosed" colorScheme="green">
              <TabList>
                <Tab><Icon as={ViewIcon} mr={2} />Display</Tab>
                <Tab><Icon as={CalendarIcon} mr={2} />Dashboard</Tab>
                <Tab><Icon as={LockIcon} mr={2} />Privacy</Tab>
                <Tab><Icon as={BellIcon} mr={2} />Communication</Tab>
                <Tab><Icon as={SettingsIcon} mr={2} />Advanced</Tab>
              </TabList>

              <TabPanels>
                {/* Display Preferences */}
                <TabPanel p={0} mt={4}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Display Preferences</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        
                        {/* Theme */}
                        <FormControl>
                          <FormLabel>Theme</FormLabel>
                          <RadioGroup 
                            value={preferences.theme} 
                            onChange={(val) => handlePreferenceChange('theme', val)}
                          >
                            <Stack direction="row" spacing={4}>
                              <Radio value="light">
                                <HStack>
                                  <SunIcon />
                                  <Text>Light Mode</Text>
                                </HStack>
                              </Radio>
                              <Radio value="dark">
                                <HStack>
                                  <MoonIcon />
                                  <Text>Dark Mode</Text>
                                </HStack>
                              </Radio>
                            </Stack>
                          </RadioGroup>
                        </FormControl>

                        <Divider />

                        {/* Language */}
                        <FormControl>
                          <FormLabel>Language</FormLabel>
                          <Select
                            value={preferences.language}
                            onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="zh">Chinese</option>
                          </Select>
                        </FormControl>

                        {/* Timezone */}
                        <FormControl>
                          <FormLabel>Timezone</FormLabel>
                          <Select
                            value={preferences.timezone}
                            onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          >
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Denver">Mountain Time (MT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="America/Anchorage">Alaska Time (AKT)</option>
                            <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                          </Select>
                        </FormControl>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          {/* Date Format */}
                          <FormControl>
                            <FormLabel>Date Format</FormLabel>
                            <Select
                              value={preferences.dateFormat}
                              onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                            >
                              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </Select>
                          </FormControl>

                          {/* Time Format */}
                          <FormControl>
                            <FormLabel>Time Format</FormLabel>
                            <Select
                              value={preferences.timeFormat}
                              onChange={(e) => handlePreferenceChange('timeFormat', e.target.value)}
                            >
                              <option value="12h">12-hour (2:30 PM)</option>
                              <option value="24h">24-hour (14:30)</option>
                            </Select>
                          </FormControl>
                        </SimpleGrid>

                        <Divider />

                        {/* Font Size */}
                        <FormControl>
                          <FormLabel>Font Size</FormLabel>
                          <RadioGroup 
                            value={preferences.fontSize} 
                            onChange={(val) => handlePreferenceChange('fontSize', val)}
                          >
                            <Stack direction="row" spacing={4}>
                              <Radio value="small">Small</Radio>
                              <Radio value="medium">Medium</Radio>
                              <Radio value="large">Large</Radio>
                            </Stack>
                          </RadioGroup>
                        </FormControl>

                        {/* Accessibility Options */}
                        <VStack align="stretch" spacing={3}>
                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>High Contrast Mode</FormLabel>
                            <Switch
                              isChecked={preferences.highContrast}
                              onChange={(e) => handlePreferenceChange('highContrast', e.target.checked)}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>Reduce Motion</FormLabel>
                            <Switch
                              isChecked={preferences.reduceMotion}
                              onChange={(e) => handlePreferenceChange('reduceMotion', e.target.checked)}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>Screen Reader Support</FormLabel>
                            <Switch
                              isChecked={preferences.screenReader}
                              onChange={(e) => handlePreferenceChange('screenReader', e.target.checked)}
                            />
                          </FormControl>
                        </VStack>

                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Dashboard Preferences */}
                <TabPanel p={0} mt={4}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Dashboard Preferences</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        
                        {/* Default Dashboard */}
                        <FormControl>
                          <FormLabel>Default Dashboard on Login</FormLabel>
                          <Select
                            value={preferences.defaultDashboard}
                            onChange={(e) => handlePreferenceChange('defaultDashboard', e.target.value)}
                          >
                            <option value="auto">Auto (based on role)</option>
                            <option value="admin">Admin Dashboard</option>
                            <option value="dispatcher">Dispatcher Dashboard</option>
                            <option value="scheduler">Scheduler Dashboard</option>
                            <option value="driver">Driver Dashboard</option>
                          </Select>
                        </FormControl>

                        <Divider />

                        {/* View Options */}
                        <VStack align="stretch" spacing={3}>
                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>Compact View</FormLabel>
                            <Switch
                              isChecked={preferences.compactView}
                              onChange={(e) => handlePreferenceChange('compactView', e.target.checked)}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>Show Quick Actions</FormLabel>
                            <Switch
                              isChecked={preferences.showQuickActions}
                              onChange={(e) => handlePreferenceChange('showQuickActions', e.target.checked)}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>Remember Last Filters</FormLabel>
                            <Switch
                              isChecked={preferences.rememberFilters}
                              onChange={(e) => handlePreferenceChange('rememberFilters', e.target.checked)}
                            />
                          </FormControl>
                        </VStack>

                        <Divider />

                        {/* Map View */}
                        <FormControl>
                          <FormLabel>Default Map View</FormLabel>
                          <Select
                            value={preferences.defaultMapView}
                            onChange={(e) => handlePreferenceChange('defaultMapView', e.target.value)}
                          >
                            <option value="standard">Standard</option>
                            <option value="satellite">Satellite</option>
                            <option value="terrain">Terrain</option>
                            <option value="traffic">Traffic</option>
                          </Select>
                        </FormControl>

                        <Divider />

                        {/* Auto-refresh */}
                        <VStack align="stretch" spacing={3}>
                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>Auto-refresh Data</FormLabel>
                            <Switch
                              isChecked={preferences.autoRefresh}
                              onChange={(e) => handlePreferenceChange('autoRefresh', e.target.checked)}
                            />
                          </FormControl>

                          {preferences.autoRefresh && (
                            <FormControl>
                              <FormLabel>Refresh Interval (seconds): {preferences.refreshInterval}</FormLabel>
                              <Slider
                                value={preferences.refreshInterval}
                                onChange={(val) => handlePreferenceChange('refreshInterval', val)}
                                min={10}
                                max={300}
                                step={10}
                              >
                                <SliderTrack>
                                  <SliderFilledTrack bg="green.400" />
                                </SliderTrack>
                                <SliderThumb />
                              </Slider>
                            </FormControl>
                          )}

                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>Auto-save Changes</FormLabel>
                            <Switch
                              isChecked={preferences.autoSave}
                              onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                            />
                          </FormControl>
                        </VStack>

                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Privacy Preferences */}
                <TabPanel p={0} mt={4}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Privacy & Visibility</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <AlertDescription fontSize="sm">
                            Control who can see your profile information and how your data is used
                          </AlertDescription>
                        </Alert>

                        {/* Profile Visibility */}
                        <FormControl>
                          <FormLabel>Profile Visibility</FormLabel>
                          <RadioGroup 
                            value={preferences.profileVisibility} 
                            onChange={(val) => handlePreferenceChange('profileVisibility', val)}
                          >
                            <Stack spacing={3}>
                              <Radio value="public">
                                <VStack align="start" spacing={0}>
                                  <Text>Public</Text>
                                  <Text fontSize="xs" color="gray.600">Everyone can see your profile</Text>
                                </VStack>
                              </Radio>
                              <Radio value="team">
                                <VStack align="start" spacing={0}>
                                  <Text>Team Only</Text>
                                  <Text fontSize="xs" color="gray.600">Only team members can see your profile</Text>
                                </VStack>
                              </Radio>
                              <Radio value="private">
                                <VStack align="start" spacing={0}>
                                  <Text>Private</Text>
                                  <Text fontSize="xs" color="gray.600">Only admins can see your profile</Text>
                                </VStack>
                              </Radio>
                            </Stack>
                          </RadioGroup>
                        </FormControl>

                        <Divider />

                        {/* Contact Info Visibility */}
                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="medium">Contact Information Visibility</Text>
                          
                          <FormControl display="flex" alignItems="center" pl={4}>
                            <FormLabel mb={0} flex={1}>Show Email Address</FormLabel>
                            <Switch
                              isChecked={preferences.showEmail}
                              onChange={(e) => handlePreferenceChange('showEmail', e.target.checked)}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center" pl={4}>
                            <FormLabel mb={0} flex={1}>Show Phone Number</FormLabel>
                            <Switch
                              isChecked={preferences.showPhone}
                              onChange={(e) => handlePreferenceChange('showPhone', e.target.checked)}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center" pl={4}>
                            <FormLabel mb={0} flex={1}>Show Current Location</FormLabel>
                            <Switch
                              isChecked={preferences.showLocation}
                              onChange={(e) => handlePreferenceChange('showLocation', e.target.checked)}
                            />
                          </FormControl>
                        </VStack>

                        <Divider />

                        {/* Tracking & Analytics */}
                        <FormControl display="flex" alignItems="center">
                          <FormLabel mb={0} flex={1}>
                            <VStack align="start" spacing={0}>
                              <Text>Allow Activity Tracking</Text>
                              <Text fontSize="xs" color="gray.600">Help us improve by tracking usage analytics</Text>
                            </VStack>
                          </FormLabel>
                          <Switch
                            isChecked={preferences.allowTracking}
                            onChange={(e) => handlePreferenceChange('allowTracking', e.target.checked)}
                          />
                        </FormControl>

                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Communication Preferences */}
                <TabPanel p={0} mt={4}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Communication Preferences</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        
                        {/* Email Digest */}
                        <FormControl>
                          <FormLabel>Email Digest Frequency</FormLabel>
                          <Select
                            value={preferences.emailDigest}
                            onChange={(e) => handlePreferenceChange('emailDigest', e.target.value)}
                          >
                            <option value="realtime">Real-time (as they happen)</option>
                            <option value="hourly">Hourly Summary</option>
                            <option value="daily">Daily Summary</option>
                            <option value="weekly">Weekly Summary</option>
                            <option value="never">Never</option>
                          </Select>
                        </FormControl>

                        <Divider />

                        {/* Notification Channels */}
                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="medium">Notification Channels</Text>
                          
                          <FormControl display="flex" alignItems="center" pl={4}>
                            <FormLabel mb={0} flex={1}>SMS Notifications</FormLabel>
                            <Switch
                              isChecked={preferences.smsNotifications}
                              onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center" pl={4}>
                            <FormLabel mb={0} flex={1}>Push Notifications</FormLabel>
                            <Switch
                              isChecked={preferences.pushNotifications}
                              onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center" pl={4}>
                            <FormLabel mb={0} flex={1}>Sound Enabled</FormLabel>
                            <Switch
                              isChecked={preferences.soundEnabled}
                              onChange={(e) => handlePreferenceChange('soundEnabled', e.target.checked)}
                            />
                          </FormControl>

                          {preferences.soundEnabled && (
                            <FormControl pl={4}>
                              <FormLabel>Sound Volume: {preferences.soundVolume}%</FormLabel>
                              <Slider
                                value={preferences.soundVolume}
                                onChange={(val) => handlePreferenceChange('soundVolume', val)}
                                min={0}
                                max={100}
                                step={5}
                              >
                                <SliderTrack>
                                  <SliderFilledTrack bg="green.400" />
                                </SliderTrack>
                                <SliderThumb />
                              </Slider>
                            </FormControl>
                          )}
                        </VStack>

                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Advanced Preferences */}
                <TabPanel p={0} mt={4}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Advanced Settings</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        
                        {/* Calendar Settings */}
                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="medium">Calendar & Schedule</Text>
                          
                          <FormControl>
                            <FormLabel>Week Starts On</FormLabel>
                            <Select
                              value={preferences.weekStartsOn}
                              onChange={(e) => handlePreferenceChange('weekStartsOn', e.target.value)}
                            >
                              <option value="sunday">Sunday</option>
                              <option value="monday">Monday</option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel>Default Calendar View</FormLabel>
                            <Select
                              value={preferences.defaultCalendarView}
                              onChange={(e) => handlePreferenceChange('defaultCalendarView', e.target.value)}
                            >
                              <option value="day">Day View</option>
                              <option value="week">Week View</option>
                              <option value="month">Month View</option>
                            </Select>
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>Show Weekends</FormLabel>
                            <Switch
                              isChecked={preferences.showWeekends}
                              onChange={(e) => handlePreferenceChange('showWeekends', e.target.checked)}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb={0} flex={1}>Business Hours Only</FormLabel>
                            <Switch
                              isChecked={preferences.businessHoursOnly}
                              onChange={(e) => handlePreferenceChange('businessHoursOnly', e.target.checked)}
                            />
                          </FormControl>
                        </VStack>

                        <Divider />

                        {/* Data Management */}
                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="medium">Data Management</Text>
                          
                          <Button variant="outline" colorScheme="blue" size="sm">
                            Export My Data
                          </Button>
                          
                          <Button variant="outline" colorScheme="orange" size="sm">
                            Clear Cache & Cookies
                          </Button>
                          
                          <Button variant="outline" colorScheme="red" size="sm">
                            Delete Account
                          </Button>
                        </VStack>

                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

              </TabPanels>
            </Tabs>

            {/* Save Button (Bottom) */}
            <Card>
              <CardBody>
                <HStack justify="flex-end">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="green"
                    size="lg"
                    onClick={handleSavePreferences}
                    isLoading={loading}
                    leftIcon={<SettingsIcon />}
                  >
                    Save All Changes
                  </Button>
                </HStack>
              </CardBody>
            </Card>

          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default AccountPreferences;

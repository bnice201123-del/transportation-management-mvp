import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputRightElement,
  Icon,
  Heading,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash, FaLock, FaPhone, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useMobileKeyboard } from '../../hooks/useMobileKeyboard';

/**
 * DriverLoginForm Component
 * Dual login interface for driver section
 * Supports both driver ID and vehicle phone authentication
 */
const DriverLoginForm = () => {
  // State management
  const [driverId, setDriverId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showDevicePassword, setShowDevicePassword] = useState(false);
  const [devicePassword, setDevicePassword] = useState('');

  // Hooks
  const toast = useToast();
  const navigate = useNavigate();
  const { isMobileKeyboardOpen } = useMobileKeyboard();

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const errorBgColor = useColorModeValue('red.50', 'red.900');
  const errorBorderColor = useColorModeValue('red.200', 'red.700');

  /**
   * Validate driver ID format (DRV-XXXX-YYYY)
   */
  const validateDriverId = useCallback((id) => {
    const driverIdRegex = /^DRV-[A-F0-9]{4}-\d{4}$/;
    return driverIdRegex.test(id);
  }, []);

  /**
   * Format phone number (E.164 format)
   */
  const formatPhoneNumber = useCallback((phone) => {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 0) return '';
    
    // Add +1 if US number without country code
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+${cleaned}`;
    } else if (!phone.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phone;
  }, []);

  /**
   * Handle driver ID login
   */
  const handleDriverIdLogin = async (e) => {
    e?.preventDefault();
    
    setError('');
    
    // Validation
    if (!driverId.trim()) {
      setError('Driver ID is required');
      toast({
        title: 'Missing Driver ID',
        description: 'Please enter your driver ID',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!validateDriverId(driverId)) {
      setError('Invalid driver ID format. Format: DRV-XXXX-YYYY');
      toast({
        title: 'Invalid Format',
        description: 'Driver ID must be in format: DRV-XXXX-YYYY',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/drivers/section-login`,
        {
          driverId: driverId.toUpperCase(),
          pin: pin || undefined
        },
        {
          timeout: 10000
        }
      );

      const { token, userId, userName } = response.data.data;

      // Store driver section token
      localStorage.setItem('driverToken', token);
      localStorage.setItem('driverId', driverId);
      localStorage.setItem('driverUserId', userId);
      localStorage.setItem('driverName', userName);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userName}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });

      // Navigate to driver dashboard
      navigate('/driver/dashboard');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please try again.';

      setError(errorMessage);
      toast({
        title: 'Login Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });

      // Clear password for security
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle vehicle phone login
   */
  const handleVehiclePhoneLogin = async (e) => {
    e?.preventDefault();

    setError('');

    // Validation
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      toast({
        title: 'Missing Phone Number',
        description: 'Please enter the vehicle tracker phone number',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone.startsWith('+') || formattedPhone.length < 10) {
      setError('Invalid phone number format');
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!devicePassword.trim()) {
      setError('Device password is required');
      toast({
        title: 'Missing Password',
        description: 'Please enter the device password',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/drivers/vehicle-phone-login`,
        {
          phoneNumber: formattedPhone,
          devicePassword
        },
        {
          timeout: 10000
        }
      );

      const { token, trackerId, vehicleName } = response.data.data;

      // Store vehicle tracker token
      localStorage.setItem('trackerToken', token);
      localStorage.setItem('trackerId', trackerId);
      localStorage.setItem('vehicleName', vehicleName);
      localStorage.setItem('trackerPhoneNumber', formattedPhone);

      toast({
        title: 'Vehicle Tracker Authenticated',
        description: `Connected to ${vehicleName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });

      // Navigate to tracker dashboard
      navigate('/driver/tracker-dashboard');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Vehicle authentication failed. Please try again.';

      setError(errorMessage);
      toast({
        title: 'Authentication Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });

      // Clear password for security
      setDevicePassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, blue.50, purple.50)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      pt={isMobileKeyboardOpen ? 2 : 4}
    >
      <Box
        bg={bgColor}
        rounded="lg"
        shadow="lg"
        p={8}
        maxW="md"
        w="full"
        borderWidth="1px"
        borderColor={borderColor}
      >
        {/* Header */}
        <VStack spacing={4} mb={8}>
          <Box
            bg="linear(to-r, blue.400, purple.500)"
            p={3}
            rounded="full"
            color="white"
          >
            <Icon as={FaLock} boxSize={6} />
          </Box>
          <VStack spacing={1}>
            <Heading size="lg" textAlign="center">
              Driver Section Login
            </Heading>
            <Text color="gray.600" textAlign="center" fontSize="sm">
              Access your driver operations and vehicle tracking
            </Text>
          </VStack>
        </VStack>

        {/* Error Alert */}
        {error && (
          <Alert
            status="error"
            rounded="md"
            mb={6}
            bg={errorBgColor}
            borderColor={errorBorderColor}
            borderWidth="1px"
          >
            <AlertIcon />
            <Box>
              <Text fontSize="sm">{error}</Text>
            </Box>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs index={tab} onChange={setTab} variant="soft-rounded">
          <TabList mb={6} gap={2}>
            <Tab fontSize="sm" fontWeight="medium">
              Driver ID
            </Tab>
            <Tab fontSize="sm" fontWeight="medium">
              Vehicle Phone
            </Tab>
          </TabList>

          <TabPanels>
            {/* Driver ID Login Tab */}
            <TabPanel p={0}>
              <form onSubmit={handleDriverIdLogin}>
                <VStack spacing={4}>
                  {/* Driver ID Input */}
                  <Box w="full">
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={2}
                      color="gray.700"
                    >
                      Driver ID *
                    </Text>
                    <Input
                      type="text"
                      placeholder="DRV-XXXX-YYYY"
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value.toUpperCase())}
                      disabled={loading}
                      autoFocus
                      maxLength={14}
                      size="lg"
                      borderColor={borderColor}
                      focusBorderColor="blue.400"
                      _placeholder={{ color: 'gray.400' }}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Example: DRV-A1B2-1234
                    </Text>
                  </Box>

                  {/* PIN Input (Optional) */}
                  <Box w="full">
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={2}
                      color="gray.700"
                    >
                      PIN (Optional)
                    </Text>
                    <InputGroup size="lg">
                      <Input
                        type={showPin ? 'text' : 'password'}
                        placeholder="Enter PIN if required"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        disabled={loading}
                        maxLength={6}
                        borderColor={borderColor}
                        focusBorderColor="blue.400"
                      />
                      <InputRightElement cursor="pointer">
                        <Icon
                          as={showPin ? FaEyeSlash : FaEye}
                          color="gray.400"
                          onClick={() => setShowPin(!showPin)}
                          _hover={{ color: 'gray.600' }}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </Box>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    w="full"
                    bgGradient="linear(to-r, blue.400, blue.500)"
                    color="white"
                    size="lg"
                    fontWeight="bold"
                    isLoading={loading}
                    loadingText="Authenticating..."
                    disabled={loading || !driverId}
                    _hover={{
                      bgGradient: 'linear(to-r, blue.500, blue.600)',
                      transform: 'translateY(-2px)',
                      shadow: 'lg'
                    }}
                    _active={{
                      transform: 'translateY(0px)',
                      shadow: 'md'
                    }}
                    transition="all 0.2s"
                    rightIcon={loading ? undefined : <FaArrowRight />}
                  >
                    {loading ? 'Authenticating' : 'Sign In'}
                  </Button>

                  {/* Divider */}
                  <Divider />

                  {/* Info Box */}
                  <Box
                    w="full"
                    bg="blue.50"
                    p={4}
                    rounded="md"
                    borderLeft="4px"
                    borderColor="blue.400"
                  >
                    <Text fontSize="sm" color="blue.800">
                      <strong>Don't have a Driver ID?</strong> Contact your
                      administrator to generate one.
                    </Text>
                  </Box>
                </VStack>
              </form>
            </TabPanel>

            {/* Vehicle Phone Login Tab */}
            <TabPanel p={0}>
              <form onSubmit={handleVehiclePhoneLogin}>
                <VStack spacing={4}>
                  {/* Phone Number Input */}
                  <Box w="full">
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={2}
                      color="gray.700"
                    >
                      Vehicle Phone Number *
                    </Text>
                    <InputGroup size="lg">
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={loading}
                        autoFocus
                        borderColor={borderColor}
                        focusBorderColor="blue.400"
                        _placeholder={{ color: 'gray.400' }}
                      />
                      <InputRightElement pointerEvents="none">
                        <Icon as={FaPhone} color="gray.400" />
                      </InputRightElement>
                    </InputGroup>
                  </Box>

                  {/* Device Password Input */}
                  <Box w="full">
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      mb={2}
                      color="gray.700"
                    >
                      Device Password *
                    </Text>
                    <InputGroup size="lg">
                      <Input
                        type={showDevicePassword ? 'text' : 'password'}
                        placeholder="Enter device password"
                        value={devicePassword}
                        onChange={(e) => setDevicePassword(e.target.value)}
                        disabled={loading}
                        borderColor={borderColor}
                        focusBorderColor="blue.400"
                      />
                      <InputRightElement cursor="pointer">
                        <Icon
                          as={showDevicePassword ? FaEyeSlash : FaEye}
                          color="gray.400"
                          onClick={() =>
                            setShowDevicePassword(!showDevicePassword)
                          }
                          _hover={{ color: 'gray.600' }}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </Box>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    w="full"
                    bgGradient="linear(to-r, purple.400, purple.500)"
                    color="white"
                    size="lg"
                    fontWeight="bold"
                    isLoading={loading}
                    loadingText="Authenticating..."
                    disabled={loading || !phoneNumber || !devicePassword}
                    _hover={{
                      bgGradient: 'linear(to-r, purple.500, purple.600)',
                      transform: 'translateY(-2px)',
                      shadow: 'lg'
                    }}
                    _active={{
                      transform: 'translateY(0px)',
                      shadow: 'md'
                    }}
                    transition="all 0.2s"
                    rightIcon={loading ? undefined : <FaArrowRight />}
                  >
                    {loading ? 'Authenticating' : 'Activate Tracker'}
                  </Button>

                  {/* Divider */}
                  <Divider />

                  {/* Info Box */}
                  <Box
                    w="full"
                    bg="purple.50"
                    p={4}
                    rounded="md"
                    borderLeft="4px"
                    borderColor="purple.400"
                  >
                    <Text fontSize="sm" color="purple.800" mb={2}>
                      <strong>Continuous 24/7 Tracking</strong>
                    </Text>
                    <Text fontSize="xs" color="purple.700">
                      Vehicle tracking continues independently of your driver
                      session. Once activated, the tracker runs autonomously.
                    </Text>
                  </Box>
                </VStack>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Footer */}
        <Box mt={8} pt={6} borderTopWidth="1px" borderColor={borderColor}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Secure authentication • Encrypted connection • Activity monitored
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default DriverLoginForm;

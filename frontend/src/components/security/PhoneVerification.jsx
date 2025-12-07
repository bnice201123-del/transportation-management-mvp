/**
 * Phone Verification Component
 * 
 * Reusable component for phone number verification via SMS.
 * Supports multiple purposes: registration, login, phone updates, password reset, 2FA backup.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Input,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  PinInput,
  PinInputField,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Badge,
  Icon,
  Code,
  useColorModeValue
} from '@chakra-ui/react';
import {
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const PhoneVerification = ({
  purpose = 'registration', // registration, login, phone_change, 2fa_backup, password_reset
  phoneNumber: initialPhoneNumber = '',
  onVerified,
  onCancel,
  showPhoneInput = true,
  autoSend = false
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(showPhoneInput ? 'enter_phone' : 'enter_code');
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const toast = useToast();
  const timerRef = useRef(null);
  const cooldownRef = useRef(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Auto-send on mount if configured
  useEffect(() => {
    if (autoSend && initialPhoneNumber && step === 'enter_code') {
      handleSendCode();
    }
  }, []);

  // Timer for code expiration
  useEffect(() => {
    if (expiresAt) {
      timerRef.current = setInterval(() => {
        const remaining = Math.floor((new Date(expiresAt) - new Date()) / 1000);
        setTimeRemaining(remaining > 0 ? remaining : 0);
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setError('Verification code expired. Please request a new one.');
        }
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [expiresAt]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(cooldownRef.current);
    }
  }, [resendCooldown]);

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError('');
  };

  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError('');

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/phone-verification/send', {
        phoneNumber: `+1${cleanPhone}`,
        purpose
      });

      setVerificationId(response.data.verificationId);
      setExpiresAt(response.data.expiresAt);
      setStep('enter_code');
      setResendCooldown(60); // 60 second cooldown

      toast({
        title: 'Code Sent',
        description: `A verification code has been sent to ${phoneNumber}`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      // In development mode, show the code
      if (response.data.code) {
        console.log('🔑 Verification Code (DEV MODE):', response.data.code);
        toast({
          title: 'Development Mode',
          description: (
            <Box>
              <Text>Verification code:</Text>
              <Code fontSize="lg" colorScheme="green">{response.data.code}</Code>
            </Box>
          ),
          status: 'info',
          duration: 10000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Send code error:', error);
      setError(error.response?.data?.message || 'Failed to send verification code');
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send verification code',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      if (verificationCode.length !== 6) {
        setError('Please enter the 6-digit code');
        return;
      }

      setLoading(true);
      setError('');

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const response = await axios.post('/api/phone-verification/verify', {
        phoneNumber: `+1${cleanPhone}`,
        code: verificationCode,
        purpose
      });

      toast({
        title: 'Success',
        description: 'Phone number verified successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      if (onVerified) {
        onVerified({
          phoneNumber: `+1${cleanPhone}`,
          verified: true,
          verifiedAt: response.data.verifiedAt
        });
      }
    } catch (error) {
      console.error('Verify code error:', error);
      const errorData = error.response?.data;
      setError(errorData?.error || 'Verification failed');
      
      if (errorData?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(errorData.attemptsRemaining);
      }

      toast({
        title: 'Verification Failed',
        description: errorData?.error || 'Invalid verification code',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationCode('');
    await handleSendCode();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPurposeText = () => {
    const purposes = {
      registration: 'account registration',
      login: 'login verification',
      phone_change: 'phone number update',
      '2fa_backup': 'two-factor authentication',
      password_reset: 'password reset'
    };
    return purposes[purpose] || 'verification';
  };

  if (step === 'enter_phone') {
    return (
      <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Icon
              as={DevicePhoneMobileIcon}
              boxSize={12}
              color="blue.500"
            />
            <Text fontSize="xl" fontWeight="bold">
              Verify Your Phone Number
            </Text>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Enter your phone number to receive a verification code for {getPurposeText()}
            </Text>
          </VStack>

          <FormControl isInvalid={!!error}>
            <FormLabel>Phone Number</FormLabel>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={handlePhoneChange}
              size="lg"
              maxLength={14}
            />
            <FormHelperText>US phone numbers only (10 digits)</FormHelperText>
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>

          <HStack spacing={3}>
            {onCancel && (
              <Button
                flex={1}
                variant="outline"
                onClick={onCancel}
                isDisabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              flex={1}
              colorScheme="blue"
              onClick={handleSendCode}
              isLoading={loading}
              leftIcon={<DevicePhoneMobileIcon style={{ width: '20px' }} />}
            >
              Send Code
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
      <VStack spacing={6} align="stretch">
        <VStack spacing={2}>
          <Icon
            as={DevicePhoneMobileIcon}
            boxSize={12}
            color="blue.500"
          />
          <Text fontSize="xl" fontWeight="bold">
            Enter Verification Code
          </Text>
          <Text fontSize="sm" color="gray.600" textAlign="center">
            We sent a 6-digit code to<br />
            <strong>{phoneNumber}</strong>
          </Text>
        </VStack>

        {timeRemaining !== null && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <HStack>
                <Icon as={ClockIcon} boxSize={4} color={timeRemaining < 60 ? 'red.500' : 'gray.500'} />
                <Text fontSize="sm" color={timeRemaining < 60 ? 'red.500' : 'gray.600'}>
                  {timeRemaining > 0 ? `Expires in ${formatTime(timeRemaining)}` : 'Code expired'}
                </Text>
              </HStack>
              <Badge colorScheme={attemptsRemaining > 2 ? 'green' : 'red'}>
                {attemptsRemaining} attempts left
              </Badge>
            </HStack>
            <Progress
              value={(timeRemaining / 600) * 100}
              colorScheme={timeRemaining < 60 ? 'red' : 'blue'}
              size="sm"
              borderRadius="full"
            />
          </Box>
        )}

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormControl>
          <FormLabel textAlign="center">Verification Code</FormLabel>
          <HStack justify="center">
            <PinInput
              size="lg"
              value={verificationCode}
              onChange={setVerificationCode}
              onComplete={handleVerifyCode}
              isDisabled={loading || timeRemaining === 0}
            >
              <PinInputField />
              <PinInputField />
              <PinInputField />
              <PinInputField />
              <PinInputField />
              <PinInputField />
            </PinInput>
          </HStack>
          <FormHelperText textAlign="center">
            Enter the 6-digit code sent to your phone
          </FormHelperText>
        </FormControl>

        <VStack spacing={3}>
          <Button
            width="full"
            colorScheme="blue"
            onClick={handleVerifyCode}
            isLoading={loading}
            isDisabled={verificationCode.length !== 6 || timeRemaining === 0}
            leftIcon={<CheckCircleIcon style={{ width: '20px' }} />}
          >
            Verify Code
          </Button>

          <HStack spacing={3} width="full">
            {showPhoneInput && (
              <Button
                flex={1}
                variant="outline"
                onClick={() => {
                  setStep('enter_phone');
                  setVerificationCode('');
                  setError('');
                }}
                isDisabled={loading}
              >
                Change Number
              </Button>
            )}
            <Button
              flex={1}
              variant="ghost"
              onClick={handleResendCode}
              isDisabled={loading || resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
            </Button>
          </HStack>

          {onCancel && (
            <Button
              width="full"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              isDisabled={loading}
            >
              Cancel
            </Button>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default PhoneVerification;

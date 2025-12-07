import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  FormControl,
  FormLabel,
  FormHelperText,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Divider,
  Icon,
  useColorModeValue,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { FiVolume2, FiVolumeX, FiSmartphone, FiEyeOff, FiEye } from 'react-icons/fi';

const SidebarSettings = () => {
  const [overlayOpacity, setOverlayOpacity] = useState(() => {
    return Number(localStorage.getItem('sidebar.overlayOpacity') || '600');
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sidebar.soundEnabled') !== 'false';
  });
  const [hapticEnabled, setHapticEnabled] = useState(() => {
    return localStorage.getItem('sidebar.hapticEnabled') !== 'false';
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Check if Vibration API is supported
  const isVibrationSupported = 'vibrate' in navigator;

  useEffect(() => {
    localStorage.setItem('sidebar.overlayOpacity', String(overlayOpacity));
  }, [overlayOpacity]);

  useEffect(() => {
    localStorage.setItem('sidebar.soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('sidebar.hapticEnabled', String(hapticEnabled));
  }, [hapticEnabled]);

  const handleOverlayOpacityChange = (value) => {
    setOverlayOpacity(value);
  };

  const handleSoundToggle = (e) => {
    const newValue = e.target.checked;
    setSoundEnabled(newValue);
    
    // Play a test sound if enabled
    if (newValue) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkA==');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  };

  const handleHapticToggle = (e) => {
    const newValue = e.target.checked;
    setHapticEnabled(newValue);
    
    // Test vibration if enabled
    if (newValue && isVibrationSupported) {
      navigator.vibrate(20);
    }
  };

  const getOpacityLabel = () => {
    if (overlayOpacity <= 300) return 'Very Light';
    if (overlayOpacity <= 500) return 'Light';
    if (overlayOpacity <= 700) return 'Medium';
    return 'Dark';
  };

  return (
    <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
      <CardHeader>
        <Heading size="md">Sidebar Settings</Heading>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Customize sidebar behavior and appearance
        </Text>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Overlay Opacity */}
          <FormControl>
            <HStack justify="space-between" mb={2}>
              <FormLabel mb={0} display="flex" alignItems="center">
                <Icon as={overlayOpacity > 500 ? FiEyeOff : FiEye} mr={2} />
                Overlay Opacity
              </FormLabel>
              <Badge colorScheme="blue">{getOpacityLabel()}</Badge>
            </HStack>
            <Slider
              value={overlayOpacity}
              onChange={handleOverlayOpacityChange}
              min={200}
              max={800}
              step={100}
              colorScheme="blue"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={6}>
                <Box color="blue.500" />
              </SliderThumb>
            </Slider>
            <FormHelperText>
              Controls the darkness of the overlay when sidebar is open. Current value: {overlayOpacity}
            </FormHelperText>
          </FormControl>

          <Divider />

          {/* Sound Effects */}
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <Box flex="1">
              <FormLabel mb={0} display="flex" alignItems="center">
                <Icon as={soundEnabled ? FiVolume2 : FiVolumeX} mr={2} />
                Sound Effects
              </FormLabel>
              <FormHelperText mt={1}>
                Play subtle sounds when opening/closing sidebar
              </FormHelperText>
            </Box>
            <Switch
              isChecked={soundEnabled}
              onChange={handleSoundToggle}
              colorScheme="green"
              size="lg"
            />
          </FormControl>

          <Divider />

          {/* Haptic Feedback */}
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <Box flex="1">
              <FormLabel mb={0} display="flex" alignItems="center">
                <Icon as={FiSmartphone} mr={2} />
                Haptic Feedback
                {!isVibrationSupported && (
                  <Badge ml={2} colorScheme="gray">Not Supported</Badge>
                )}
              </FormLabel>
              <FormHelperText mt={1}>
                Vibrate on touch interactions (mobile devices only)
              </FormHelperText>
            </Box>
            <Tooltip 
              label={!isVibrationSupported ? "Your device doesn't support haptic feedback" : ""}
              isDisabled={isVibrationSupported}
            >
              <Switch
                isChecked={hapticEnabled}
                onChange={handleHapticToggle}
                colorScheme="purple"
                size="lg"
                isDisabled={!isVibrationSupported}
              />
            </Tooltip>
          </FormControl>

          {/* Info Box */}
          <Box
            p={4}
            bg={useColorModeValue('blue.50', 'blue.900')}
            borderRadius="md"
            borderLeft="4px"
            borderColor="blue.500"
          >
            <Text fontSize="sm" color={useColorModeValue('blue.900', 'blue.100')}>
              <strong>Tip:</strong> These settings are saved locally and will persist across sessions. 
              Sound effects require user interaction before they can play (browser security policy).
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default SidebarSettings;

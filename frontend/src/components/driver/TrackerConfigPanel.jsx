import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Switch,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Heading,
  Text,
  Divider,
  useToast,
  Grid,
  GridItem,
  Badge,
  Icon,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementButton,
  NumberDecrementButton,
} from '@chakra-ui/react';
import { FiSave, FiRotateCcw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useDualLogin } from '../../contexts/DualLoginContext';

/**
 * TrackerConfigPanel Component
 * 
 * Allows drivers to configure vehicle tracker settings including:
 * - Tracking frequency and accuracy
 * - Geofencing zones
 * - Alerts and notifications
 * - Power management settings
 * - Data collection preferences
 */
const TrackerConfigPanel = ({ trackerId, vehicleName, onSaveSuccess }) => {
  const { getTrackerAxios } = useDualLogin();
  const toast = useToast();

  // Form state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Configuration state
  const [config, setConfig] = useState({
    // Tracking settings
    trackingFrequency: 'medium', // low, medium, high, realtime
    trackingAccuracy: 'normal', // low, normal, high
    updateInterval: 30, // seconds

    // Battery settings
    lowBatteryThreshold: 20, // percentage
    batteryOptimization: true,
    powerSavingMode: false,

    // Geofencing
    geofencingEnabled: true,
    geofenceAlerts: true,
    geofenceZones: [],

    // Alerts & Notifications
    speedAlerts: true,
    speedLimit: 65, // mph
    locationAnomalyAlerts: true,
    maintenanceAlerts: true,

    // Data collection
    collectGPSData: true,
    collectCellularData: true,
    collectBatteryStats: true,
    collectSignalStrength: true,

    // Privacy & security
    dataRetention: 30, // days
    encryptionEnabled: true,
    anonymizeData: false,
  });

  const [originalConfig, setOriginalConfig] = useState(config);

  // Load current tracker configuration
  useEffect(() => {
    const loadTrackerConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const trackerAxios = getTrackerAxios();
        
        const response = await trackerAxios.get(
          `/api/vehicles/${trackerId}/tracker-config`
        );

        if (response.data.success) {
          setConfig(response.data.data);
          setOriginalConfig(response.data.data);
          setHasChanges(false);
        }
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load tracker configuration';
        setError(message);
        console.error('Error loading tracker config:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrackerConfig();
  }, [trackerId, getTrackerAxios]);

  // Handle config changes
  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    setSuccess(false);
  };

  // Save configuration
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      const trackerAxios = getTrackerAxios();

      const response = await trackerAxios.put(
        `/api/vehicles/${trackerId}/update-tracking-settings`,
        { settings: config }
      );

      if (response.data.success) {
        setOriginalConfig(config);
        setHasChanges(false);
        setSuccess(true);
        toast({
          title: 'Configuration Saved',
          description: 'Tracker settings have been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save tracker configuration';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Error saving tracker config:', err);
    } finally {
      setSaving(false);
    }
  };

  // Reset to original values
  const handleResetConfig = () => {
    setConfig(originalConfig);
    setHasChanges(false);
    setError(null);
    toast({
      title: 'Reset',
      description: 'Configuration reset to last saved values',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <VStack justify="center" py={10}>
            <Spinner size="lg" color="blue.500" />
            <Text>Loading tracker configuration...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card>
        <CardBody>
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={1}>
                <Heading size="md">Tracker Configuration</Heading>
                <Text fontSize="sm" color="gray.500">{vehicleName}</Text>
              </VStack>
              {success && (
                <Badge colorScheme="green" px={3} py={1}>
                  <Icon as={FiCheckCircle} mr={1} /> Saved
                </Badge>
              )}
            </HStack>
            {hasChanges && (
              <Text fontSize="sm" color="orange.600">
                ⚠️ You have unsaved changes
              </Text>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold">Error</Text>
            <Text fontSize="sm">{error}</Text>
          </VStack>
        </Alert>
      )}

      {/* Tracking Settings */}
      <Card>
        <CardHeader>
          <Heading size="md">📍 Tracking Settings</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Tracking Frequency</FormLabel>
              <Select
                value={config.trackingFrequency}
                onChange={(e) => handleConfigChange('trackingFrequency', e.target.value)}
              >
                <option value="low">Low (Updates every 5 minutes)</option>
                <option value="medium">Medium (Updates every 30 seconds) - Recommended</option>
                <option value="high">High (Updates every 10 seconds)</option>
                <option value="realtime">Real-time (Updates continuously)</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>GPS Accuracy</FormLabel>
              <Select
                value={config.trackingAccuracy}
                onChange={(e) => handleConfigChange('trackingAccuracy', e.target.value)}
              >
                <option value="low">Low Accuracy (~100m)</option>
                <option value="normal">Normal (High) (~10m) - Recommended</option>
                <option value="high">High Accuracy (~1m)</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Update Interval (seconds)</FormLabel>
              <NumberInput
                value={config.updateInterval}
                onChange={(val) => handleConfigChange('updateInterval', parseInt(val) || 30)}
                min={10}
                max={300}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementButton />
                  <NumberDecrementButton />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Battery & Power Settings */}
      <Card>
        <CardHeader>
          <Heading size="md">🔋 Battery & Power</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Battery Optimization</FormLabel>
              <Switch
                isChecked={config.batteryOptimization}
                onChange={(e) => handleConfigChange('batteryOptimization', e.target.checked)}
                ml="auto"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Power Saving Mode</FormLabel>
              <Switch
                isChecked={config.powerSavingMode}
                onChange={(e) => handleConfigChange('powerSavingMode', e.target.checked)}
                ml="auto"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Low Battery Threshold (%)</FormLabel>
              <NumberInput
                value={config.lowBatteryThreshold}
                onChange={(val) => handleConfigChange('lowBatteryThreshold', parseInt(val) || 20)}
                min={5}
                max={50}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementButton />
                  <NumberDecrementButton />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader>
          <Heading size="md">🚨 Alerts & Notifications</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Speed Alerts</FormLabel>
              <Switch
                isChecked={config.speedAlerts}
                onChange={(e) => handleConfigChange('speedAlerts', e.target.checked)}
                ml="auto"
              />
            </FormControl>

            {config.speedAlerts && (
              <FormControl>
                <FormLabel>Speed Limit (mph)</FormLabel>
                <NumberInput
                  value={config.speedLimit}
                  onChange={(val) => handleConfigChange('speedLimit', parseInt(val) || 65)}
                  min={10}
                  max={150}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementButton />
                    <NumberDecrementButton />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}

            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Location Anomaly Alerts</FormLabel>
              <Switch
                isChecked={config.locationAnomalyAlerts}
                onChange={(e) => handleConfigChange('locationAnomalyAlerts', e.target.checked)}
                ml="auto"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Maintenance Alerts</FormLabel>
              <Switch
                isChecked={config.maintenanceAlerts}
                onChange={(e) => handleConfigChange('maintenanceAlerts', e.target.checked)}
                ml="auto"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Geofence Alerts</FormLabel>
              <Switch
                isChecked={config.geofenceAlerts}
                onChange={(e) => handleConfigChange('geofenceAlerts', e.target.checked)}
                ml="auto"
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Data Collection */}
      <Card>
        <CardHeader>
          <Heading size="md">📊 Data Collection</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <FormControl display="flex" alignItems="center">
              <Checkbox
                isChecked={config.collectGPSData}
                onChange={(e) => handleConfigChange('collectGPSData', e.target.checked)}
              >
                Collect GPS Data
              </Checkbox>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <Checkbox
                isChecked={config.collectCellularData}
                onChange={(e) => handleConfigChange('collectCellularData', e.target.checked)}
              >
                Collect Cellular Data
              </Checkbox>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <Checkbox
                isChecked={config.collectBatteryStats}
                onChange={(e) => handleConfigChange('collectBatteryStats', e.target.checked)}
              >
                Collect Battery Statistics
              </Checkbox>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <Checkbox
                isChecked={config.collectSignalStrength}
                onChange={(e) => handleConfigChange('collectSignalStrength', e.target.checked)}
              >
                Collect Signal Strength
              </Checkbox>
            </FormControl>

            <Divider />

            <FormControl>
              <FormLabel>Data Retention (days)</FormLabel>
              <NumberInput
                value={config.dataRetention}
                onChange={(val) => handleConfigChange('dataRetention', parseInt(val) || 30)}
                min={7}
                max={365}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementButton />
                  <NumberDecrementButton />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <Heading size="md">🔒 Privacy & Security</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Encryption Enabled</FormLabel>
              <Switch
                isChecked={config.encryptionEnabled}
                onChange={(e) => handleConfigChange('encryptionEnabled', e.target.checked)}
                ml="auto"
                isDisabled
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Anonymize Data</FormLabel>
              <Switch
                isChecked={config.anonymizeData}
                onChange={(e) => handleConfigChange('anonymizeData', e.target.checked)}
                ml="auto"
              />
            </FormControl>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Your tracker data is encrypted and secure. Anonymization removes identifiable information.
              </Text>
            </Alert>
          </VStack>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <HStack spacing={3} justify="flex-end">
        <Button
          variant="outline"
          leftIcon={<FiRotateCcw />}
          onClick={handleResetConfig}
          isDisabled={!hasChanges || saving}
        >
          Reset
        </Button>
        <Button
          colorScheme="blue"
          leftIcon={<FiSave />}
          onClick={handleSaveConfig}
          isLoading={saving}
          isDisabled={!hasChanges}
        >
          Save Configuration
        </Button>
      </HStack>

      {/* Info Box */}
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <Text fontWeight="bold" fontSize="sm">💡 Configuration Tips</Text>
          <Text fontSize="xs" color="gray.600">
            • Medium tracking frequency is recommended for balanced accuracy and battery life
          </Text>
          <Text fontSize="xs" color="gray.600">
            • Enable battery optimization to extend device lifespan
          </Text>
          <Text fontSize="xs" color="gray.600">
            • Real-time updates consume more power but provide live tracking
          </Text>
        </VStack>
      </Alert>
    </VStack>
  );
};

export default TrackerConfigPanel;

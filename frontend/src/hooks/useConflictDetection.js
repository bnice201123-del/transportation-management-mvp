import { useState, useCallback } from 'react';
import { useDisclosure } from '@chakra-ui/react';

/**
 * Hook for managing conflict detection in trip creation/editing flow
 * 
 * Handles:
 * - Opening/closing conflict detection modal
 * - Tracking conflicts and alternatives
 * - Managing user response to conflicts
 */
export const useConflictDetection = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tripDataForCheck, setTripDataForCheck] = useState(null);
  const [driverIdForCheck, setDriverIdForCheck] = useState(null);
  const [vehicleIdForCheck, setVehicleIdForCheck] = useState(null);
  const [detectedConflicts, setDetectedConflicts] = useState([]);
  const [suggestedAlternatives, setSuggestedAlternatives] = useState([]);
  const [userIgnoredConflicts, setUserIgnoredConflicts] = useState(false);

  /**
   * Initiate conflict checking
   * @param {Object} tripData - Trip data including scheduledDate, scheduledTime, etc.
   * @param {String} driverId - Driver ID to check conflicts for
   * @param {String} vehicleId - Optional vehicle ID
   */
  const checkConflicts = useCallback((tripData, driverId, vehicleId = null) => {
    setTripDataForCheck(tripData);
    setDriverIdForCheck(driverId);
    setVehicleIdForCheck(vehicleId);
    setUserIgnoredConflicts(false);
    onOpen();
  }, [onOpen]);

  /**
   * Called when conflicts are detected by the modal
   */
  const onConflictsDetected = useCallback((conflicts, alternatives) => {
    setDetectedConflicts(conflicts || []);
    setSuggestedAlternatives(alternatives || []);
  }, []);

  /**
   * Handle proceeding without conflicts
   */
  const onProceedWithoutConflicts = useCallback(() => {
    setDetectedConflicts([]);
    setSuggestedAlternatives([]);
  }, []);

  /**
   * Handle proceeding despite conflicts
   */
  const onProceedWithConflicts = useCallback(() => {
    setUserIgnoredConflicts(true);
    setDetectedConflicts([]);
    setSuggestedAlternatives([]);
  }, []);

  return {
    // Modal control
    isOpen,
    onClose,
    checkConflicts,

    // Trip data for modal
    tripDataForCheck,
    driverIdForCheck,
    vehicleIdForCheck,

    // Conflict info
    detectedConflicts,
    suggestedAlternatives,
    hasConflicts: detectedConflicts.length > 0,
    userIgnoredConflicts,

    // Callbacks for modal
    onConflictsDetected,
    onProceedWithoutConflicts,
    onProceedWithConflicts
  };
};

export default useConflictDetection;

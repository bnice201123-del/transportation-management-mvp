import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

/**
 * DualLoginContext
 * Manages dual login state for driver section
 * Separate from main authentication (AuthContext)
 */
const DualLoginContext = createContext();

/**
 * DualLoginProvider Component
 */
export const DualLoginProvider = ({ children }) => {
  // Driver authentication state
  const [driverAuth, setDriverAuth] = useState({
    isAuthenticated: false,
    token: null,
    userId: null,
    driverId: null,
    userName: null,
    expiresAt: null
  });

  // Vehicle tracker state
  const [trackerAuth, setTrackerAuth] = useState({
    isAuthenticated: false,
    token: null,
    trackerId: null,
    vehicleId: null,
    vehicleName: null,
    phoneNumber: null,
    expiresAt: null,
    autonomous: true
  });

  // Loading states
  const [loadingDriver, setLoadingDriver] = useState(false);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize from localStorage on mount
   */
  useEffect(() => {
    const initializeAuth = () => {
      // Check driver authentication
      const driverToken = localStorage.getItem('driverToken');
      const driverId = localStorage.getItem('driverId');
      const driverUserId = localStorage.getItem('driverUserId');
      const driverName = localStorage.getItem('driverName');

      if (driverToken && driverId) {
        setDriverAuth({
          isAuthenticated: true,
          token: driverToken,
          userId: driverUserId,
          driverId,
          userName: driverName,
          expiresAt: null
        });
      }

      // Check tracker authentication
      const trackerToken = localStorage.getItem('trackerToken');
      const trackerId = localStorage.getItem('trackerId');
      const vehicleId = localStorage.getItem('vehicleId');
      const vehicleName = localStorage.getItem('vehicleName');
      const phoneNumber = localStorage.getItem('trackerPhoneNumber');

      if (trackerToken && trackerId) {
        setTrackerAuth({
          isAuthenticated: true,
          token: trackerToken,
          trackerId,
          vehicleId,
          vehicleName,
          phoneNumber,
          expiresAt: null,
          autonomous: true
        });
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login driver
   */
  const loginDriver = useCallback(async (driverId, pin = null) => {
    try {
      setLoadingDriver(true);
      setError(null);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/drivers/section-login`,
        {
          driverId,
          pin
        },
        {
          timeout: 10000
        }
      );

      const { token, userId, userName } = response.data.data;

      // Calculate expiration (12 hours from now)
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      const newAuth = {
        isAuthenticated: true,
        token,
        userId,
        driverId,
        userName,
        expiresAt
      };

      setDriverAuth(newAuth);

      // Persist to localStorage
      localStorage.setItem('driverToken', token);
      localStorage.setItem('driverId', driverId);
      localStorage.setItem('driverUserId', userId);
      localStorage.setItem('driverName', userName);
      localStorage.setItem('driverExpiresAt', expiresAt.toISOString());

      return { success: true, data: newAuth };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Driver authentication failed';

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoadingDriver(false);
    }
  }, []);

  /**
   * Login vehicle tracker
   */
  const loginTracker = useCallback(async (phoneNumber, imei = null) => {
    try {
      setLoadingTracker(true);
      setError(null);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/drivers/vehicle-phone-login`,
        {
          phoneNumber,
          imei
        },
        {
          timeout: 10000
        }
      );

      const { token, trackerId, vehicleId, vehicleName } = response.data.data;

      // Calculate expiration (30 days from now)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const newAuth = {
        isAuthenticated: true,
        token,
        trackerId,
        vehicleId,
        vehicleName,
        phoneNumber,
        expiresAt,
        autonomous: true
      };

      setTrackerAuth(newAuth);

      // Persist to localStorage
      localStorage.setItem('trackerToken', token);
      localStorage.setItem('trackerId', trackerId);
      localStorage.setItem('vehicleId', vehicleId);
      localStorage.setItem('vehicleName', vehicleName);
      localStorage.setItem('trackerPhoneNumber', phoneNumber);
      localStorage.setItem('trackerExpiresAt', expiresAt.toISOString());

      return { success: true, data: newAuth };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Tracker authentication failed';

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoadingTracker(false);
    }
  }, []);

  /**
   * Logout driver
   */
  const logoutDriver = useCallback(() => {
    setDriverAuth({
      isAuthenticated: false,
      token: null,
      userId: null,
      driverId: null,
      userName: null,
      expiresAt: null
    });

    // Clear localStorage
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverId');
    localStorage.removeItem('driverUserId');
    localStorage.removeItem('driverName');
    localStorage.removeItem('driverExpiresAt');

    setError(null);
  }, []);

  /**
   * Logout tracker
   */
  const logoutTracker = useCallback(() => {
    setTrackerAuth({
      isAuthenticated: false,
      token: null,
      trackerId: null,
      vehicleId: null,
      vehicleName: null,
      phoneNumber: null,
      expiresAt: null,
      autonomous: true
    });

    // Clear localStorage
    localStorage.removeItem('trackerToken');
    localStorage.removeItem('trackerId');
    localStorage.removeItem('vehicleId');
    localStorage.removeItem('vehicleName');
    localStorage.removeItem('trackerPhoneNumber');
    localStorage.removeItem('trackerExpiresAt');

    setError(null);
  }, []);

  /**
   * Logout both
   */
  const logoutAll = useCallback(() => {
    logoutDriver();
    logoutTracker();
  }, [logoutDriver, logoutTracker]);

  /**
   * Check if driver token is expired
   */
  const isDriverTokenExpired = useCallback(() => {
    if (!driverAuth.expiresAt) return false;
    return new Date() > new Date(driverAuth.expiresAt);
  }, [driverAuth.expiresAt]);

  /**
   * Check if tracker token is expired
   */
  const isTrackerTokenExpired = useCallback(() => {
    if (!trackerAuth.expiresAt) return false;
    return new Date() > new Date(trackerAuth.expiresAt);
  }, [trackerAuth.expiresAt]);

  /**
   * Get driver token with expiry check
   */
  const getDriverToken = useCallback(() => {
    if (isDriverTokenExpired()) {
      logoutDriver();
      return null;
    }
    return driverAuth.token;
  }, [driverAuth.token, isDriverTokenExpired, logoutDriver]);

  /**
   * Get tracker token with expiry check
   */
  const getTrackerToken = useCallback(() => {
    if (isTrackerTokenExpired()) {
      logoutTracker();
      return null;
    }
    return trackerAuth.token;
  }, [trackerAuth.token, isTrackerTokenExpired, logoutTracker]);

  /**
   * Refresh driver token
   */
  const refreshDriverToken = useCallback(async () => {
    if (!driverAuth.isAuthenticated) return { success: false };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/drivers/refresh-token`,
        { driverId: driverAuth.driverId },
        {
          headers: {
            Authorization: `Bearer ${driverAuth.token}`
          }
        }
      );

      const { token } = response.data.data;
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      const updated = {
        ...driverAuth,
        token,
        expiresAt
      };

      setDriverAuth(updated);
      localStorage.setItem('driverToken', token);
      localStorage.setItem('driverExpiresAt', expiresAt.toISOString());

      return { success: true, data: updated };
    } catch (err) {
      logoutDriver();
      return { success: false, error: err.message };
    }
  }, [driverAuth, logoutDriver]);

  /**
   * Refresh tracker token
   */
  const refreshTrackerToken = useCallback(async () => {
    if (!trackerAuth.isAuthenticated) return { success: false };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/drivers/refresh-tracker-token`,
        { trackerId: trackerAuth.trackerId },
        {
          headers: {
            Authorization: `Bearer ${trackerAuth.token}`
          }
        }
      );

      const { token } = response.data.data;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const updated = {
        ...trackerAuth,
        token,
        expiresAt
      };

      setTrackerAuth(updated);
      localStorage.setItem('trackerToken', token);
      localStorage.setItem('trackerExpiresAt', expiresAt.toISOString());

      return { success: true, data: updated };
    } catch (err) {
      logoutTracker();
      return { success: false, error: err.message };
    }
  }, [trackerAuth, logoutTracker]);

  /**
   * Create axios instance with driver token
   */
  const getDriverAxios = useCallback(() => {
    const token = getDriverToken();
    return axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Driver-Section': 'true'
      }
    });
  }, [getDriverToken]);

  /**
   * Create axios instance with tracker token
   */
  const getTrackerAxios = useCallback(() => {
    const token = getTrackerToken();
    return axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tracker-Section': 'true'
      }
    });
  }, [getTrackerToken]);

  const value = {
    // Driver auth state
    driverAuth,
    loadingDriver,
    loginDriver,
    logoutDriver,
    refreshDriverToken,
    isDriverTokenExpired,
    getDriverToken,
    getDriverAxios,

    // Tracker auth state
    trackerAuth,
    loadingTracker,
    loginTracker,
    logoutTracker,
    refreshTrackerToken,
    isTrackerTokenExpired,
    getTrackerToken,
    getTrackerAxios,

    // Combined operations
    logoutAll,

    // Error state
    error,
    setError
  };

  return (
    <DualLoginContext.Provider value={value}>
      {children}
    </DualLoginContext.Provider>
  );
};

/**
 * useDualLogin Hook
 * Use this hook to access dual login context in components
 */
export const useDualLogin = () => {
  const context = useContext(DualLoginContext);

  if (!context) {
    throw new Error('useDualLogin must be used within DualLoginProvider');
  }

  return context;
};

export default DualLoginContext;

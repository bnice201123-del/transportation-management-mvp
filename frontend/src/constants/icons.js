/**
 * Centralized Icon Definitions
 * 
 * This file provides a single source of truth for all icons used across the application.
 * Using this file ensures:
 * 1. Icon consistency - same icon for same action across all components
 * 2. Easy maintenance - change icon in one place
 * 3. Clear semantic meaning - icon names reflect their purpose
 * 4. No conflicts - each action has a unique icon
 * 
 * Usage:
 * import { ICONS } from '@/constants/icons';
 * <ICONS.EDIT />
 */

// Heroicons Outline - Used for interactive actions
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  TruckIcon,
  UserIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  HomeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Heroicons Solid - Used for status indicators and filled states
import {
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  XCircleIcon as XCircleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  MapPinIcon as MapPinIconSolid,
  TruckIcon as TruckIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

// Chakra UI Icons - Reserved for UI framework components
import {
  HamburgerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
  SettingsIcon,
  UnlockIcon,
} from '@chakra-ui/icons';

// Font Awesome Icons - Reserved for specific transportation/map contexts
import {
  FaRoute,
  FaMap,
  FaMapMarkedAlt,
  FaCar,
  FaBus,
  FaTruck,
  FaUser,
  FaUserTie,
  FaClock,
  FaWrench,
} from 'react-icons/fa';

/**
 * Icon Constants organized by category
 */
export const ICONS = {
  // ========================================
  // NAVIGATION ICONS
  // ========================================
  NAVIGATION: {
    MENU: HamburgerIcon,           // Open mobile menu
    BACK: ArrowBackIcon,           // Go back/previous
    FORWARD: ArrowForwardIcon,     // Go forward/next
    LEFT: ChevronLeftIcon,         // Navigate left
    RIGHT: ChevronRightIcon,       // Navigate right
    HOME: HomeIcon,                // Home/Dashboard
    EXPAND: ChevronDownIcon,       // Expand section/dropdown
    COLLAPSE: ChevronUpIcon,       // Collapse section
  },

  // ========================================
  // CRUD OPERATIONS
  // ========================================
  CRUD: {
    CREATE: PlusIcon,              // Add new item
    READ: EyeIcon,                 // View details
    UPDATE: PencilIcon,            // Edit item
    DELETE: TrashIcon,             // Remove item
    SAVE: CheckCircleIconSolid,    // Save changes
    CANCEL: XMarkIcon,             // Cancel action
    DUPLICATE: DocumentTextIcon,   // Duplicate item
  },

  // ========================================
  // DATA OPERATIONS
  // ========================================
  DATA: {
    REFRESH: ArrowPathIcon,        // Reload/Refresh data
    SEARCH: MagnifyingGlassIcon,   // Search functionality
    FILTER: FunnelIcon,            // Filter results
    DOWNLOAD: ArrowDownTrayIcon,   // Export/Download
    UPLOAD: ArrowUpTrayIcon,       // Import/Upload
    SORT: ChartBarIcon,            // Sort data
  },

  // ========================================
  // COMMUNICATION ICONS
  // ========================================
  COMMUNICATION: {
    PHONE: PhoneIcon,              // Phone call
    EMAIL: EnvelopeIcon,           // Email
    MESSAGE: ChatBubbleLeftIcon,   // Chat/Message
    NOTIFICATION: BellIcon,        // Notifications
  },

  // ========================================
  // STATUS INDICATORS (Solid variants)
  // ========================================
  STATUS: {
    SUCCESS: CheckCircleIconSolid,           // Success state
    WARNING: ExclamationTriangleIconSolid,   // Warning state
    ERROR: XCircleIconSolid,                 // Error state
    INFO: InformationCircleIconSolid,        // Information
    ACTIVE: CheckCircleIconSolid,            // Active status
    PENDING: ClockIconSolid,                 // Pending status
  },

  // ========================================
  // USER & ACCOUNT ICONS
  // ========================================
  USER: {
    PROFILE: UserIcon,             // User profile (outline)
    PROFILE_FILLED: UserIconSolid, // User profile (solid)
    ACCOUNT: UserCircleIcon,       // Account management
    DRIVER: FaUserTie,             // Driver specific
    SETTINGS: SettingsIcon,        // User settings
    LOGOUT: UnlockIcon,            // Sign out
    ADMIN: FaUserTie,              // Admin user
  },

  // ========================================
  // TRANSPORTATION SPECIFIC
  // ========================================
  TRANSPORT: {
    VEHICLE: TruckIcon,            // Vehicle (outline)
    VEHICLE_FILLED: TruckIconSolid,// Vehicle (solid/active)
    CAR: FaCar,                    // Car icon
    BUS: FaBus,                    // Bus icon
    TRUCK: FaTruck,                // Truck icon
    ROUTE: FaRoute,                // Route path
    MAINTENANCE: FaWrench,         // Vehicle maintenance
  },

  // ========================================
  // LOCATION & MAP ICONS
  // ========================================
  LOCATION: {
    PIN: MapPinIcon,               // Location pin (outline)
    PIN_FILLED: MapPinIconSolid,   // Location pin (solid/current)
    MAP: FaMap,                    // Basic map
    MAP_DETAILED: FaMapMarkedAlt,  // Map with markers
    CURRENT: MapPinIconSolid,      // Current location
  },

  // ========================================
  // TIME & SCHEDULING
  // ========================================
  TIME: {
    CLOCK: ClockIcon,              // Time (outline)
    CLOCK_FILLED: ClockIconSolid,  // Time (solid/active)
    CALENDAR: CalendarIcon,        // Calendar
    SCHEDULE: CalendarDaysIcon,    // Scheduling
    RECURRING: ArrowPathIcon,      // Recurring schedule
  },

  // ========================================
  // TRIP ACTIONS
  // ========================================
  TRIP: {
    START: PlayIcon,               // Start trip
    STOP: StopIcon,                // End trip
    PAUSE: PauseIcon,              // Pause trip
    IN_PROGRESS: ClockIconSolid,   // Trip in progress
    COMPLETED: CheckCircleIconSolid,// Completed trip
  },

  // ========================================
  // SETTINGS & CONFIGURATION
  // ========================================
  SETTINGS: {
    GENERAL: SettingsIcon,         // General settings
    ADVANCED: Cog6ToothIcon,       // Advanced settings
    PREFERENCES: Cog6ToothIcon,    // User preferences
  },

  // ========================================
  // REPORTS & ANALYTICS
  // ========================================
  REPORTS: {
    CHART: ChartBarIcon,           // Charts/Analytics
    DOCUMENT: DocumentTextIcon,    // Report document
    DOWNLOAD: ArrowDownTrayIcon,   // Download report
  },
};

/**
 * Helper function to get icon by path
 * Usage: getIcon('CRUD.CREATE') returns PlusIcon
 */
export const getIcon = (path) => {
  const keys = path.split('.');
  let icon = ICONS;
  for (const key of keys) {
    icon = icon[key];
    if (!icon) return null;
  }
  return icon;
};

/**
 * Icon size presets for consistency
 */
export const ICON_SIZES = {
  XS: { w: 3, h: 3 },      // 12px
  SM: { w: 4, h: 4 },      // 16px
  MD: { w: 5, h: 5 },      // 20px
  LG: { w: 6, h: 6 },      // 24px
  XL: { w: 8, h: 8 },      // 32px
  XXL: { w: 10, h: 10 },   // 40px
};

/**
 * Example usage in components:
 * 
 * import { ICONS, ICON_SIZES } from '@/constants/icons';
 * 
 * <Button leftIcon={<Box as={ICONS.CRUD.CREATE} {...ICON_SIZES.MD} />}>
 *   Add New Trip
 * </Button>
 * 
 * <IconButton icon={<ICONS.DATA.REFRESH />} aria-label="Refresh" />
 */

export default ICONS;

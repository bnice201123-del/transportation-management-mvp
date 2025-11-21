import { extendTheme } from '@chakra-ui/react';

// Color mode configuration
const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// Brand color palette
const colors = {
  brand: {
    50:  "#e5f0ff",
    100: "#c2d7ff",
    200: "#9dbdff",
    300: "#78a2ff",
    400: "#4f86ff",
    500: "#2563eb", // main brand blue
    600: "#1d4ec0",
    700: "#163a8f",
    800: "#0f275f",
    900: "#08152f",
  },
  secondary: {
    50:  "#e4fbf7",
    100: "#c0f4e8",
    200: "#98ebd8",
    300: "#6fe2c8",
    400: "#45d8b7",
    500: "#14b8a6", // main secondary teal
    600: "#0f9183",
    700: "#0a6b5f",
    800: "#06453b",
    900: "#021f19",
  },
  neutral: {
    50:  "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2933",
    900: "#111827",
  },
  success: {
    50:  "#ecfdf3",
    100: "#d1fadf",
    200: "#a6f4c5",
    300: "#6ce9a6",
    400: "#32d583",
    500: "#12b76a",
    600: "#039855",
    700: "#027a48",
    800: "#05603a",
    900: "#054f31",
  },
  warning: {
    50:  "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  error: {
    50:  "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  info: {
    50:  "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
};

// Semantic tokens for theming
const semanticTokens = {
  colors: {
    // Page / layout backgrounds
    "bg.page": {
      default: "neutral.50",
      _dark: "neutral.900",
    },
    "bg.card": {
      default: "white",
      _dark: "neutral.800",
    },
    "bg.subtle": {
      default: "neutral.100",
      _dark: "neutral.700",
    },

    // Borders
    "border.subtle": {
      default: "neutral.200",
      _dark: "neutral.700",
    },

    // Text
    "text.main": {
      default: "neutral.800",
      _dark: "neutral.50",
    },
    "text.muted": {
      default: "neutral.500",
      _dark: "neutral.300",
    },
    "text.invert": {
      default: "white",
      _dark: "neutral.900",
    },

    // Buttons
    "btn.primary.bg": {
      default: "brand.500",
      _dark: "brand.400",
    },
    "btn.primary.hover": {
      default: "brand.600",
      _dark: "brand.300",
    },
    "btn.primary.text": {
      default: "white",
      _dark: "neutral.900",
    },

    "btn.secondary.bg": {
      default: "secondary.500",
      _dark: "secondary.400",
    },
    "btn.secondary.hover": {
      default: "secondary.600",
      _dark: "secondary.300",
    },

    // Inputs
    "input.bg": {
      default: "white",
      _dark: "neutral.800",
    },
    "input.border": {
      default: "neutral.300",
      _dark: "neutral.600",
    },
    "input.placeholder": {
      default: "neutral.400",
      _dark: "neutral.500",
    },
  },
};

// Custom theme with responsive design focus
const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  
  // Responsive breakpoints
  breakpoints: {
    base: '0em',     // 0px
    sm: '30em',      // 480px  
    md: '48em',      // 768px
    lg: '62em',      // 992px
    xl: '80em',      // 1280px
    '2xl': '96em',   // 1536px
  },

  // Global styles
  styles: {
    global: {
      // Responsive body styles
      body: {
        bg: 'bg.page',
        color: 'text.main',
        fontSize: { base: 'sm', md: 'md' },
        lineHeight: '1.6',
        overflowX: 'hidden'
      },
      
      // Responsive scrollbar styles
      '*::-webkit-scrollbar': {
        width: { base: '4px', md: '6px' },
      },
      '*::-webkit-scrollbar-track': {
        bg: 'bg.subtle',
      },
      '*::-webkit-scrollbar-thumb': {
        bg: 'neutral.300',
        borderRadius: 'full',
      },
      '*::-webkit-scrollbar-thumb:hover': {
        bg: 'neutral.400',
      },
    },
  },

  // Component styles with enhanced theming
  components: {
    // Container component
    Container: {
      baseStyle: {
        maxW: 'container.xl',
        px: { base: 4, md: 6, lg: 8 },
      },
    },
    
    // Card component with new theme
    Card: {
      baseStyle: {
        container: {
          bg: 'bg.card',
          borderRadius: 'xl',
          borderWidth: '1px',
          borderColor: 'border.subtle',
        },
        shadow: { base: 'sm', md: 'md' },
        overflow: 'hidden',
      },
      variants: {
        elevated: {
          shadow: { base: 'md', md: 'lg' },
          _hover: {
            shadow: { base: 'lg', md: 'xl' },
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    
    // Button component with new theme
    Button: {
      baseStyle: {
        borderRadius: 'xl',
        fontWeight: 'semibold',
        fontSize: { base: 'sm', md: 'md' },
        _focus: {
          boxShadow: 'outline',
        },
      },
      variants: {
        solid: {
          bg: 'btn.primary.bg',
          color: 'btn.primary.text',
          _hover: {
            bg: 'btn.primary.hover',
          },
        },
        outline: {
          borderColor: 'border.subtle',
          color: 'text.main',
          _hover: {
            bg: 'bg.subtle',
          },
        },
        secondary: {
          bg: 'btn.secondary.bg',
          color: 'btn.primary.text',
          _hover: {
            bg: 'btn.secondary.hover',
          },
        },
      },
      sizes: {
        responsive: {
          h: { base: '40px', md: '44px' },
          px: { base: 4, md: 6 },
          fontSize: { base: 'sm', md: 'md' },
        },
      },
    },
    
    // Heading component
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
        lineHeight: 'shorter',
      },
      sizes: {
        responsive: {
          fontSize: { base: 'lg', md: 'xl', lg: '2xl' },
        },
        'responsive-large': {
          fontSize: { base: 'xl', md: '2xl', lg: '3xl', xl: '4xl' },
        },
      },
    },
    
    // Text component
    Text: {
      baseStyle: {
        lineHeight: 'base',
      },
      variants: {
        responsive: {
          fontSize: { base: 'sm', md: 'md' },
        },
        'responsive-small': {
          fontSize: { base: 'xs', md: 'sm' },
        },
      },
    },
    
    // Modal component
    Modal: {
      baseStyle: {
        dialog: {
          mx: { base: 0, md: 4 },
          borderRadius: { base: 0, md: 'lg' },
        },
      },
    },
    
    // Table component
    Table: {
      variants: {
        responsive: {
          table: {
            fontSize: { base: 'xs', md: 'sm' },
          },
          th: {
            fontSize: { base: 'xs', md: 'sm' },
            fontWeight: 'bold',
            px: { base: 2, md: 4 },
            py: { base: 2, md: 3 },
          },
          td: {
            px: { base: 2, md: 4 },
            py: { base: 2, md: 3 },
          },
        },
      },
    },
    
    // Grid component
    Grid: {
      variants: {
        'stats-cards': {
          templateColumns: {
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)',
          },
          gap: { base: 3, md: 4, lg: 6 },
        },
        'form-grid': {
          templateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: { base: 3, md: 4 },
        },
      },
    },
    
    // Stack components
    VStack: {
      baseStyle: {
        spacing: { base: 2, md: 3 },
      },
    },
    HStack: {
      baseStyle: {
        spacing: { base: 2, md: 3 },
      },
    },
    
    // Input component with new theme
    Input: {
      variants: {
        outline: {
          field: {
            bg: 'input.bg',
            borderColor: 'input.border',
            _placeholder: {
              color: 'input.placeholder',
            },
            _hover: {
              borderColor: 'brand.400',
            },
            _focusVisible: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
          },
        },
      },
      sizes: {
        responsive: {
          field: {
            fontSize: { base: 'sm', md: 'md' },
            px: { base: 3, md: 4 },
            h: { base: '40px', md: '44px' },
          },
        },
      },
    },
    
    // Select component
    Select: {
      sizes: {
        responsive: {
          field: {
            fontSize: { base: 'sm', md: 'md' },
            px: { base: 3, md: 4 },
            h: { base: '40px', md: '44px' },
          },
        },
      },
    },
  },

  // Responsive space scale
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },

  // Responsive font sizes
  fontSizes: {
    'xs': { base: '0.65rem', md: '0.75rem' },
    'sm': { base: '0.8rem', md: '0.875rem' },
    'md': { base: '0.9rem', md: '1rem' },
    'lg': { base: '1rem', md: '1.125rem' },
    'xl': { base: '1.125rem', md: '1.25rem' },
    '2xl': { base: '1.25rem', md: '1.5rem' },
    '3xl': { base: '1.5rem', md: '1.875rem' },
    '4xl': { base: '1.875rem', md: '2.25rem' },
    '5xl': { base: '2.25rem', md: '3rem' },
  },
});

export default theme;
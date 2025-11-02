import { extendTheme } from '@chakra-ui/react';

// Custom theme with responsive design focus
const theme = extendTheme({
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
        bg: 'gray.50',
        fontSize: { base: 'sm', md: 'md' },
        lineHeight: '1.6',
        overflowX: 'hidden'
      },
      
      // Responsive scrollbar styles
      '*::-webkit-scrollbar': {
        width: { base: '4px', md: '6px' },
      },
      '*::-webkit-scrollbar-track': {
        bg: 'gray.100',
      },
      '*::-webkit-scrollbar-thumb': {
        bg: 'gray.300',
        borderRadius: 'full',
      },
      '*::-webkit-scrollbar-thumb:hover': {
        bg: 'gray.400',
      },
    },
  },

  // Component styles with responsive defaults
  components: {
    // Container component
    Container: {
      baseStyle: {
        maxW: 'container.xl',
        px: { base: 4, md: 6, lg: 8 },
      },
    },
    
    // Card component
    Card: {
      baseStyle: {
        shadow: { base: 'sm', md: 'md' },
        borderRadius: { base: 'md', md: 'lg' },
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
    
    // Button component
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: { base: 'md', md: 'lg' },
        fontSize: { base: 'sm', md: 'md' },
        _focus: {
          boxShadow: 'outline',
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
    
    // Input component
    Input: {
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

  // Enhanced color palette
  colors: {
    brand: {
      50: '#e8f5e8',
      100: '#c1e4c1',
      200: '#97d297',
      300: '#6cbf6c',
      400: '#4cb04c',
      500: '#2d9b2d',
      600: '#258b25',
      700: '#1c7a1c',
      800: '#136913',
      900: '#0a4d0a',
    },
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
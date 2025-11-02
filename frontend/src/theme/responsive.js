// Responsive breakpoints and utilities for Chakra UI
// This file contains standardized responsive values used throughout the application

export const breakpoints = {
  base: '0em',     // 0px
  sm: '30em',      // 480px
  md: '48em',      // 768px
  lg: '62em',      // 992px
  xl: '80em',      // 1280px
  '2xl': '96em',   // 1536px
};

// Sidebar responsive widths
export const sidebarWidths = {
  base: 0,
  md: "60px",
  lg: "200px", 
  xl: "240px"
};

// Container responsive margins (to account for sidebar)
export const containerMargins = {
  base: 0,
  md: "60px",
  lg: "200px",
  xl: "240px"
};

// Responsive spacing patterns
export const spacing = {
  // Padding for containers
  containerPadding: {
    base: 4,
    md: 6,
    lg: 8
  },
  
  // Margins between sections
  sectionMargin: {
    base: 4,
    md: 6,
    lg: 8
  },
  
  // Grid gaps
  gridGap: {
    base: 3,
    md: 4,
    lg: 6
  },
  
  // Card padding
  cardPadding: {
    base: 4,
    md: 6
  },
  
  // Button spacing
  buttonSpacing: {
    base: 2,
    md: 3,
    lg: 4
  }
};

// Responsive typography
export const typography = {
  // Headings
  heading: {
    h1: {
      base: "xl",
      md: "2xl",
      lg: "3xl",
      xl: "4xl"
    },
    h2: {
      base: "lg",
      md: "xl",
      lg: "2xl"
    },
    h3: {
      base: "md",
      md: "lg",
      lg: "xl"
    },
    h4: {
      base: "sm",
      md: "md",
      lg: "lg"
    }
  },
  
  // Body text
  body: {
    regular: {
      base: "sm",
      md: "md"
    },
    large: {
      base: "md",
      md: "lg"
    },
    small: {
      base: "xs",
      md: "sm"
    }
  },
  
  // Button text
  button: {
    base: "sm",
    md: "md"
  }
};

// Grid template patterns
export const gridTemplates = {
  // Statistics cards
  statsCards: {
    base: "1fr",
    sm: "repeat(2, 1fr)",
    lg: "repeat(3, 1fr)",
    xl: "repeat(4, 1fr)"
  },
  
  // Form grids
  twoColumn: {
    base: "1fr",
    md: "1fr 1fr"
  },
  
  threeColumn: {
    base: "1fr",
    md: "1fr 1fr",
    lg: "1fr 1fr 1fr"
  },
  
  fourColumn: {
    base: "1fr",
    sm: "1fr 1fr",
    lg: "repeat(4, 1fr)"
  },
  
  // Layout grids
  sidebarMain: {
    base: "1fr",
    lg: "300px 1fr"
  },
  
  mainSidebar: {
    base: "1fr",
    lg: "1fr 300px"
  }
};

// Component responsive styles
export const componentStyles = {
  // Cards
  card: {
    shadow: {
      base: "sm",
      md: "md"
    },
    padding: spacing.cardPadding,
    hoverShadow: {
      base: "md",
      md: "lg"
    }
  },
  
  // Tables
  table: {
    size: {
      base: "sm",
      md: "md"
    },
    fontSize: {
      base: "xs",
      md: "sm"
    }
  },
  
  // Modals
  modal: {
    size: {
      base: "full",
      md: "4xl",
      lg: "6xl"
    },
    margin: {
      base: 0,
      md: 4
    },
    borderRadius: {
      base: 0,
      md: "lg"
    }
  },
  
  // Buttons
  button: {
    size: {
      base: "md",
      md: "lg"
    },
    fontSize: typography.button
  },
  
  // Icons
  icon: {
    small: {
      base: 3,
      md: 4
    },
    medium: {
      base: 4,
      md: 5
    },
    large: {
      base: 5,
      md: 6
    }
  }
};

// Responsive display utilities
export const display = {
  // Hide on mobile, show on desktop
  desktopOnly: {
    base: "none",
    md: "block"
  },
  
  // Show on mobile, hide on desktop
  mobileOnly: {
    base: "block",
    md: "none"
  },
  
  // Hide on small screens
  hideOnSmall: {
    base: "none",
    sm: "block"
  },
  
  // Responsive flex directions
  flexDirection: {
    stackOnMobile: {
      base: "column",
      md: "row"
    },
    rowOnMobile: {
      base: "row",
      md: "column"
    }
  }
};

// Common responsive patterns
export const patterns = {
  // Dashboard layout
  dashboard: {
    marginLeft: containerMargins,
    paddingTop: { base: 4, md: 0 },
    minHeight: "100vh",
    backgroundColor: "gray.50"
  },
  
  // Page container
  pageContainer: {
    maxWidth: "container.xl",
    padding: spacing.containerPadding,
    margin: "0 auto"
  },
  
  // Section spacing
  section: {
    marginBottom: spacing.sectionMargin
  },
  
  // Responsive stack
  responsiveStack: {
    direction: { base: "column", md: "row" },
    spacing: spacing.buttonSpacing,
    align: { base: "stretch", md: "center" }
  }
};

export default {
  breakpoints,
  sidebarWidths,
  containerMargins,
  spacing,
  typography,
  gridTemplates,
  componentStyles,
  display,
  patterns
};
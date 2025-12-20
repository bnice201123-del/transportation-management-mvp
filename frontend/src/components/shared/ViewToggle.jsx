import React, { useState, useEffect } from 'react';
import {
  HStack,
  IconButton,
  Box,
  useBreakpointValue,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { TableCellsIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useViewMode } from '../../hooks/useViewMode';

/**
 * ViewToggle Component
 * 
 * Provides table/card view toggle for responsive tables
 * Persists preference to localStorage
 * Only visible on mobile devices
 */
export const ViewToggle = ({ 
  storageKey = 'tableViewPreference',
  onViewChange,
  size = "md"
}) => {
  const [viewMode, setViewMode] = useState('table');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const activeBgColor = useColorModeValue('blue.500', 'blue.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const activeTextColor = 'white';

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setViewMode(saved);
      if (onViewChange) onViewChange(saved);
    }
  }, [storageKey, onViewChange]);

  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem(storageKey, mode);
    if (onViewChange) onViewChange(mode);
  };

  if (!isMobile) return null;

  return (
    <HStack 
      spacing={0} 
      bg={bgColor} 
      borderRadius="md" 
      p={1}
      display={{ base: "flex", md: "none" }}
    >
      <Tooltip label="Table View">
        <IconButton
          icon={<Box as={TableCellsIcon} w={4} h={4} />}
          size={size}
          variant={viewMode === 'table' ? 'solid' : 'ghost'}
          colorScheme={viewMode === 'table' ? 'blue' : undefined}
          bg={viewMode === 'table' ? activeBgColor : 'transparent'}
          color={viewMode === 'table' ? activeTextColor : textColor}
          onClick={() => handleViewChange('table')}
          aria-label="Table view"
          borderRadius="md"
          _hover={{
            bg: viewMode === 'table' ? activeBgColor : `${bgColor}.600`,
          }}
        />
      </Tooltip>
      <Tooltip label="Card View">
        <IconButton
          icon={<Box as={Bars3Icon} w={4} h={4} />}
          size={size}
          variant={viewMode === 'card' ? 'solid' : 'ghost'}
          colorScheme={viewMode === 'card' ? 'blue' : undefined}
          bg={viewMode === 'card' ? activeBgColor : 'transparent'}
          color={viewMode === 'card' ? activeTextColor : textColor}
          onClick={() => handleViewChange('card')}
          aria-label="Card view"
          borderRadius="md"
          _hover={{
            bg: viewMode === 'card' ? activeBgColor : `${bgColor}.600`,
          }}
        />
      </Tooltip>
    </HStack>
  );
};

/**
 * ViewContainer Component
 * 
 * Wraps table and card views, showing appropriate view based on preference
 * Example usage:
 * 
 * <ViewContainer
 *   storageKey="tripsViewMode"
 *   onViewChange={(mode) => console.log('View changed to:', mode)}
 * >
 *   <ViewTable key="table">
 *     <Table>...</Table>
 *   </ViewTable>
 *   <ViewCard key="card">
 *     <VStack>...</VStack>
 *   </ViewCard>
 * </ViewContainer>
 */
export const ViewContainer = ({ 
  children, 
  storageKey = 'tableViewPreference',
  onViewChange
}) => {
  const { viewMode, isLoaded } = useViewMode(storageKey);

  useEffect(() => {
    if (isLoaded && onViewChange) {
      onViewChange(viewMode);
    }
  }, [viewMode, isLoaded, onViewChange]);

  if (!isLoaded) return null;

  return (
    <>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        
        const childKey = child.key;
        const shouldRender = childKey === viewMode;
        
        return shouldRender ? child.props.children : null;
      })}
    </>
  );
};

/**
 * Utility components for ViewContainer
 */
const ViewTable = ({ children }) => children;
const ViewCard = ({ children }) => children;

export { ViewTable, ViewCard };
export default ViewToggle;

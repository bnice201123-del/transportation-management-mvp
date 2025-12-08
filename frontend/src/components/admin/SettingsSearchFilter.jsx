import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  Button,
  Badge,
  Text,
  IconButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  FormControl,
  FormLabel,
  Switch,
  Tooltip,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  useColorModeValue,
  useToast,
  Card,
  CardBody,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  CloseIcon,
  CheckIcon,
} from '@chakra-ui/icons';
import { 
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaStar,
  FaExclamationTriangle,
  FaFilter,
} from 'react-icons/fa';

const SettingsSearchFilter = ({ 
  settings, 
  onFilteredSettingsChange,
  changeHistory = [] 
}) => {
  const toast = useToast();
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modifiedFilter, setModifiedFilter] = useState('all'); // all, today, week, month
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  // Color modes
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const highlightBg = useColorModeValue('yellow.100', 'yellow.900');
  const statBg = useColorModeValue('gray.50', 'gray.700');
  const resultsBg = useColorModeValue('blue.50', 'blue.900');

  // Get all categories from settings
  const categories = useMemo(() => {
    if (!settings) return [];
    return Object.keys(settings).filter(key => 
      typeof settings[key] === 'object' && !Array.isArray(settings[key])
    );
  }, [settings]);

  // Get modified settings from change history
  const getModifiedSettings = React.useCallback((timeRange) => {
    if (!changeHistory || changeHistory.length === 0) return new Set();
    
    const now = new Date();
    const modifiedSet = new Set();
    
    changeHistory.forEach(change => {
      const changeDate = new Date(change.timestamp);
      const hoursDiff = (now - changeDate) / (1000 * 60 * 60);
      
      let isInRange = false;
      if (timeRange === 'today' && hoursDiff <= 24) isInRange = true;
      else if (timeRange === 'week' && hoursDiff <= 168) isInRange = true;
      else if (timeRange === 'month' && hoursDiff <= 720) isInRange = true;
      
      if (isInRange) {
        modifiedSet.add(`${change.category}.${change.field}`);
      }
    });
    
    return modifiedSet;
  }, [changeHistory]);

  // Filter settings based on all criteria
  const filteredSettings = useMemo(() => {
    if (!settings) return {};
    
    let result = { ...settings };
    const modifiedSet = modifiedFilter !== 'all' ? getModifiedSettings(modifiedFilter) : new Set();
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      const filteredCategory = {};
      if (result[categoryFilter]) {
        filteredCategory[categoryFilter] = result[categoryFilter];
      }
      result = filteredCategory;
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = {};
      
      Object.keys(result).forEach(category => {
        if (typeof result[category] === 'object' && !Array.isArray(result[category])) {
          const matchingFields = {};
          
          Object.keys(result[category]).forEach(field => {
            const value = result[category][field];
            const valueStr = String(value).toLowerCase();
            const fieldName = field.toLowerCase();
            
            // Check if field name, value, or category matches search
            if (
              fieldName.includes(query) ||
              valueStr.includes(query) ||
              category.toLowerCase().includes(query)
            ) {
              matchingFields[field] = value;
            }
          });
          
          if (Object.keys(matchingFields).length > 0) {
            filtered[category] = matchingFields;
          }
        }
      });
      
      result = filtered;
    }
    
    // Apply modified filter
    if (showOnlyModified && modifiedSet.size > 0) {
      const filtered = {};
      
      Object.keys(result).forEach(category => {
        if (typeof result[category] === 'object' && !Array.isArray(result[category])) {
          const modifiedFields = {};
          
          Object.keys(result[category]).forEach(field => {
            if (modifiedSet.has(`${category}.${field}`)) {
              modifiedFields[field] = result[category][field];
            }
          });
          
          if (Object.keys(modifiedFields).length > 0) {
            filtered[category] = modifiedFields;
          }
        }
      });
      
      result = filtered;
    }
    
    return result;
  }, [settings, searchQuery, categoryFilter, modifiedFilter, showOnlyModified, getModifiedSettings]);

  // Update parent component when filtered settings change
  React.useEffect(() => {
    if (onFilteredSettingsChange) {
      onFilteredSettingsChange(filteredSettings);
    }
  }, [filteredSettings, onFilteredSettingsChange]);

  // Update active filters display
  React.useEffect(() => {
    const filters = [];
    if (searchQuery) filters.push({ type: 'search', value: searchQuery });
    if (categoryFilter !== 'all') filters.push({ type: 'category', value: categoryFilter });
    if (modifiedFilter !== 'all') filters.push({ type: 'modified', value: modifiedFilter });
    if (showOnlyModified) filters.push({ type: 'onlyModified', value: 'true' });
    if (showOnlyErrors) filters.push({ type: 'onlyErrors', value: 'true' });
    setActiveFilters(filters);
  }, [searchQuery, categoryFilter, modifiedFilter, showOnlyModified, showOnlyErrors]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setModifiedFilter('all');
    setShowOnlyErrors(false);
    setShowOnlyModified(false);
    
    toast({
      title: 'Filters cleared',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Remove individual filter
  const removeFilter = (filterType) => {
    switch (filterType) {
      case 'search':
        setSearchQuery('');
        break;
      case 'category':
        setCategoryFilter('all');
        break;
      case 'modified':
        setModifiedFilter('all');
        break;
      case 'onlyModified':
        setShowOnlyModified(false);
        break;
      case 'onlyErrors':
        setShowOnlyErrors(false);
        break;
      default:
        break;
    }
  };

  // Quick filter for modified settings
  const applyQuickFilter = (period) => {
    setModifiedFilter(period);
    setShowOnlyModified(true);
    
    const modifiedSet = getModifiedSettings(period);
    
    toast({
      title: `Showing settings modified in ${period}`,
      description: `Found ${modifiedSet.size} modified setting(s)`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSettings = Object.keys(settings || {}).reduce((acc, category) => {
      if (typeof settings[category] === 'object' && !Array.isArray(settings[category])) {
        return acc + Object.keys(settings[category]).length;
      }
      return acc;
    }, 0);

    const filteredCount = Object.keys(filteredSettings).reduce((acc, category) => {
      if (typeof filteredSettings[category] === 'object' && !Array.isArray(filteredSettings[category])) {
        return acc + Object.keys(filteredSettings[category]).length;
      }
      return acc;
    }, 0);

    const modifiedToday = getModifiedSettings('today').size;
    const modifiedWeek = getModifiedSettings('week').size;

    return {
      total: totalSettings,
      filtered: filteredCount,
      modifiedToday,
      modifiedWeek,
      categories: Object.keys(filteredSettings).length,
    };
  }, [settings, filteredSettings, getModifiedSettings]);

  // Highlight search terms in text
  const highlightText = (text) => {
    if (!searchQuery.trim()) return text;
    
    const query = searchQuery.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(query);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <Box as="span" bg={highlightBg} px={1} borderRadius="sm" fontWeight="bold">
          {text.substring(index, index + query.length)}
        </Box>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} shadow="sm">
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <HStack>
              <FaFilter color="blue.500" />
              <Text fontSize="lg" fontWeight="bold">
                Search & Filter Settings
              </Text>
            </HStack>
            {activeFilters.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                leftIcon={<CloseIcon />}
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            )}
          </HStack>

          <Divider />

          {/* Statistics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat bg={statBg} p={3} borderRadius="md" size="sm">
              <StatLabel>Total Settings</StatLabel>
              <StatNumber>{stats.total}</StatNumber>
              <StatHelpText>Across {categories.length} categories</StatHelpText>
            </Stat>

            <Stat bg={statBg} p={3} borderRadius="md" size="sm">
              <StatLabel>Filtered</StatLabel>
              <StatNumber color="blue.500">{stats.filtered}</StatNumber>
              <StatHelpText>Matching criteria</StatHelpText>
            </Stat>

            <Stat bg={statBg} p={3} borderRadius="md" size="sm">
              <StatLabel>Modified Today</StatLabel>
              <StatNumber color="orange.500">{stats.modifiedToday}</StatNumber>
              <StatHelpText>Last 24 hours</StatHelpText>
            </Stat>

            <Stat bg={statBg} p={3} borderRadius="md" size="sm">
              <StatLabel>Modified Week</StatLabel>
              <StatNumber color="green.500">{stats.modifiedWeek}</StatNumber>
              <StatHelpText>Last 7 days</StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Search Bar */}
          <InputGroup size="lg">
            <InputLeftElement>
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by field name, value, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={bgColor}
            />
            {searchQuery && (
              <InputRightElement>
                <IconButton
                  icon={<CloseIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                />
              </InputRightElement>
            )}
          </InputGroup>

          {/* Quick Filters */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Quick Filters:
            </Text>
            <Wrap spacing={2}>
              <WrapItem>
                <Button
                  size="sm"
                  leftIcon={<FaCalendarDay />}
                  colorScheme={modifiedFilter === 'today' && showOnlyModified ? 'blue' : 'gray'}
                  variant={modifiedFilter === 'today' && showOnlyModified ? 'solid' : 'outline'}
                  onClick={() => applyQuickFilter('today')}
                >
                  Modified Today
                  {stats.modifiedToday > 0 && (
                    <Badge ml={2} colorScheme="orange">
                      {stats.modifiedToday}
                    </Badge>
                  )}
                </Button>
              </WrapItem>

              <WrapItem>
                <Button
                  size="sm"
                  leftIcon={<FaCalendarWeek />}
                  colorScheme={modifiedFilter === 'week' && showOnlyModified ? 'blue' : 'gray'}
                  variant={modifiedFilter === 'week' && showOnlyModified ? 'solid' : 'outline'}
                  onClick={() => applyQuickFilter('week')}
                >
                  Modified This Week
                  {stats.modifiedWeek > 0 && (
                    <Badge ml={2} colorScheme="green">
                      {stats.modifiedWeek}
                    </Badge>
                  )}
                </Button>
              </WrapItem>

              <WrapItem>
                <Button
                  size="sm"
                  leftIcon={<FaCalendarAlt />}
                  colorScheme={modifiedFilter === 'month' && showOnlyModified ? 'blue' : 'gray'}
                  variant={modifiedFilter === 'month' && showOnlyModified ? 'solid' : 'outline'}
                  onClick={() => applyQuickFilter('month')}
                >
                  Modified This Month
                </Button>
              </WrapItem>
            </Wrap>
          </Box>

          {/* Advanced Filters */}
          <Accordion allowToggle>
            <AccordionItem border="none">
              <AccordionButton
                bg={hoverBg}
                _hover={{ bg: hoverBg }}
                borderRadius="md"
                px={4}
              >
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  <HStack>
                    <FaFilter />
                    <Text>Advanced Filters</Text>
                    {activeFilters.length > 0 && (
                      <Badge colorScheme="blue">{activeFilters.length} active</Badge>
                    )}
                  </HStack>
                </Box>
                <AccordionIcon />
              </AccordionButton>

              <AccordionPanel pb={4} pt={4}>
                <VStack spacing={4} align="stretch">
                  {/* Category Filter */}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Category
                    </FormLabel>
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Modified Time Range */}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Time Range
                    </FormLabel>
                    <Select
                      value={modifiedFilter}
                      onChange={(e) => setModifiedFilter(e.target.value)}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </Select>
                  </FormControl>

                  {/* Toggle Filters */}
                  <VStack spacing={3} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="only-modified" mb="0" fontSize="sm">
                        Show only modified settings
                      </FormLabel>
                      <Switch
                        id="only-modified"
                        isChecked={showOnlyModified}
                        onChange={(e) => setShowOnlyModified(e.target.checked)}
                        colorScheme="blue"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="only-errors" mb="0" fontSize="sm">
                        Show only settings with errors
                      </FormLabel>
                      <Switch
                        id="only-errors"
                        isChecked={showOnlyErrors}
                        onChange={(e) => setShowOnlyErrors(e.target.checked)}
                        colorScheme="red"
                      />
                    </FormControl>
                  </VStack>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          {/* Active Filters Tags */}
          {activeFilters.length > 0 && (
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Active Filters:
              </Text>
              <Wrap spacing={2}>
                {activeFilters.map((filter, index) => (
                  <WrapItem key={index}>
                    <Tag
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      colorScheme={
                        filter.type === 'search' ? 'blue' :
                        filter.type === 'category' ? 'purple' :
                        filter.type === 'modified' ? 'green' :
                        'orange'
                      }
                    >
                      <TagLabel>
                        {filter.type === 'search' && `Search: "${filter.value}"`}
                        {filter.type === 'category' && `Category: ${filter.value}`}
                        {filter.type === 'modified' && `Time: ${filter.value}`}
                        {filter.type === 'onlyModified' && 'Only Modified'}
                        {filter.type === 'onlyErrors' && 'Only Errors'}
                      </TagLabel>
                      <TagCloseButton onClick={() => removeFilter(filter.type)} />
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          )}

          {/* Results Summary */}
          {stats.filtered !== stats.total && (
            <HStack
              p={3}
              bg={resultsBg}
              borderRadius="md"
              justify="space-between"
            >
              <HStack>
                <CheckIcon color="blue.500" />
                <Text fontSize="sm">
                  Showing <strong>{stats.filtered}</strong> of <strong>{stats.total}</strong> settings
                  {stats.filtered === 0 && ' - No matches found'}
                </Text>
              </HStack>
              {stats.filtered === 0 && (
                <Button size="sm" variant="ghost" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              )}
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default SettingsSearchFilter;

import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  SimpleGrid,
  useColorModeValue,
  useDisclosure,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from '@chakra-ui/react';
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UserIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  ChartBarIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import AdvancedSearchModal from '../search/AdvancedSearchModal';
import ReturnToDispatchButton from './ReturnToDispatchButton';

const DispatcherSearch = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const searchCategories = [
    {
      icon: UserIcon,
      title: 'Search by Rider',
      description: 'Find trips by rider name, phone, or ID',
      color: 'purple.500',
      action: () => onOpen()
    },
    {
      icon: TruckIcon,
      title: 'Search by Driver',
      description: 'Find all trips assigned to a specific driver',
      color: 'blue.500',
      action: () => onOpen()
    },
    {
      icon: CalendarDaysIcon,
      title: 'Search by Date',
      description: 'Find trips within a specific date range',
      color: 'green.500',
      action: () => onOpen()
    },
    {
      icon: MapPinIcon,
      title: 'Search by Location',
      description: 'Find trips by pickup or dropoff location',
      color: 'orange.500',
      action: () => onOpen()
    },
    {
      icon: ClockIcon,
      title: 'Search by Status',
      description: 'Filter trips by scheduled, in-progress, or completed',
      color: 'teal.500',
      action: () => onOpen()
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Search',
      description: 'Comprehensive search across all trip history',
      color: 'red.500',
      action: () => onOpen()
    }
  ];

  return (
    <VStack spacing={6} align="stretch">
      {/* Breadcrumb and Return Button */}
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Breadcrumb fontSize={{ base: "sm", md: "md" }}>
          <BreadcrumbItem>
            <BreadcrumbLink display="flex" alignItems="center" gap={2} href="/dispatcher">
              <Box as={HomeIcon} w={4} h={4} />
              Dispatch Control Center
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Trip Search</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <ReturnToDispatchButton size="sm" />
      </HStack>

      {/* Header Card */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardBody textAlign="center" py={8}>
          <VStack spacing={4}>
            <Icon as={MagnifyingGlassIcon} w={16} h={16} color="brand.500" />
            <Heading size="lg">Trip & Ride Search</Heading>
            <Text color={textColor} maxW="2xl" mx="auto">
              Search across the entire ride history including all past, active, and scheduled trips. 
              Use advanced filters to find exactly what you need.
            </Text>
            <Button
              colorScheme="brand"
              size="lg"
              leftIcon={<Icon as={MagnifyingGlassIcon} />}
              onClick={onOpen}
              mt={2}
            >
              Open Advanced Search
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Quick Search Categories */}
      <Box>
        <Heading size="md" mb={4}>Quick Search Options</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {searchCategories.map((category, index) => (
            <Card
              key={index}
              bg={cardBg}
              borderWidth={1}
              borderColor={borderColor}
              cursor="pointer"
              onClick={category.action}
              _hover={{
                bg: hoverBg,
                transform: 'translateY(-2px)',
                shadow: 'md',
                borderColor: category.color
              }}
              transition="all 0.2s"
            >
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack spacing={3}>
                    <Icon as={category.icon} w={6} h={6} color={category.color} />
                    <Heading size="sm">{category.title}</Heading>
                  </HStack>
                  <Text fontSize="sm" color={textColor}>
                    {category.description}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {/* Search Capabilities */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">Search Capabilities</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold" fontSize="sm" color="brand.500">Search By:</Text>
              <Text fontSize="sm">• Rider Name (partial match)</Text>
              <Text fontSize="sm">• Driver Name</Text>
              <Text fontSize="sm">• Trip ID</Text>
              <Text fontSize="sm">• User ID</Text>
              <Text fontSize="sm">• Date Range</Text>
              <Text fontSize="sm">• Pickup Location</Text>
              <Text fontSize="sm">• Dropoff Location</Text>
            </VStack>
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold" fontSize="sm" color="brand.500">Filter By:</Text>
              <Text fontSize="sm">• Trip Status (scheduled, in-progress, completed, cancelled)</Text>
              <Text fontSize="sm">• Vehicle Type (sedan, SUV, van, wheelchair-accessible)</Text>
              <Text fontSize="sm">• Specific Vehicle</Text>
              <Text fontSize="sm">• Recurring vs One-time Trips</Text>
              <Text fontSize="sm">• Time Period (today, this week, all time)</Text>
            </VStack>
          </SimpleGrid>
          <Box mt={6} p={4} bg="blue.50" borderRadius="md">
            <HStack spacing={2}>
              <Icon as={MagnifyingGlassIcon} color="blue.500" />
              <Text fontSize="sm" fontWeight="medium" color="blue.700">
                Pro Tip: Leave filters empty to search across all ride history (past, active, and future)
              </Text>
            </HStack>
          </Box>
        </CardBody>
      </Card>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal isOpen={isOpen} onClose={onClose} />
    </VStack>
  );
};

export default DispatcherSearch;

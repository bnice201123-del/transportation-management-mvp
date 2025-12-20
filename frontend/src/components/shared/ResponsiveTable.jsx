import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  VStack,
  HStack,
  Text,
  useBreakpointValue,
  Badge,
  Divider,
  SimpleGrid
} from '@chakra-ui/react';

/**
 * ResponsiveTable Component
 * 
 * Automatically switches between table view (desktop) and card view (mobile)
 * based on viewport size. Reduces code duplication and improves mobile UX.
 * 
 * Props:
 *   - columns: Array of { key, label, render?, sortable? }
 *   - data: Array of row objects
 *   - getRowKey: Function to get unique key for each row
 *   - renderRow: Function to render card content for mobile
 *   - minW: Minimum width for desktop table
 */
export const ResponsiveTable = ({
  columns,
  data,
  getRowKey,
  renderRow,
  minW = "100%",
  onView,
  onEdit,
  onDelete,
  emptyMessage = "No data found",
  size = "md"
}) => {
  const isDesktop = useBreakpointValue({ base: false, md: true });

  if (!isDesktop) {
    // Mobile: Card View
    return (
      <VStack spacing={4} w="100%">
        {data && data.length === 0 ? (
          <Card w="100%" bg="gray.50">
            <CardBody py={8} textAlign="center">
              <Text color="gray.500">{emptyMessage}</Text>
            </CardBody>
          </Card>
        ) : (
          data?.map((row) => (
            <Card
              key={getRowKey(row)}
              w="100%"
              shadow={{ base: "sm", sm: "md" }}
              borderRadius="lg"
              borderLeft={{ base: "4px solid", md: "6px solid" }}
              borderLeftColor="blue.500"
              bg="white"
              _hover={{
                shadow: { base: "md", sm: "lg" },
                transform: "translateY(-2px)",
                transition: "all 0.2s"
              }}
            >
              <CardBody p={{ base: 3, sm: 4 }} spacing={3}>
                {renderRow(row, { onView, onEdit, onDelete })}
              </CardBody>
            </Card>
          ))
        )}
      </VStack>
    );
  }

  // Desktop: Table View
  return (
    <TableContainer w="100%" overflowX="auto">
      <Table variant="simple" size={size} w={minW}>
        <Thead bg="gray.50">
          <Tr>
            {columns.map((column) => (
              <Th key={column.key} px={{ base: 2, md: 4 }} py={3}>
                {column.label}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data && data.length === 0 ? (
            <Tr>
              <Td colSpan={columns.length} textAlign="center" py={8}>
                <Text color="gray.500">{emptyMessage}</Text>
              </Td>
            </Tr>
          ) : (
            data?.map((row) => (
              <Tr
                key={getRowKey(row)}
                _hover={{ bg: "gray.50" }}
                borderBottomColor="gray.100"
              >
                {columns.map((column) => (
                  <Td key={`${getRowKey(row)}-${column.key}`} px={{ base: 2, md: 4 }} py={3}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </Td>
                ))}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

/**
 * TripCardRow Component
 * Renders a trip as a card on mobile devices
 */
export const TripCardRow = ({ trip, onView, onEdit, onDelete, formatDate, getStatusColor }) => {
  return (
    <VStack align="stretch" spacing={3} w="100%">
      {/* Header Row: Trip ID and Status */}
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing={0} flex={1}>
          <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="600" color="gray.800">
            {trip.tripId?.substring(0, 8)}
          </Text>
          <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.500">
            Trip ID
          </Text>
        </VStack>
        <Badge
          colorScheme={getStatusColor(trip.status)}
          px={{ base: 2, sm: 3 }}
          py={1}
          fontSize={{ base: "xs", sm: "sm" }}
        >
          {trip.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </HStack>

      <Divider />

      {/* Rider Info */}
      <VStack align="start" spacing={1} w="100%">
        <Text fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase">
          Rider
        </Text>
        <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="500">
          {trip.riderName}
        </Text>
        <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.500">
          {trip.riderPhone}
        </Text>
      </VStack>

      {/* Locations */}
      <VStack align="start" spacing={2} w="100%">
        <VStack align="start" spacing={1} w="100%">
          <Text fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase">
            Pickup
          </Text>
          <Text fontSize={{ base: "sm", sm: "md" }}>{trip.pickupLocation?.address}</Text>
        </VStack>
        <VStack align="start" spacing={1} w="100%">
          <Text fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase">
            Dropoff
          </Text>
          <Text fontSize={{ base: "sm", sm: "md" }}>{trip.dropoffLocation?.address}</Text>
        </VStack>
      </VStack>

      {/* Date & Driver */}
      <SimpleGrid columns={2} spacing={3} w="100%" fontSize={{ base: "sm", sm: "md" }}>
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase">
            Scheduled
          </Text>
          <Text fontSize={{ base: "xs", sm: "sm" }}>
            {formatDate(trip.scheduledDate)}
          </Text>
        </VStack>
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase">
            Driver
          </Text>
          <Text fontSize={{ base: "xs", sm: "sm" }}>
            {trip.assignedDriver
              ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}`
              : 'Unassigned'}
          </Text>
        </VStack>
      </SimpleGrid>

      {/* Actions */}
      <HStack spacing={2} w="100%" pt={2}>
        <Box flex={1}>
          <Box
            as="button"
            w="100%"
            px={3}
            py={2}
            bg="blue.50"
            color="blue.600"
            borderRadius="md"
            fontSize={{ base: "xs", sm: "sm" }}
            fontWeight="600"
            minH="44px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            _hover={{ bg: "blue.100" }}
            _active={{ bg: "blue.200" }}
            onClick={() => onView(trip)}
          >
            View
          </Box>
        </Box>
        <Box flex={1}>
          <Box
            as="button"
            w="100%"
            px={3}
            py={2}
            bg="gray.100"
            color="gray.700"
            borderRadius="md"
            fontSize={{ base: "xs", sm: "sm" }}
            fontWeight="600"
            minH="44px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            _hover={{ bg: "gray.200" }}
            _active={{ bg: "gray.300" }}
            onClick={() => onEdit(trip)}
          >
            Edit
          </Box>
        </Box>
        <Box flex={1}>
          <Box
            as="button"
            w="100%"
            px={3}
            py={2}
            bg="red.50"
            color="red.600"
            borderRadius="md"
            fontSize={{ base: "xs", sm: "sm" }}
            fontWeight="600"
            minH="44px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            _hover={{ bg: "red.100" }}
            _active={{ bg: "red.200" }}
            onClick={() => onDelete(trip)}
          >
            Delete
          </Box>
        </Box>
      </HStack>
    </VStack>
  );
};

export default ResponsiveTable;

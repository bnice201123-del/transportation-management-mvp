import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  useToast,
  Select,
  Alert,
  AlertIcon,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Spinner,
  Center,
  useColorModeValue,
  Code,
  Flex,
  Divider,
  IconButton,
  Tooltip,
  SimpleGrid
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';
import { FaExchangeAlt, FaArrowRight, FaArrowLeft, FaEquals } from 'react-icons/fa';
import axios from 'axios';

const SettingsComparison = ({ currentSettings }) => {
  const [versions, setVersions] = useState([]);
  const [version1, setVersion1] = useState(null);
  const [version2, setVersion2] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'inline'
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const addedBg = useColorModeValue('green.50', 'green.900');
  const removedBg = useColorModeValue('red.50', 'red.900');
  const modifiedBg = useColorModeValue('orange.50', 'orange.900');
  const unchangedBg = useColorModeValue('gray.50', 'gray.700');

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/settings/versions');
      if (response.data) {
        setVersions(response.data);
        // Auto-select latest two versions for comparison
        if (response.data.length >= 2) {
          setVersion1(response.data[0]);
          setVersion2(response.data[1]);
          compareVersions(response.data[0], response.data[1]);
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      // Load from localStorage as fallback
      const saved = localStorage.getItem('settingsVersions');
      if (saved) {
        const parsedVersions = JSON.parse(saved);
        setVersions(parsedVersions);
        if (parsedVersions.length >= 2) {
          setVersion1(parsedVersions[0]);
          setVersion2(parsedVersions[1]);
          compareVersions(parsedVersions[0], parsedVersions[1]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const compareVersions = (v1, v2) => {
    if (!v1 || !v2) return;

    setComparing(true);
    try {
      const changes = calculateDiff(v1.settings, v2.settings);
      setComparison({
        version1: v1,
        version2: v2,
        changes,
        totalChanges: changes.length,
        summary: {
          added: changes.filter(c => c.type === 'added').length,
          removed: changes.filter(c => c.type === 'removed').length,
          modified: changes.filter(c => c.type === 'modified').length,
          unchanged: changes.filter(c => c.type === 'unchanged').length
        }
      });
    } catch (error) {
      console.error('Error comparing versions:', error);
      toast({
        title: 'Comparison Failed',
        description: 'Failed to compare versions. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setComparing(false);
    }
  };

  const calculateDiff = (settings1, settings2) => {
    const changes = [];
    const allCategories = new Set([
      ...Object.keys(settings1 || {}),
      ...Object.keys(settings2 || {})
    ]);

    allCategories.forEach(category => {
      const cat1 = settings1?.[category] || {};
      const cat2 = settings2?.[category] || {};
      const allKeys = new Set([
        ...Object.keys(cat1),
        ...Object.keys(cat2)
      ]);

      allKeys.forEach(key => {
        const val1 = cat1[key];
        const val2 = cat2[key];
        const val1Str = JSON.stringify(val1);
        const val2Str = JSON.stringify(val2);

        let type;
        if (val1 === undefined) {
          type = 'added';
        } else if (val2 === undefined) {
          type = 'removed';
        } else if (val1Str === val2Str) {
          type = 'unchanged';
        } else {
          type = 'modified';
        }

        changes.push({
          category,
          key,
          value1: val1,
          value2: val2,
          type
        });
      });
    });

    // Sort: modified first, then added, then removed, then unchanged
    const sortOrder = { modified: 0, added: 1, removed: 2, unchanged: 3 };
    changes.sort((a, b) => {
      if (sortOrder[a.type] !== sortOrder[b.type]) {
        return sortOrder[a.type] - sortOrder[b.type];
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.key.localeCompare(b.key);
    });

    return changes;
  };

  const formatValue = (value) => {
    if (value === undefined) return '(not set)';
    if (value === null) return '(null)';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'added':
        return 'green';
      case 'removed':
        return 'red';
      case 'modified':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getChangeBg = (type) => {
    switch (type) {
      case 'added':
        return addedBg;
      case 'removed':
        return removedBg;
      case 'modified':
        return modifiedBg;
      default:
        return unchangedBg;
    }
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'added':
        return CheckCircleIcon;
      case 'removed':
        return WarningIcon;
      case 'modified':
        return InfoIcon;
      default:
        return FaEquals;
    }
  };

  const swapVersions = () => {
    const temp = version1;
    setVersion1(version2);
    setVersion2(temp);
    if (version1 && version2) {
      compareVersions(version2, version1);
    }
  };

  const handleCompare = () => {
    if (version1 && version2) {
      if (version1.id === version2.id) {
        toast({
          title: 'Same Version',
          description: 'Please select two different versions to compare',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      compareVersions(version1, version2);
    }
  };

  if (loading) {
    return (
      <Center p={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading versions...</Text>
        </VStack>
      </Center>
    );
  }

  if (versions.length < 2) {
    return (
      <Box>
        <Alert status="info">
          <AlertIcon />
          <AlertDescription>
            You need at least 2 versions to compare. Make some changes to your settings to create more versions.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md" mb={2}>Settings Comparison</Heading>
          <Text fontSize="sm" color="gray.600">
            Compare two versions side-by-side to see what changed
          </Text>
        </Box>

        {/* Version Selectors */}
        <Card borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {/* Version 1 Selector */}
                <Box>
                  <Text fontWeight="medium" mb={2}>Version 1 (Left/Before)</Text>
                  <Select
                    value={version1?.id || ''}
                    onChange={(e) => {
                      const selected = versions.find(v => v.id === parseInt(e.target.value));
                      setVersion1(selected);
                    }}
                  >
                    <option value="">Select version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {new Date(v.timestamp).toLocaleString()} - {v.description}
                      </option>
                    ))}
                  </Select>
                  {version1 && (
                    <HStack mt={2} spacing={2}>
                      <Badge colorScheme="blue">{version1.user}</Badge>
                      <Text fontSize="xs" color="gray.600">
                        {new Date(version1.timestamp).toLocaleString()}
                      </Text>
                    </HStack>
                  )}
                </Box>

                {/* Version 2 Selector */}
                <Box>
                  <Text fontWeight="medium" mb={2}>Version 2 (Right/After)</Text>
                  <Select
                    value={version2?.id || ''}
                    onChange={(e) => {
                      const selected = versions.find(v => v.id === parseInt(e.target.value));
                      setVersion2(selected);
                    }}
                  >
                    <option value="">Select version...</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {new Date(v.timestamp).toLocaleString()} - {v.description}
                      </option>
                    ))}
                  </Select>
                  {version2 && (
                    <HStack mt={2} spacing={2}>
                      <Badge colorScheme="blue">{version2.user}</Badge>
                      <Text fontSize="xs" color="gray.600">
                        {new Date(version2.timestamp).toLocaleString()}
                      </Text>
                    </HStack>
                  )}
                </Box>
              </SimpleGrid>

              <HStack spacing={4}>
                <Button
                  colorScheme="blue"
                  onClick={handleCompare}
                  isLoading={comparing}
                  leftIcon={<Icon as={FaExchangeAlt} />}
                  isDisabled={!version1 || !version2}
                >
                  Compare Versions
                </Button>
                <Tooltip label="Swap versions">
                  <IconButton
                    icon={<Icon as={FaExchangeAlt} />}
                    onClick={swapVersions}
                    isDisabled={!version1 || !version2}
                    aria-label="Swap versions"
                  />
                </Tooltip>
                <Select
                  maxW="200px"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                >
                  <option value="side-by-side">Side-by-Side</option>
                  <option value="inline">Inline</option>
                </Select>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Comparison Results */}
        {comparison && (
          <>
            {/* Summary */}
            <Card borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Heading size="sm" mb={4}>Comparison Summary</Heading>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Box textAlign="center" p={4} bg={modifiedBg} borderRadius="md">
                    <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                      {comparison.summary.modified}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Modified</Text>
                  </Box>
                  <Box textAlign="center" p={4} bg={addedBg} borderRadius="md">
                    <Text fontSize="3xl" fontWeight="bold" color="green.500">
                      {comparison.summary.added}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Added</Text>
                  </Box>
                  <Box textAlign="center" p={4} bg={removedBg} borderRadius="md">
                    <Text fontSize="3xl" fontWeight="bold" color="red.500">
                      {comparison.summary.removed}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Removed</Text>
                  </Box>
                  <Box textAlign="center" p={4} bg={unchangedBg} borderRadius="md">
                    <Text fontSize="3xl" fontWeight="bold" color="gray.500">
                      {comparison.summary.unchanged}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Unchanged</Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Detailed Changes */}
            <Card borderWidth={1} borderColor={borderColor}>
              <CardBody p={0}>
                <Box p={4} borderBottomWidth={1} borderColor={borderColor}>
                  <Heading size="sm">
                    Detailed Changes ({comparison.changes.filter(c => c.type !== 'unchanged').length})
                  </Heading>
                </Box>

                {viewMode === 'side-by-side' ? (
                  // Side-by-Side View
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead position="sticky" top={0} bg={bgColor} zIndex={1}>
                        <Tr>
                          <Th>Category</Th>
                          <Th>Setting</Th>
                          <Th>
                            <HStack>
                              <Icon as={FaArrowLeft} boxSize={3} />
                              <Text>Version 1</Text>
                            </HStack>
                          </Th>
                          <Th>
                            <HStack>
                              <Icon as={FaArrowRight} boxSize={3} />
                              <Text>Version 2</Text>
                            </HStack>
                          </Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {comparison.changes
                          .filter(change => change.type !== 'unchanged')
                          .map((change, index) => (
                            <Tr key={index} bg={getChangeBg(change.type)}>
                              <Td>
                                <Code fontSize="xs" colorScheme="gray">
                                  {change.category}
                                </Code>
                              </Td>
                              <Td>
                                <Text fontSize="sm" fontWeight="medium">
                                  {change.key}
                                </Text>
                              </Td>
                              <Td maxW="300px">
                                <Code 
                                  fontSize="xs" 
                                  colorScheme={change.type === 'removed' ? 'red' : 'gray'}
                                  textDecoration={change.type === 'removed' ? 'line-through' : 'none'}
                                  whiteSpace="pre-wrap"
                                  wordBreak="break-word"
                                >
                                  {formatValue(change.value1)}
                                </Code>
                              </Td>
                              <Td maxW="300px">
                                <Code 
                                  fontSize="xs" 
                                  colorScheme={change.type === 'added' ? 'green' : 'gray'}
                                  fontWeight={change.type === 'added' ? 'bold' : 'normal'}
                                  whiteSpace="pre-wrap"
                                  wordBreak="break-word"
                                >
                                  {formatValue(change.value2)}
                                </Code>
                              </Td>
                              <Td>
                                <Badge 
                                  colorScheme={getChangeColor(change.type)}
                                  leftIcon={<Icon as={getChangeIcon(change.type)} />}
                                >
                                  {change.type}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  // Inline View
                  <VStack spacing={0} align="stretch">
                    {comparison.changes
                      .filter(change => change.type !== 'unchanged')
                      .map((change, index) => (
                        <Box 
                          key={index} 
                          p={4} 
                          borderBottomWidth={1}
                          borderColor={borderColor}
                          bg={getChangeBg(change.type)}
                        >
                          <VStack align="stretch" spacing={2}>
                            <HStack justify="space-between">
                              <HStack>
                                <Code fontSize="xs" colorScheme="gray">
                                  {change.category}
                                </Code>
                                <Icon as={FaArrowRight} boxSize={3} color="gray.500" />
                                <Text fontSize="sm" fontWeight="bold">
                                  {change.key}
                                </Text>
                              </HStack>
                              <Badge colorScheme={getChangeColor(change.type)}>
                                {change.type}
                              </Badge>
                            </HStack>

                            {change.type === 'modified' && (
                              <>
                                <Box>
                                  <Text fontSize="xs" color="gray.600" mb={1}>
                                    Version 1 (Before):
                                  </Text>
                                  <Code 
                                    display="block"
                                    p={2}
                                    fontSize="xs"
                                    colorScheme="red"
                                    textDecoration="line-through"
                                    whiteSpace="pre-wrap"
                                    wordBreak="break-word"
                                  >
                                    {formatValue(change.value1)}
                                  </Code>
                                </Box>
                                <Icon as={FaArrowRight} color="gray.500" />
                                <Box>
                                  <Text fontSize="xs" color="gray.600" mb={1}>
                                    Version 2 (After):
                                  </Text>
                                  <Code 
                                    display="block"
                                    p={2}
                                    fontSize="xs"
                                    colorScheme="green"
                                    fontWeight="bold"
                                    whiteSpace="pre-wrap"
                                    wordBreak="break-word"
                                  >
                                    {formatValue(change.value2)}
                                  </Code>
                                </Box>
                              </>
                            )}

                            {change.type === 'added' && (
                              <Box>
                                <Text fontSize="xs" color="gray.600" mb={1}>
                                  Added in Version 2:
                                </Text>
                                <Code 
                                  display="block"
                                  p={2}
                                  fontSize="xs"
                                  colorScheme="green"
                                  fontWeight="bold"
                                  whiteSpace="pre-wrap"
                                  wordBreak="break-word"
                                >
                                  {formatValue(change.value2)}
                                </Code>
                              </Box>
                            )}

                            {change.type === 'removed' && (
                              <Box>
                                <Text fontSize="xs" color="gray.600" mb={1}>
                                  Removed from Version 1:
                                </Text>
                                <Code 
                                  display="block"
                                  p={2}
                                  fontSize="xs"
                                  colorScheme="red"
                                  textDecoration="line-through"
                                  whiteSpace="pre-wrap"
                                  wordBreak="break-word"
                                >
                                  {formatValue(change.value1)}
                                </Code>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      ))}
                  </VStack>
                )}

                {comparison.changes.filter(c => c.type !== 'unchanged').length === 0 && (
                  <Box p={10} textAlign="center">
                    <Icon as={FaEquals} boxSize={12} color="gray.400" mb={4} />
                    <Heading size="md" color="gray.500" mb={2}>
                      No Differences Found
                    </Heading>
                    <Text color="gray.600">
                      These two versions have identical settings
                    </Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </>
        )}

        {!comparison && !comparing && version1 && version2 && (
          <Alert status="info">
            <AlertIcon />
            <AlertDescription>
              Click "Compare Versions" to see the differences between the selected versions
            </AlertDescription>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default SettingsComparison;

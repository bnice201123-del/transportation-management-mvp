import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  Icon,
  Flex,
  Spinner,
  Center,
  useToast,
  Divider,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  RadioGroup,
  Radio,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Wrap,
  WrapItem,
  IconButton,
  Tooltip,
  Switch,
  useBreakpointValue,
  useColorModeValue,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import {
  DownloadIcon,
  CalendarIcon,
  ViewIcon,
  SettingsIcon,
  TimeIcon,
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  InfoIcon,
  RepeatIcon,
  EmailIcon,
  CopyIcon
} from '@chakra-ui/icons';
import { 
  FaFileExport,
  FaFilePdf, 
  FaFileExcel,
  FaFileCsv,
  FaChartBar,
  FaChartPie,
  FaChartLine,
  FaClock,
  FaCalendarAlt,
  FaFilter,
  FaUsers,
  FaCar,
  FaRoute,
  FaMoneyBillWave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync
} from 'react-icons/fa';
import Navbar from '../shared/Navbar';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  // Responsive values
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const cardPadding = useBreakpointValue({ base: 3, md: 4, lg: 6 });
  const headerDirection = useBreakpointValue({ base: 'column', md: 'row' });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const spacing = useBreakpointValue({ base: 3, md: 4, lg: 6 });
  const headingSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const fontSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const iconSize = useBreakpointValue({ base: 6, md: 8 });
  const cardFontSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const cardDescSize = useBreakpointValue({ base: 'xs', md: 'sm' });
  const statNumberSize = useBreakpointValue({ base: 'lg', md: 'xl' });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Modal states
  const { isOpen: isGenerateOpen, onOpen: onGenerateOpen, onClose: onGenerateClose } = useDisclosure();
  const { isOpen: isScheduleOpen, onOpen: onScheduleOpen, onClose: onScheduleClose } = useDisclosure();
  const { isOpen: isCustomOpen, onOpen: onCustomOpen, onClose: onCustomClose } = useDisclosure();

  // Form states
  const [reportConfig, setReportConfig] = useState({
    type: 'trip_analytics',
    format: 'pdf',
    dateRange: '30d',
    customStartDate: '',
    customEndDate: '',
    includeCharts: true,
    includeSummary: true,
    filters: {}
  });

  const [scheduleConfig, setScheduleConfig] = useState({
    name: '',
    description: '',
    frequency: 'weekly',
    dayOfWeek: '1',
    time: '09:00',
    recipients: '',
    reportType: 'trip_analytics',
    format: 'pdf',
    active: true
  });

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate fetching reports history
      const mockReports = [
        {
          id: 1,
          name: 'Monthly Trip Analytics',
          type: 'trip_analytics',
          format: 'pdf',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          size: '2.4 MB',
          downloadUrl: '/reports/monthly-trip-analytics.pdf'
        },
        {
          id: 2,
          name: 'User Activity Report',
          type: 'user_activity',
          format: 'excel',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          status: 'completed',
          size: '1.8 MB',
          downloadUrl: '/reports/user-activity-report.xlsx'
        },
        {
          id: 3,
          name: 'Financial Summary',
          type: 'financial',
          format: 'csv',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          status: 'completed',
          size: '876 KB',
          downloadUrl: '/reports/financial-summary.csv'
        },
        {
          id: 4,
          name: 'Driver Performance Report',
          type: 'driver_performance',
          format: 'pdf',
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          status: 'generating',
          size: 'Pending...',
          downloadUrl: null
        }
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error loading reports',
        description: 'Failed to load reports history',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchScheduledReports = useCallback(async () => {
    try {
      const mockScheduledReports = [
        {
          id: 1,
          name: 'Weekly Operations Summary',
          description: 'Comprehensive weekly report for operations team',
          frequency: 'weekly',
          dayOfWeek: '1',
          time: '09:00',
          recipients: 'ops@company.com, manager@company.com',
          reportType: 'trip_analytics',
          format: 'pdf',
          active: true,
          lastRun: new Date(Date.now() - 604800000).toISOString(),
          nextRun: new Date(Date.now() + 86400000).toISOString()
        },
        {
          id: 2,
          name: 'Monthly Financial Report',
          description: 'Monthly financial performance and cost analysis',
          frequency: 'monthly',
          dayOfMonth: '1',
          time: '08:00',
          recipients: 'finance@company.com',
          reportType: 'financial',
          format: 'excel',
          active: true,
          lastRun: new Date(Date.now() - 2592000000).toISOString(),
          nextRun: new Date(Date.now() + 2505600000).toISOString()
        }
      ];
      setScheduledReports(mockScheduledReports);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchScheduledReports();
  }, [fetchReports, fetchScheduledReports]);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport = {
        id: reports.length + 1,
        name: getReportTypeName(reportConfig.type),
        type: reportConfig.type,
        format: reportConfig.format,
        createdAt: new Date().toISOString(),
        status: 'completed',
        size: '1.2 MB',
        downloadUrl: `/reports/${reportConfig.type}.${reportConfig.format}`
      };

      setReports(prev => [newReport, ...prev]);
      onGenerateClose();
      
      toast({
        title: 'Report Generated',
        description: `${newReport.name} has been generated successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate report. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleScheduleReport = async () => {
    try {
      const newScheduledReport = {
        id: scheduledReports.length + 1,
        ...scheduleConfig,
        lastRun: null,
        nextRun: calculateNextRun(scheduleConfig.frequency, scheduleConfig.dayOfWeek, scheduleConfig.time)
      };

      setScheduledReports(prev => [...prev, newScheduledReport]);
      onScheduleClose();
      
      toast({
        title: 'Report Scheduled',
        description: `${scheduleConfig.name} has been scheduled successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Scheduling Failed',
        description: 'Failed to schedule report. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDownloadReport = (report) => {
    if (report.status === 'completed' && report.downloadUrl) {
      toast({
        title: 'Download Started',
        description: `Downloading ${report.name}...`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteScheduledReport = (reportId) => {
    setScheduledReports(prev => prev.filter(r => r.id !== reportId));
    toast({
      title: 'Report Deleted',
      description: 'Scheduled report has been deleted',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const toggleReportStatus = (reportId) => {
    setScheduledReports(prev => 
      prev.map(r => 
        r.id === reportId ? { ...r, active: !r.active } : r
      )
    );
  };

  const getReportTypeName = (type) => {
    const names = {
      trip_analytics: 'Trip Analytics Report',
      user_activity: 'User Activity Report',
      financial: 'Financial Summary Report',
      driver_performance: 'Driver Performance Report',
      vehicle_utilization: 'Vehicle Utilization Report',
      system_performance: 'System Performance Report',
      audit_log: 'Audit Log Report',
      custom: 'Custom Report'
    };
    return names[type] || 'Unknown Report';
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return FaFilePdf;
      case 'excel': return FaFileExcel;
      case 'csv': return FaFileCsv;
      default: return FaFileExport;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'generating': return 'orange';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const calculateNextRun = (frequency, dayOfWeek, time) => {
    const now = new Date();
    const nextRun = new Date();
    
    if (frequency === 'daily') {
      nextRun.setDate(now.getDate() + 1);
    } else if (frequency === 'weekly') {
      const daysUntilNext = (parseInt(dayOfWeek) - now.getDay() + 7) % 7;
      nextRun.setDate(now.getDate() + (daysUntilNext || 7));
    } else if (frequency === 'monthly') {
      nextRun.setMonth(now.getMonth() + 1);
      nextRun.setDate(1);
    }
    
    const [hours, minutes] = time.split(':');
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return nextRun.toISOString();
  };

  const QuickReportCard = ({ title, description, icon, type, color }) => (
    <Card 
      cursor="pointer" 
      _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} 
      transition="all 0.2s"
      bg={cardBg}
      borderColor={borderColor}
      h="full"
    >
      <CardBody p={cardPadding}>
        <VStack spacing={spacing} h="full">
          <Icon as={icon} boxSize={iconSize} color={color} />
          <Text 
            fontWeight="bold" 
            textAlign="center" 
            fontSize={cardFontSize}
            noOfLines={1}
          >
            {title}
          </Text>
          <Text 
            fontSize={cardDescSize} 
            color="gray.600" 
            textAlign="center"
            noOfLines={2}
            flex="1"
          >
            {description}
          </Text>
          <Button 
            size={buttonSize} 
            colorScheme="blue" 
            leftIcon={isMobile ? undefined : <DownloadIcon />}
            onClick={() => {
              setReportConfig(prev => ({ ...prev, type }));
              onGenerateOpen();
            }}
            w={isMobile ? "full" : "auto"}
          >
            Generate
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Navbar />
        <Center flex="1">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading reports...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bg={bgColor}>
      <Navbar />
      <Box flex="1" p={cardPadding}>
        <Container maxW="7xl">
          <VStack align="stretch" spacing={spacing}>
            {/* Header */}
            <Flex 
              justify="space-between" 
              align={isMobile ? "start" : "center"} 
              direction={headerDirection}
              gap={4}
              bg={cardBg}
              p={cardPadding}
              borderRadius="lg"
              shadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Box>
                <Heading size={headingSize} mb={2}>
                  Reports Center
                </Heading>
                <Text color="gray.600" fontSize={fontSize}>
                  Generate, schedule, and manage system reports
                </Text>
              </Box>
              
              {/* Mobile Menu Button */}
              {isMobile ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<SettingsIcon />}
                    colorScheme="blue"
                    size={buttonSize}
                    w="full"
                  >
                    Report Actions
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<AddIcon />} onClick={onGenerateOpen}>
                      Generate Report
                    </MenuItem>
                    <MenuItem icon={<CalendarIcon />} onClick={onScheduleOpen}>
                      Schedule Report
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem icon={<SettingsIcon />} onClick={onCustomOpen}>
                      Custom Report
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <HStack spacing={3}>
                  <Button 
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    size={buttonSize}
                    onClick={onGenerateOpen}
                  >
                    Generate Report
                  </Button>
                  <Button 
                    leftIcon={<CalendarIcon />}
                    variant="outline"
                    size={buttonSize}
                    onClick={onScheduleOpen}
                  >
                    Schedule Report
                  </Button>
                  <Button 
                    leftIcon={<SettingsIcon />}
                    variant="outline"
                    size={buttonSize}
                    onClick={onCustomOpen}
                  >
                    Custom Report
                  </Button>
                </HStack>
              )}
            </Flex>

            {/* Stats Overview */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <StatGroup>
                  <Stat>
                    <StatLabel>Total Reports</StatLabel>
                    <StatNumber fontSize={statNumberSize}>
                      {reports.length}
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      12% this month
                    </StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Scheduled Reports</StatLabel>
                    <StatNumber fontSize={statNumberSize}>
                      {scheduledReports.filter(r => r.active).length}
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Active automations
                    </StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>This Week</StatLabel>
                    <StatNumber fontSize={statNumberSize}>
                      {reports.filter(r => 
                        new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length}
                    </StatNumber>
                    <StatHelpText>
                      Reports generated
                    </StatHelpText>
                  </Stat>
                </StatGroup>
              </CardBody>
            </Card>

            {/* Quick Reports */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader pb={2}>
                <Heading size="md">Quick Reports</Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Generate common reports with one click
                </Text>
              </CardHeader>
              <CardBody pt={2}>
                <SimpleGrid 
                  columns={{ base: 1, sm: 2, lg: 4 }} 
                  spacing={spacing}
                  minChildWidth={isMobile ? "none" : "200px"}
                >
                  <QuickReportCard
                    title="Trip Analytics"
                    description="Comprehensive trip performance and statistics"
                    icon={FaChartLine}
                    type="trip_analytics"
                    color="blue.500"
                  />
                  <QuickReportCard
                    title="User Activity"
                    description="User engagement and behavior analysis"
                    icon={FaUsers}
                    type="user_activity"
                    color="green.500"
                  />
                  <QuickReportCard
                    title="Financial Summary"
                    description="Revenue, costs, and financial performance"
                    icon={FaMoneyBillWave}
                    type="financial"
                    color="purple.500"
                  />
                  <QuickReportCard
                    title="Driver Performance"
                    description="Driver ratings, efficiency, and metrics"
                    icon={FaCar}
                    type="driver_performance"
                    color="orange.500"
                  />
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Main Content Tabs */}
            <Card bg={cardBg} borderColor={borderColor}>
              <Tabs 
                variant="enclosed" 
                colorScheme="blue" 
                orientation={isMobile ? "horizontal" : "horizontal"}
                isFitted={isMobile}
              >
                <TabList flexDirection={isMobile ? "column" : "row"} mb={4}>
                  <Tab fontSize={fontSize} p={isMobile ? 2 : 4}>
                    Recent Reports
                  </Tab>
                  <Tab fontSize={fontSize} p={isMobile ? 2 : 4}>
                    Scheduled Reports
                  </Tab>
                  <Tab fontSize={fontSize} p={isMobile ? 2 : 4}>
                    Report Templates
                  </Tab>
                </TabList>

              <TabPanels>
                {/* Recent Reports */}
                <TabPanel p={cardPadding} pt={6}>
                  <Box>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="md">Report History</Heading>
                      <Button size={buttonSize} leftIcon={<RepeatIcon />} onClick={fetchReports}>
                        Refresh
                      </Button>
                    </Flex>
                    
                    {isMobile ? (
                      // Mobile Card Layout
                      <VStack spacing={3} align="stretch">
                        {reports.map((report) => (
                          <Card key={report.id} variant="outline" size="sm">
                            <CardBody>
                              <VStack spacing={3} align="stretch">
                                <Flex justify="space-between" align="start">
                                  <HStack spacing={2} flex="1">
                                    <Icon 
                                      as={getFormatIcon(report.format)} 
                                      color="blue.500" 
                                      boxSize={5} 
                                    />
                                    <VStack align="start" spacing={1} flex="1">
                                      <Text 
                                        fontWeight="bold" 
                                        fontSize="sm"
                                        noOfLines={1}
                                      >
                                        {report.name}
                                      </Text>
                                      <HStack spacing={2}>
                                        <Badge 
                                          variant="outline" 
                                          size="sm"
                                          fontSize="xs"
                                        >
                                          {report.type.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                        <Text fontSize="xs" color="gray.500">
                                          {report.format.toUpperCase()}
                                        </Text>
                                      </HStack>
                                    </VStack>
                                  </HStack>
                                  <Badge 
                                    colorScheme={getStatusColor(report.status)}
                                    size="sm"
                                  >
                                    {report.status}
                                  </Badge>
                                </Flex>
                                
                                <Flex justify="space-between" align="center">
                                  <VStack align="start" spacing={1}>
                                    <Text fontSize="xs" color="gray.500">
                                      {new Date(report.createdAt).toLocaleDateString()}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {report.size}
                                    </Text>
                                  </VStack>
                                  
                                  <HStack spacing={1}>
                                    {report.status === 'completed' && (
                                      <IconButton
                                        size="sm"
                                        icon={<DownloadIcon />}
                                        onClick={() => handleDownloadReport(report)}
                                        colorScheme="blue"
                                        variant="ghost"
                                        aria-label="Download Report"
                                      />
                                    )}
                                    <IconButton
                                      size="sm"
                                      icon={<ViewIcon />}
                                      colorScheme="gray"
                                      variant="ghost"
                                      aria-label="View Details"
                                    />
                                  </HStack>
                                </Flex>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    ) : (
                      // Desktop Table Layout
                      <TableContainer>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Report Name</Th>
                              <Th>Type</Th>
                              <Th>Format</Th>
                              <Th>Created</Th>
                              <Th>Status</Th>
                              <Th>Size</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {reports.map((report) => (
                              <Tr key={report.id}>
                                <Td>
                                  <HStack>
                                    <Icon as={getFormatIcon(report.format)} color="blue.500" />
                                    <Text>{report.name}</Text>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Badge variant="outline">
                                    {report.type.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </Td>
                                <Td>{report.format.toUpperCase()}</Td>
                                <Td>{new Date(report.createdAt).toLocaleDateString()}</Td>
                                <Td>
                                  <Badge colorScheme={getStatusColor(report.status)}>
                                    {report.status}
                                  </Badge>
                                </Td>
                                <Td>{report.size}</Td>
                                <Td>
                                  <HStack spacing={1}>
                                    {report.status === 'completed' && (
                                      <Tooltip label="Download Report">
                                        <IconButton
                                          size="sm"
                                          icon={<DownloadIcon />}
                                          onClick={() => handleDownloadReport(report)}
                                          colorScheme="blue"
                                          variant="ghost"
                                        />
                                      </Tooltip>
                                    )}
                                    <Tooltip label="View Details">
                                      <IconButton
                                        size="sm"
                                        icon={<ViewIcon />}
                                        colorScheme="gray"
                                        variant="ghost"
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </TabPanel>

                {/* Scheduled Reports */}
                <TabPanel p={cardPadding} pt={6}>
                  <Box>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="md">Scheduled Reports</Heading>
                      <Button 
                        size={buttonSize} 
                        leftIcon={isMobile ? undefined : <AddIcon />} 
                        colorScheme="blue"
                        onClick={onScheduleOpen}
                      >
                        {isMobile ? "Add" : "Add Schedule"}
                      </Button>
                    </Flex>
                    
                    <VStack spacing={spacing} align="stretch">
                      {scheduledReports.map((schedule) => (
                        <Card key={schedule.id} variant="outline">
                          <CardBody p={cardPadding}>
                            {isMobile ? (
                              // Mobile Layout
                              <VStack spacing={3} align="stretch">
                                <Flex justify="space-between" align="center">
                                  <VStack align="start" spacing={1} flex="1">
                                    <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                                      {schedule.name}
                                    </Text>
                                    <Badge 
                                      colorScheme={schedule.active ? 'green' : 'gray'}
                                      size="sm"
                                    >
                                      {schedule.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </VStack>
                                  <Switch 
                                    size="sm"
                                    isChecked={schedule.active}
                                    onChange={() => toggleReportStatus(schedule.id)}
                                  />
                                </Flex>
                                
                                <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                  {schedule.description}
                                </Text>
                                
                                <VStack spacing={2} align="start">
                                  <HStack spacing={3}>
                                    <Text fontSize="xs">
                                      <Text as="span" fontWeight="bold">Frequency:</Text> {schedule.frequency}
                                    </Text>
                                    <Text fontSize="xs">
                                      <Text as="span" fontWeight="bold">Format:</Text> {schedule.format.toUpperCase()}
                                    </Text>
                                  </HStack>
                                  
                                  <Text fontSize="xs" noOfLines={1}>
                                    <Text as="span" fontWeight="bold">Recipients:</Text> {schedule.recipients}
                                  </Text>
                                  
                                  <HStack spacing={3} fontSize="xs" color="gray.500">
                                    {schedule.lastRun && (
                                      <Text>
                                        Last: {new Date(schedule.lastRun).toLocaleDateString()}
                                      </Text>
                                    )}
                                    <Text>
                                      Next: {new Date(schedule.nextRun).toLocaleDateString()}
                                    </Text>
                                  </HStack>
                                </VStack>
                                
                                <HStack justify="end" spacing={1}>
                                  <IconButton
                                    size="sm"
                                    icon={<EditIcon />}
                                    colorScheme="blue"
                                    variant="ghost"
                                    aria-label="Edit Schedule"
                                  />
                                  <IconButton
                                    size="sm"
                                    icon={<FaSync />}
                                    colorScheme="green"
                                    variant="ghost"
                                    aria-label="Run Now"
                                  />
                                  <IconButton
                                    size="sm"
                                    icon={<DeleteIcon />}
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => handleDeleteScheduledReport(schedule.id)}
                                    aria-label="Delete Schedule"
                                  />
                                </HStack>
                              </VStack>
                            ) : (
                              // Desktop Layout
                              <Flex justify="space-between" align="start">
                                <VStack align="start" spacing={2} flex="1">
                                  <HStack>
                                    <Text fontWeight="bold">{schedule.name}</Text>
                                    <Badge colorScheme={schedule.active ? 'green' : 'gray'}>
                                      {schedule.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    {schedule.description}
                                  </Text>
                                  <HStack spacing={4} fontSize="sm">
                                    <Text>
                                      <strong>Frequency:</strong> {schedule.frequency}
                                    </Text>
                                    <Text>
                                      <strong>Format:</strong> {schedule.format.toUpperCase()}
                                    </Text>
                                    <Text>
                                      <strong>Recipients:</strong> {schedule.recipients}
                                    </Text>
                                  </HStack>
                                  <HStack spacing={4} fontSize="sm" color="gray.500">
                                    {schedule.lastRun && (
                                      <Text>
                                        Last run: {new Date(schedule.lastRun).toLocaleDateString()}
                                      </Text>
                                    )}
                                    <Text>
                                      Next run: {new Date(schedule.nextRun).toLocaleDateString()}
                                    </Text>
                                  </HStack>
                                </VStack>
                                <VStack spacing={2}>
                                  <Switch 
                                    isChecked={schedule.active}
                                    onChange={() => toggleReportStatus(schedule.id)}
                                  />
                                  <HStack>
                                    <Tooltip label="Edit Schedule">
                                      <IconButton
                                        size="sm"
                                        icon={<EditIcon />}
                                        colorScheme="blue"
                                        variant="ghost"
                                      />
                                    </Tooltip>
                                    <Tooltip label="Run Now">
                                      <IconButton
                                        size="sm"
                                        icon={<FaSync />}
                                        colorScheme="green"
                                        variant="ghost"
                                      />
                                    </Tooltip>
                                    <Tooltip label="Delete Schedule">
                                      <IconButton
                                        size="sm"
                                        icon={<DeleteIcon />}
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => handleDeleteScheduledReport(schedule.id)}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </VStack>
                              </Flex>
                            )}
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </Box>
                </TabPanel>

                {/* Report Templates */}
                <TabPanel p={cardPadding} pt={6}>
                  <Box>
                    <Heading size="md" mb={4}>Report Templates</Heading>
                    <Text fontSize="sm" color="gray.600" mb={6}>
                      Pre-configured report templates for common use cases
                    </Text>
                    
                    <SimpleGrid 
                      columns={{ base: 1, md: 2, lg: 3 }} 
                      spacing={spacing}
                      minChildWidth={isMobile ? "none" : "250px"}
                    >
                      <Card bg={cardBg} borderColor={borderColor} h="full">
                        <CardBody p={cardPadding}>
                          <VStack spacing={spacing} h="full">
                            <Icon as={FaChartBar} boxSize={iconSize} color="blue.500" />
                            <Text fontWeight="bold" fontSize={cardFontSize} textAlign="center">
                              Executive Dashboard
                            </Text>
                            <Text 
                              fontSize={cardDescSize} 
                              color="gray.600" 
                              textAlign="center"
                              flex="1"
                              noOfLines={2}
                            >
                              High-level KPIs and metrics for executive team
                            </Text>
                            <Button 
                              size={buttonSize} 
                              colorScheme="blue"
                              w={isMobile ? "full" : "auto"}
                            >
                              Use Template
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg} borderColor={borderColor} h="full">
                        <CardBody p={cardPadding}>
                          <VStack spacing={spacing} h="full">
                            <Icon as={FaRoute} boxSize={iconSize} color="green.500" />
                            <Text fontWeight="bold" fontSize={cardFontSize} textAlign="center">
                              Operations Report
                            </Text>
                            <Text 
                              fontSize={cardDescSize} 
                              color="gray.600" 
                              textAlign="center"
                              flex="1"
                              noOfLines={2}
                            >
                              Operational efficiency and performance metrics
                            </Text>
                            <Button 
                              size={buttonSize} 
                              colorScheme="green"
                              w={isMobile ? "full" : "auto"}
                            >
                              Use Template
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg} borderColor={borderColor} h="full">
                        <CardBody p={cardPadding}>
                          <VStack spacing={spacing} h="full">
                            <Icon as={FaMoneyBillWave} boxSize={iconSize} color="purple.500" />
                            <Text fontWeight="bold" fontSize={cardFontSize} textAlign="center">
                              Financial Analysis
                            </Text>
                            <Text 
                              fontSize={cardDescSize} 
                              color="gray.600" 
                              textAlign="center"
                              flex="1"
                              noOfLines={2}
                            >
                              Revenue, costs, and profitability analysis
                            </Text>
                            <Button 
                              size={buttonSize} 
                              colorScheme="purple"
                              w={isMobile ? "full" : "auto"}
                            >
                              Use Template
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg} borderColor={borderColor} h="full">
                        <CardBody p={cardPadding}>
                          <VStack spacing={spacing} h="full">
                            <Icon as={FaCar} boxSize={iconSize} color="orange.500" />
                            <Text fontWeight="bold" fontSize={cardFontSize} textAlign="center">
                              Vehicle Analytics
                            </Text>
                            <Text 
                              fontSize={cardDescSize} 
                              color="gray.600" 
                              textAlign="center"
                              flex="1"
                              noOfLines={2}
                            >
                              Vehicle utilization and maintenance reports
                            </Text>
                            <Button 
                              size={buttonSize} 
                              colorScheme="orange"
                              w={isMobile ? "full" : "auto"}
                            >
                              Use Template
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg} borderColor={borderColor} h="full">
                        <CardBody p={cardPadding}>
                          <VStack spacing={spacing} h="full">
                            <Icon as={FaUsers} boxSize={iconSize} color="teal.500" />
                            <Text fontWeight="bold" fontSize={cardFontSize} textAlign="center">
                              User Insights
                            </Text>
                            <Text 
                              fontSize={cardDescSize} 
                              color="gray.600" 
                              textAlign="center"
                              flex="1"
                              noOfLines={2}
                            >
                              User behavior and engagement analytics
                            </Text>
                            <Button 
                              size={buttonSize} 
                              colorScheme="teal"
                              w={isMobile ? "full" : "auto"}
                            >
                              Use Template
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg} borderColor={borderColor} h="full">
                        <CardBody p={cardPadding}>
                          <VStack spacing={spacing} h="full">
                            <Icon as={FaChartPie} boxSize={iconSize} color="pink.500" />
                            <Text fontWeight="bold" fontSize={cardFontSize} textAlign="center">
                              Custom Builder
                            </Text>
                            <Text 
                              fontSize={cardDescSize} 
                              color="gray.600" 
                              textAlign="center"
                              flex="1"
                              noOfLines={2}
                            >
                              Build your own custom report template
                            </Text>
                            <Button 
                              size={buttonSize} 
                              colorScheme="pink"
                              w={isMobile ? "full" : "auto"}
                              onClick={onCustomOpen}
                            >
                              Create Custom
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
            </Card>
          </VStack>
        </Container>
      </Box>

      {/* Generate Report Modal */}
      <Modal 
        isOpen={isGenerateOpen} 
        onClose={onGenerateClose} 
        size={isMobile ? "full" : "lg"}
        motionPreset={isMobile ? "slideInBottom" : "scale"}
      >
        <ModalOverlay />
        <ModalContent 
          mx={isMobile ? 0 : undefined}
          my={isMobile ? 0 : undefined}
          maxH={isMobile ? "100vh" : undefined}
        >
          <ModalHeader fontSize={isMobile ? "lg" : "xl"}>
            Generate New Report
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={spacing} align="stretch">
              <FormControl>
                <FormLabel fontSize={fontSize}>Report Type</FormLabel>
                <Select 
                  value={reportConfig.type}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, type: e.target.value }))}
                  size={buttonSize}
                >
                  <option value="trip_analytics">Trip Analytics</option>
                  <option value="user_activity">User Activity</option>
                  <option value="financial">Financial Summary</option>
                  <option value="driver_performance">Driver Performance</option>
                  <option value="vehicle_utilization">Vehicle Utilization</option>
                  <option value="system_performance">System Performance</option>
                  <option value="audit_log">Audit Log</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize={fontSize}>Format</FormLabel>
                <RadioGroup 
                  value={reportConfig.format}
                  onChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                >
                  <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 2 : 4}>
                    <Radio value="pdf" size={buttonSize}>PDF</Radio>
                    <Radio value="excel" size={buttonSize}>Excel</Radio>
                    <Radio value="csv" size={buttonSize}>CSV</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize={fontSize}>Date Range</FormLabel>
                <Select 
                  value={reportConfig.dateRange}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                  size={buttonSize}
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                  <option value="custom">Custom Range</option>
                </Select>
              </FormControl>

              {reportConfig.dateRange === 'custom' && (
                <Stack direction={isMobile ? "column" : "row"} spacing={spacing}>
                  <FormControl>
                    <FormLabel fontSize={fontSize}>Start Date</FormLabel>
                    <Input 
                      type="date"
                      value={reportConfig.customStartDate}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
                      size={buttonSize}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={fontSize}>End Date</FormLabel>
                    <Input 
                      type="date"
                      value={reportConfig.customEndDate}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
                      size={buttonSize}
                    />
                  </FormControl>
                </Stack>
              )}

              <VStack align="start" spacing={2}>
                <Text fontWeight="medium" fontSize={fontSize} mb={2}>
                  Report Options
                </Text>
                <Checkbox 
                  isChecked={reportConfig.includeCharts}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  size={buttonSize}
                >
                  Include Charts & Visualizations
                </Checkbox>
                <Checkbox 
                  isChecked={reportConfig.includeSummary}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, includeSummary: e.target.checked }))}
                  size={buttonSize}
                >
                  Include Executive Summary
                </Checkbox>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter flexDirection={isMobile ? "column" : "row"}>
            <Button 
              variant="ghost" 
              mr={isMobile ? 0 : 3} 
              mb={isMobile ? 2 : 0}
              onClick={onGenerateClose}
              size={buttonSize}
              w={isMobile ? "full" : "auto"}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleGenerateReport}
              isLoading={generating}
              loadingText="Generating..."
              size={buttonSize}
              w={isMobile ? "full" : "auto"}
            >
              Generate Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Schedule Report Modal */}
      <Modal 
        isOpen={isScheduleOpen} 
        onClose={onScheduleClose} 
        size={isMobile ? "full" : "lg"}
        motionPreset={isMobile ? "slideInBottom" : "scale"}
        scrollBehavior={isMobile ? "inside" : "outside"}
      >
        <ModalOverlay />
        <ModalContent 
          mx={isMobile ? 0 : undefined}
          my={isMobile ? 0 : undefined}
          maxH={isMobile ? "100vh" : undefined}
        >
          <ModalHeader fontSize={isMobile ? "lg" : "xl"}>
            Schedule New Report
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={spacing} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize={fontSize}>Report Name</FormLabel>
                <Input 
                  value={scheduleConfig.name}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                  size={buttonSize}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={fontSize}>Description</FormLabel>
                <Textarea 
                  value={scheduleConfig.description}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter report description"
                  size={buttonSize}
                  resize="vertical"
                  minH={isMobile ? "60px" : "80px"}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={fontSize}>Report Type</FormLabel>
                <Select 
                  value={scheduleConfig.reportType}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, reportType: e.target.value }))}
                  size={buttonSize}
                >
                  <option value="trip_analytics">Trip Analytics</option>
                  <option value="user_activity">User Activity</option>
                  <option value="financial">Financial Summary</option>
                  <option value="driver_performance">Driver Performance</option>
                </Select>
              </FormControl>

              <Stack direction={isMobile ? "column" : "row"} spacing={spacing}>
                <FormControl>
                  <FormLabel fontSize={fontSize}>Frequency</FormLabel>
                  <Select 
                    value={scheduleConfig.frequency}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, frequency: e.target.value }))}
                    size={buttonSize}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={fontSize}>Time</FormLabel>
                  <Input 
                    type="time"
                    value={scheduleConfig.time}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, time: e.target.value }))}
                    size={buttonSize}
                  />
                </FormControl>
              </Stack>

              <FormControl isRequired>
                <FormLabel fontSize={fontSize}>
                  Recipients (comma-separated emails)
                </FormLabel>
                <Textarea 
                  value={scheduleConfig.recipients}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, recipients: e.target.value }))}
                  placeholder="user1@company.com, user2@company.com"
                  size={buttonSize}
                  resize="vertical"
                  minH={isMobile ? "60px" : "80px"}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={fontSize}>Format</FormLabel>
                <RadioGroup 
                  value={scheduleConfig.format}
                  onChange={(value) => setScheduleConfig(prev => ({ ...prev, format: value }))}
                >
                  <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 2 : 4}>
                    <Radio value="pdf" size={buttonSize}>PDF</Radio>
                    <Radio value="excel" size={buttonSize}>Excel</Radio>
                    <Radio value="csv" size={buttonSize}>CSV</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter flexDirection={isMobile ? "column" : "row"}>
            <Button 
              variant="ghost" 
              mr={isMobile ? 0 : 3} 
              mb={isMobile ? 2 : 0}
              onClick={onScheduleClose}
              size={buttonSize}
              w={isMobile ? "full" : "auto"}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleScheduleReport}
              size={buttonSize}
              w={isMobile ? "full" : "auto"}
            >
              Schedule Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Custom Report Builder Modal */}
      <Modal 
        isOpen={isCustomOpen} 
        onClose={onCustomClose} 
        size={isMobile ? "full" : "xl"}
        motionPreset={isMobile ? "slideInBottom" : "scale"}
      >
        <ModalOverlay />
        <ModalContent 
          mx={isMobile ? 0 : undefined}
          my={isMobile ? 0 : undefined}
          maxH={isMobile ? "100vh" : undefined}
        >
          <ModalHeader fontSize={isMobile ? "lg" : "xl"}>
            Custom Report Builder
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={spacing} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle fontSize={isMobile ? "sm" : "md"}>
                    Coming Soon!
                  </AlertTitle>
                  <AlertDescription fontSize={isMobile ? "xs" : "sm"}>
                    Custom report builder with drag-and-drop interface will be available in the next update.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <Card variant="outline">
                <CardBody>
                  <VStack spacing={3} align="stretch" textAlign="center">
                    <Icon as={FaChartPie} boxSize={12} color="blue.500" mx="auto" />
                    <Heading size="sm">Advanced Report Customization</Heading>
                    <Text color="gray.600" fontSize={isMobile ? "sm" : "md"}>
                      The custom report builder will allow you to create personalized reports by selecting specific data fields, 
                      applying custom filters, and designing your own layout and visualizations.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <SimpleGrid columns={isMobile ? 1 : 2} spacing={3}>
                <Card variant="outline" size="sm">
                  <CardBody textAlign="center" p={3}>
                    <Icon as={FaFilter} boxSize={6} color="green.500" mb={2} />
                    <Text fontWeight="medium" fontSize="sm">Dynamic Filtering</Text>
                    <Text fontSize="xs" color="gray.600">Custom data filters</Text>
                  </CardBody>
                </Card>
                
                <Card variant="outline" size="sm">
                  <CardBody textAlign="center" p={3}>
                    <Icon as={FaChartBar} boxSize={6} color="purple.500" mb={2} />
                    <Text fontWeight="medium" fontSize="sm">Visual Designer</Text>
                    <Text fontSize="xs" color="gray.600">Drag & drop charts</Text>
                  </CardBody>
                </Card>
                
                <Card variant="outline" size="sm">
                  <CardBody textAlign="center" p={3}>
                    <Icon as={FaClock} boxSize={6} color="orange.500" mb={2} />
                    <Text fontWeight="medium" fontSize="sm">Real-time Data</Text>
                    <Text fontSize="xs" color="gray.600">Live data updates</Text>
                  </CardBody>
                </Card>
                
                <Card variant="outline" size="sm">
                  <CardBody textAlign="center" p={3}>
                    <Icon as={EmailIcon} boxSize={6} color="blue.500" mb={2} />
                    <Text fontWeight="medium" fontSize="sm">Export Options</Text>
                    <Text fontSize="xs" color="gray.600">Multiple formats</Text>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              onClick={onCustomClose}
              size={buttonSize}
              w={isMobile ? "full" : "auto"}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminReports;
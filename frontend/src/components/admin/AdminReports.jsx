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
  Switch
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
import axios from 'axios';
import Navbar from '../shared/Navbar';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const toast = useToast();
  
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

  useEffect(() => {
    fetchReports();
    fetchScheduledReports();
  }, []);

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
    } catch (error) {
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
    } catch (error) {
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
    <Card cursor="pointer" _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
      <CardBody>
        <VStack spacing={3}>
          <Icon as={icon} boxSize={8} color={color} />
          <Text fontWeight="bold" textAlign="center">{title}</Text>
          <Text fontSize="sm" color="gray.600" textAlign="center">{description}</Text>
          <Button 
            size="sm" 
            colorScheme="blue" 
            leftIcon={<DownloadIcon />}
            onClick={() => {
              setReportConfig(prev => ({ ...prev, type }));
              onGenerateOpen();
            }}
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
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Navbar />
      <Box flex="1" p={{ base: 4, md: 6, lg: 8 }}>
        <Container maxW="7xl">
          <VStack align="stretch" spacing={6}>
            {/* Header */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Box>
                <Heading size="lg" mb={2}>Reports Center</Heading>
                <Text color="gray.600">
                  Generate, schedule, and manage system reports
                </Text>
              </Box>
              <HStack spacing={3}>
                <Button 
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={onGenerateOpen}
                >
                  Generate Report
                </Button>
                <Button 
                  leftIcon={<CalendarIcon />}
                  variant="outline"
                  onClick={onScheduleOpen}
                >
                  Schedule Report
                </Button>
                <Button 
                  leftIcon={<SettingsIcon />}
                  variant="outline"
                  onClick={onCustomOpen}
                >
                  Custom Report
                </Button>
              </HStack>
            </Flex>

            {/* Quick Reports */}
            <Box>
              <Heading size="md" mb={4}>Quick Reports</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
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
            </Box>

            {/* Main Content Tabs */}
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Recent Reports</Tab>
                <Tab>Scheduled Reports</Tab>
                <Tab>Report Templates</Tab>
              </TabList>

              <TabPanels>
                {/* Recent Reports */}
                <TabPanel p={0} pt={6}>
                  <Card>
                    <CardHeader>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Report History</Heading>
                        <Button size="sm" leftIcon={<RepeatIcon />} onClick={fetchReports}>
                          Refresh
                        </Button>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
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
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Scheduled Reports */}
                <TabPanel p={0} pt={6}>
                  <Card>
                    <CardHeader>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Scheduled Reports</Heading>
                        <Button 
                          size="sm" 
                          leftIcon={<AddIcon />} 
                          colorScheme="blue"
                          onClick={onScheduleOpen}
                        >
                          Add Schedule
                        </Button>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack spacing={4} align="stretch">
                        {scheduledReports.map((schedule) => (
                          <Card key={schedule.id} variant="outline">
                            <CardBody>
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
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Report Templates */}
                <TabPanel p={0} pt={6}>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    <Card>
                      <CardBody>
                        <VStack spacing={3}>
                          <Icon as={FaChartBar} boxSize={8} color="blue.500" />
                          <Text fontWeight="bold">Executive Dashboard</Text>
                          <Text fontSize="sm" color="gray.600" textAlign="center">
                            High-level KPIs and metrics for executive team
                          </Text>
                          <Button size="sm" colorScheme="blue">Use Template</Button>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <VStack spacing={3}>
                          <Icon as={FaRoute} boxSize={8} color="green.500" />
                          <Text fontWeight="bold">Operations Report</Text>
                          <Text fontSize="sm" color="gray.600" textAlign="center">
                            Operational efficiency and performance metrics
                          </Text>
                          <Button size="sm" colorScheme="green">Use Template</Button>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <VStack spacing={3}>
                          <Icon as={FaMoneyBillWave} boxSize={8} color="purple.500" />
                          <Text fontWeight="bold">Financial Analysis</Text>
                          <Text fontSize="sm" color="gray.600" textAlign="center">
                            Revenue, costs, and profitability analysis
                          </Text>
                          <Button size="sm" colorScheme="purple">Use Template</Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Box>

      {/* Generate Report Modal */}
      <Modal isOpen={isGenerateOpen} onClose={onGenerateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate New Report</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Report Type</FormLabel>
                <Select 
                  value={reportConfig.type}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, type: e.target.value }))}
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
                <FormLabel>Format</FormLabel>
                <RadioGroup 
                  value={reportConfig.format}
                  onChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                >
                  <Stack direction="row">
                    <Radio value="pdf">PDF</Radio>
                    <Radio value="excel">Excel</Radio>
                    <Radio value="csv">CSV</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Date Range</FormLabel>
                <Select 
                  value={reportConfig.dateRange}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                  <option value="custom">Custom Range</option>
                </Select>
              </FormControl>

              {reportConfig.dateRange === 'custom' && (
                <HStack>
                  <FormControl>
                    <FormLabel>Start Date</FormLabel>
                    <Input 
                      type="date"
                      value={reportConfig.customStartDate}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>End Date</FormLabel>
                    <Input 
                      type="date"
                      value={reportConfig.customEndDate}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
                    />
                  </FormControl>
                </HStack>
              )}

              <VStack align="start" spacing={2}>
                <Checkbox 
                  isChecked={reportConfig.includeCharts}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                >
                  Include Charts & Visualizations
                </Checkbox>
                <Checkbox 
                  isChecked={reportConfig.includeSummary}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, includeSummary: e.target.checked }))}
                >
                  Include Executive Summary
                </Checkbox>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onGenerateClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleGenerateReport}
              isLoading={generating}
              loadingText="Generating..."
            >
              Generate Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Schedule Report Modal */}
      <Modal isOpen={isScheduleOpen} onClose={onScheduleClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Schedule New Report</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Report Name</FormLabel>
                <Input 
                  value={scheduleConfig.name}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea 
                  value={scheduleConfig.description}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter report description"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Report Type</FormLabel>
                <Select 
                  value={scheduleConfig.reportType}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, reportType: e.target.value }))}
                >
                  <option value="trip_analytics">Trip Analytics</option>
                  <option value="user_activity">User Activity</option>
                  <option value="financial">Financial Summary</option>
                  <option value="driver_performance">Driver Performance</option>
                </Select>
              </FormControl>

              <HStack>
                <FormControl>
                  <FormLabel>Frequency</FormLabel>
                  <Select 
                    value={scheduleConfig.frequency}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, frequency: e.target.value }))}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Time</FormLabel>
                  <Input 
                    type="time"
                    value={scheduleConfig.time}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, time: e.target.value }))}
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Recipients (comma-separated emails)</FormLabel>
                <Textarea 
                  value={scheduleConfig.recipients}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, recipients: e.target.value }))}
                  placeholder="user1@company.com, user2@company.com"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Format</FormLabel>
                <RadioGroup 
                  value={scheduleConfig.format}
                  onChange={(value) => setScheduleConfig(prev => ({ ...prev, format: value }))}
                >
                  <Stack direction="row">
                    <Radio value="pdf">PDF</Radio>
                    <Radio value="excel">Excel</Radio>
                    <Radio value="csv">CSV</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onScheduleClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleScheduleReport}>
              Schedule Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Custom Report Builder Modal */}
      <Modal isOpen={isCustomOpen} onClose={onCustomClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Custom Report Builder</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="info" mb={4}>
              <AlertIcon />
              <AlertTitle>Coming Soon!</AlertTitle>
              <AlertDescription>
                Custom report builder with drag-and-drop interface will be available in the next update.
              </AlertDescription>
            </Alert>
            <Text color="gray.600">
              The custom report builder will allow you to create personalized reports by selecting specific data fields, 
              applying custom filters, and designing your own layout and visualizations.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onCustomClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminReports;
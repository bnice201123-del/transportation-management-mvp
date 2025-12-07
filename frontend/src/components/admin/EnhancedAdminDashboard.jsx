import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  useToast,
  useColorModeValue,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Input,
  Select,
  FormControl,
  FormLabel,
  Switch,
  Tooltip,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Divider
} from '@chakra-ui/react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import { Command } from 'cmdk';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  FaCog,
  FaDownload,
  FaExpand,
  FaCompress,
  FaStar,
  FaRegStar,
  FaFilter,
  FaBell,
  FaKeyboard,
  FaChartLine,
  FaUsers,
  FaCar,
  FaRoute,
  FaExclamationTriangle,
  FaSync,
  FaPlus,
  FaTrash,
  FaEdit
} from 'react-icons/fa';
import axios from '../../config/axios';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const EnhancedAdminDashboard = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [layouts, setLayouts] = useState(getFromLS('dashboardLayouts') || getDefaultLayouts());
  const [favorites, setFavorites] = useState(getFromLS('favorites') || []);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: 'today',
    activityType: 'all',
    status: 'all'
  });
  const [alertRules, setAlertRules] = useState(getFromLS('alertRules') || []);
  const [expandedWidget, setExpandedWidget] = useState(null);
  
  const { isOpen: isAlertRuleOpen, onOpen: onAlertRuleOpen, onClose: onAlertRuleClose } = useDisclosure();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, tripsRes, usersRes, analyticsRes] = await Promise.all([
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/trips?limit=50'),
        axios.get('/api/users'),
        axios.get('/api/analytics/trends')
      ]);

      setDashboardData({
        stats: statsRes.data,
        trips: tripsRes.data.trips || [],
        users: usersRes.data.users || [],
        analytics: analyticsRes.data
      });

      // Check alert rules
      checkAlertRules(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Local storage helpers
  function getFromLS(key) {
    let ls = {};
    if (typeof window !== 'undefined') {
      try {
        ls = JSON.parse(window.localStorage.getItem('adminDashboard')) || {};
      } catch (e) {
        console.error('Error parsing localStorage', e);
      }
    }
    return ls[key];
  }

  function saveToLS(key, value) {
    if (typeof window !== 'undefined') {
      const ls = JSON.parse(window.localStorage.getItem('adminDashboard')) || {};
      ls[key] = value;
      window.localStorage.setItem('adminDashboard', JSON.stringify(ls));
    }
  }

  // Default layout configuration
  function getDefaultLayouts() {
    return {
      lg: [
        { i: 'stats', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
        { i: 'charts', x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
        { i: 'activity', x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
        { i: 'trips', x: 0, y: 6, w: 6, h: 3, minW: 4, minH: 2 },
        { i: 'users', x: 6, y: 6, w: 6, h: 3, minW: 4, minH: 2 },
        { i: 'alerts', x: 0, y: 9, w: 12, h: 2, minW: 6, minH: 2 }
      ]
    };
  }

  // Layout change handler
  const onLayoutChange = useCallback((layout, layouts) => {
    setLayouts(layouts);
    saveToLS('dashboardLayouts', layouts);
  }, []);

  // Alert rules checker
  const checkAlertRules = useCallback((stats) => {
    alertRules.forEach(rule => {
      if (rule.enabled) {
        const value = stats[rule.metric];
        let triggered = false;

        switch (rule.condition) {
          case 'greater':
            triggered = value > rule.threshold;
            break;
          case 'less':
            triggered = value < rule.threshold;
            break;
          case 'equal':
            triggered = value === rule.threshold;
            break;
          default:
            break;
        }

        if (triggered) {
          const notification = {
            id: Date.now(),
            title: rule.name,
            message: `${rule.metric}: ${value} ${rule.condition} ${rule.threshold}`,
            type: 'warning',
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev].slice(0, 10));
          
          if (rule.showToast) {
            toast({
              title: rule.name,
              description: notification.message,
              status: 'warning',
              duration: 5000,
              isClosable: true
            });
          }
        }
      }
    });
  }, [alertRules, toast]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (!dashboardData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Trips', dashboardData.stats?.totalTrips || 0],
      ['Active Users', dashboardData.stats?.activeUsers || 0],
      ['Completed Today', dashboardData.stats?.completedToday || 0],
      ['Revenue', `$${dashboardData.stats?.revenue || 0}`]
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Dashboard data exported to CSV',
      status: 'success',
      duration: 3000
    });
  }, [dashboardData, toast]);

  // Export to PDF
  const exportToPDF = useCallback(() => {
    if (!dashboardData) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Admin Dashboard Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    // Stats table
    doc.autoTable({
      startY: 35,
      head: [['Metric', 'Value']],
      body: [
        ['Total Trips', dashboardData.stats?.totalTrips || 0],
        ['Active Users', dashboardData.stats?.activeUsers || 0],
        ['Completed Today', dashboardData.stats?.completedToday || 0],
        ['Revenue', `$${dashboardData.stats?.revenue || 0}`],
        ['Pending Trips', dashboardData.stats?.pendingTrips || 0]
      ]
    });

    doc.save(`dashboard-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: 'Export Successful',
      description: 'Dashboard data exported to PDF',
      status: 'success',
      duration: 3000
    });
  }, [dashboardData, toast]);

  // Toggle favorite
  const toggleFavorite = useCallback((widgetId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId];
      saveToLS('favorites', newFavorites);
      return newFavorites;
    });
  }, []);

  // Stats Widget
  const StatsWidget = useMemo(() => {
    if (!dashboardData?.stats) return null;

    const stats = [
      {
        label: 'Total Trips',
        value: dashboardData.stats.totalTrips || 0,
        change: 12,
        icon: FaRoute,
        color: 'blue',
        sparklineData: [20, 25, 22, 30, 28, 35, 32]
      },
      {
        label: 'Active Users',
        value: dashboardData.stats.activeUsers || 0,
        change: 8,
        icon: FaUsers,
        color: 'green',
        sparklineData: [15, 18, 20, 19, 22, 25, 28]
      },
      {
        label: 'Vehicles',
        value: dashboardData.stats.totalVehicles || 0,
        change: 5,
        icon: FaCar,
        color: 'purple',
        sparklineData: [10, 12, 11, 13, 14, 15, 16]
      },
      {
        label: 'Alerts',
        value: dashboardData.stats.activeAlerts || 0,
        change: -3,
        icon: FaExclamationTriangle,
        color: 'red',
        sparklineData: [8, 6, 7, 5, 4, 3, 2]
      }
    ];

    return (
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        {stats.map((stat, index) => (
          <Card key={index} bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Box
                    p={2}
                    bg={`${stat.color}.100`}
                    borderRadius="md"
                    color={`${stat.color}.600`}
                  >
                    <stat.icon size={20} />
                  </Box>
                  <IconButton
                    icon={favorites.includes(`stat-${index}`) ? <FaStar /> : <FaRegStar />}
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavorite(`stat-${index}`)}
                    aria-label="Toggle favorite"
                  />
                </HStack>
                <VStack align="stretch" spacing={1}>
                  <Text fontSize="sm" color="gray.500">{stat.label}</Text>
                  <Heading size="lg">{stat.value}</Heading>
                  <HStack spacing={2}>
                    <Badge colorScheme={stat.change > 0 ? 'green' : 'red'}>
                      <HStack spacing={1}>
                        <StatArrow type={stat.change > 0 ? 'increase' : 'decrease'} />
                        <Text>{Math.abs(stat.change)}%</Text>
                      </HStack>
                    </Badge>
                    <Text fontSize="xs" color="gray.500">vs last week</Text>
                  </HStack>
                </VStack>
                <Box height="30px">
                  <Sparklines data={stat.sparklineData} width={100} height={30}>
                    <SparklinesLine color={stat.color === 'blue' ? '#3182CE' : stat.color === 'green' ? '#38A169' : stat.color === 'purple' ? '#805AD5' : '#E53E3E'} />
                    <SparklinesSpots />
                  </Sparklines>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    );
  }, [dashboardData, favorites, toggleFavorite, cardBg, borderColor]);

  // Charts Widget
  const ChartsWidget = useMemo(() => {
    if (!dashboardData?.analytics) return null;

    const chartData = [
      { name: 'Mon', trips: 40, users: 24 },
      { name: 'Tue', trips: 30, users: 22 },
      { name: 'Wed', trips: 50, users: 28 },
      { name: 'Thu', trips: 45, users: 26 },
      { name: 'Fri', trips: 60, users: 32 },
      { name: 'Sat', trips: 55, users: 30 },
      { name: 'Sun', trips: 35, users: 20 }
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          <Area type="monotone" dataKey="trips" stackId="1" stroke="#3182CE" fill="#3182CE" />
          <Area type="monotone" dataKey="users" stackId="1" stroke="#38A169" fill="#38A169" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }, [dashboardData]);

  // Command Palette
  const CommandPalette = () => (
    <Modal isOpen={commandOpen} onClose={() => setCommandOpen(false)} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Command Palette</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Command label="Command Menu">
            <Input placeholder="Type a command or search..." mb={2} />
            <VStack align="stretch" spacing={1}>
              <Button
                justifyContent="flex-start"
                leftIcon={<FaDownload />}
                variant="ghost"
                onClick={() => {
                  exportToCSV();
                  setCommandOpen(false);
                }}
              >
                Export to CSV
              </Button>
              <Button
                justifyContent="flex-start"
                leftIcon={<FaDownload />}
                variant="ghost"
                onClick={() => {
                  exportToPDF();
                  setCommandOpen(false);
                }}
              >
                Export to PDF
              </Button>
              <Button
                justifyContent="flex-start"
                leftIcon={<FaFilter />}
                variant="ghost"
                onClick={() => {
                  onFilterOpen();
                  setCommandOpen(false);
                }}
              >
                Open Filters
              </Button>
              <Button
                justifyContent="flex-start"
                leftIcon={<FaBell />}
                variant="ghost"
                onClick={() => {
                  onAlertRuleOpen();
                  setCommandOpen(false);
                }}
              >
                Manage Alert Rules
              </Button>
              <Button
                justifyContent="flex-start"
                leftIcon={<FaSync />}
                variant="ghost"
                onClick={() => {
                  fetchDashboardData();
                  setCommandOpen(false);
                }}
              >
                Refresh Dashboard
              </Button>
            </VStack>
          </Command>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  // Filter Modal
  const FilterModal = () => (
    <Modal isOpen={isFilterOpen} onClose={onFilterClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Filter Dashboard</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Date Range</FormLabel>
              <Select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Activity Type</FormLabel>
              <Select
                value={filters.activityType}
                onChange={(e) => setFilters({ ...filters, activityType: e.target.value })}
              >
                <option value="all">All Activities</option>
                <option value="trips">Trips Only</option>
                <option value="users">Users Only</option>
                <option value="vehicles">Vehicles Only</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onFilterClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={onFilterClose}>
            Apply Filters
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <Container maxW="container.xl">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={1}>
            <Heading size="lg">Enhanced Dashboard</Heading>
            <Text color="gray.500" fontSize="sm">
              Press Ctrl+K for quick actions
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Tooltip label="Notifications">
              <IconButton
                icon={<FaBell />}
                variant="ghost"
                aria-label="Notifications"
                position="relative"
              >
                {notifications.length > 0 && (
                  <Badge
                    position="absolute"
                    top="-1"
                    right="-1"
                    colorScheme="red"
                    borderRadius="full"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </IconButton>
            </Tooltip>
            <Tooltip label="Filters">
              <IconButton
                icon={<FaFilter />}
                variant="ghost"
                onClick={onFilterOpen}
                aria-label="Filters"
              />
            </Tooltip>
            <Tooltip label="Export CSV">
              <IconButton
                icon={<FaDownload />}
                variant="ghost"
                onClick={exportToCSV}
                aria-label="Export CSV"
              />
            </Tooltip>
            <Tooltip label="Refresh">
              <IconButton
                icon={<FaSync />}
                variant="ghost"
                onClick={fetchDashboardData}
                aria-label="Refresh"
              />
            </Tooltip>
            <Menu>
              <MenuButton as={Button} leftIcon={<FaCog />} size="sm">
                Settings
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FaBell />} onClick={onAlertRuleOpen}>
                  Alert Rules
                </MenuItem>
                <MenuItem icon={<FaDownload />} onClick={exportToPDF}>
                  Export PDF
                </MenuItem>
                <MenuItem icon={<FaKeyboard />} onClick={() => setCommandOpen(true)}>
                  Keyboard Shortcuts
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Dashboard Grid */}
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={80}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
        >
          {/* Stats Widget */}
          <Box key="stats">
            <Card bg={cardBg} h="100%">
              <CardHeader className="drag-handle" cursor="move">
                <HStack justify="space-between">
                  <Heading size="md">Statistics</Heading>
                  <IconButton
                    icon={favorites.includes('stats') ? <FaStar /> : <FaRegStar />}
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavorite('stats')}
                    aria-label="Toggle favorite"
                  />
                </HStack>
              </CardHeader>
              <CardBody>{StatsWidget}</CardBody>
            </Card>
          </Box>

          {/* Charts Widget */}
          <Box key="charts">
            <Card bg={cardBg} h="100%">
              <CardHeader className="drag-handle" cursor="move">
                <HStack justify="space-between">
                  <Heading size="md">Activity Trends</Heading>
                  <IconButton
                    icon={favorites.includes('charts') ? <FaStar /> : <FaRegStar />}
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavorite('charts')}
                    aria-label="Toggle favorite"
                  />
                </HStack>
              </CardHeader>
              <CardBody>{ChartsWidget}</CardBody>
            </Card>
          </Box>

          {/* Activity Widget */}
          <Box key="activity">
            <Card bg={cardBg} h="100%">
              <CardHeader className="drag-handle" cursor="move">
                <Heading size="md">Recent Activity</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="sm" color="gray.500">
                    Loading recent activities...
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </ResponsiveGridLayout>
      </Container>

      {/* Modals */}
      <CommandPalette />
      <FilterModal />
    </Box>
  );
};

export default EnhancedAdminDashboard;

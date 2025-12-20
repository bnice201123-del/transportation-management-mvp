import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Card,
  CardBody,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Divider,
  Flex,
  Select,
  Tag,
  TagLabel,
  TagLeftIcon,
  Tooltip,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import {
  BellIcon,
  CheckCircleIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserGroupIcon,
  TruckIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
} from '@heroicons/react/24/solid';
import axios from '../../config/axios';
import Navbar from '../shared/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [deleteNotificationId, setDeleteNotificationId] = useState(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const unreadBg = useColorModeValue('blue.50', 'blue.900');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const unreadOnly = activeTab === 1;
      const params = {
        unreadOnly,
        ...(filterType !== 'all' && { type: filterType })
      };

      const response = await axios.get('/api/notifications', { params });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterType]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
      fetchNotifications();
      toast({
        title: 'Success',
        description: 'Notification marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/mark-all-read');
      fetchNotifications();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      fetchNotifications();
      toast({
        title: 'Success',
        description: 'Notification deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = (notificationId) => {
    setDeleteNotificationId(notificationId);
    onOpen();
  };

  const confirmDelete = () => {
    if (deleteNotificationId) {
      deleteNotification(deleteNotificationId);
      setDeleteNotificationId(null);
    }
    onClose();
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type and related data
    if (notification.relatedData?.actionUrl) {
      navigate(notification.relatedData.actionUrl);
    } else if (notification.relatedData?.tripId) {
      // Navigate to appropriate trip view based on user role
      const userRoles = user?.roles || [user?.role];
      if (userRoles.includes('admin') || userRoles.includes('dispatcher')) {
        navigate('/dispatcher');
      } else if (userRoles.includes('driver')) {
        navigate('/driver');
      } else if (userRoles.includes('scheduler')) {
        navigate('/scheduler');
      }
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { w: 5, h: 5 };
    
    switch (type) {
      case 'trip_assigned':
      case 'trip_started':
        return <Box as={TruckIcon} {...iconProps} color="blue.500" />;
      case 'trip_completed':
        return <Box as={CheckCircleIconSolid} {...iconProps} color="green.500" />;
      case 'trip_cancelled':
        return <Box as={ExclamationTriangleIcon} {...iconProps} color="red.500" />;
      case 'trip_updated':
      case 'schedule_change':
        return <Box as={CalendarIcon} {...iconProps} color="orange.500" />;
      case 'rider_assigned':
      case 'driver_assigned':
        return <Box as={UserGroupIcon} {...iconProps} color="purple.500" />;
      case 'urgent':
      case 'system_alert':
        return <Box as={ExclamationTriangleIcon} {...iconProps} color="red.500" />;
      default:
        return <Box as={InformationCircleIcon} {...iconProps} color="gray.500" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'urgent') return 'red';
    
    switch (type) {
      case 'trip_completed':
        return 'green';
      case 'trip_assigned':
      case 'trip_started':
        return 'blue';
      case 'trip_cancelled':
        return 'red';
      case 'trip_updated':
      case 'schedule_change':
        return 'orange';
      case 'rider_assigned':
      case 'driver_assigned':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return notificationTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: notificationTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 1) return !n.read;
    if (activeTab === 2) return n.read;
    return true;
  });

  const renderNotification = (notification) => (
    <Card
      key={notification._id}
      bg={!notification.read ? unreadBg : cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      _hover={{ bg: hoverBg, cursor: 'pointer' }}
      transition="all 0.2s"
      onClick={() => handleNotificationClick(notification)}
    >
      <CardBody p={4}>
        <Flex justify="space-between" align="flex-start">
          <HStack spacing={3} flex={1} align="flex-start">
            <Box flexShrink={0} mt={1}>
              {getNotificationIcon(notification.type)}
            </Box>
            
            <VStack align="stretch" spacing={1} flex={1}>
              <HStack justify="space-between" align="flex-start">
                <Heading size="sm" color={textColor} fontWeight="semibold">
                  {notification.title}
                </Heading>
                {!notification.read && (
                  <Badge colorScheme="blue" fontSize="xs" flexShrink={0}>
                    New
                  </Badge>
                )}
              </HStack>

              <Text fontSize="sm" color={mutedColor}>
                {notification.message}
              </Text>

              <HStack spacing={3} mt={2}>
                <HStack spacing={1}>
                  <Box as={ClockIcon} w={3} h={3} color={mutedColor} />
                  <Text fontSize="xs" color={mutedColor}>
                    {formatRelativeTime(notification.createdAt)}
                  </Text>
                </HStack>

                <Tag
                  size="sm"
                  colorScheme={getNotificationColor(notification.type, notification.priority)}
                  variant="subtle"
                >
                  {notification.type.replace(/_/g, ' ')}
                </Tag>

                {notification.priority === 'urgent' && (
                  <Tag size="sm" colorScheme="red" variant="solid">
                    <TagLeftIcon as={ExclamationTriangleIcon} />
                    <TagLabel>Urgent</TagLabel>
                  </Tag>
                )}
              </HStack>
            </VStack>
          </HStack>

          <Menu>
            <MenuButton
              as={IconButton}
              icon={<Box as={EllipsisVerticalIcon} w={5} h={5} />}
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              flexShrink={0}
              ml={2}
            />
            <MenuList>
              {!notification.read && (
                <MenuItem
                  icon={<Box as={CheckCircleIcon} w={4} h={4} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification._id);
                  }}
                >
                  Mark as read
                </MenuItem>
              )}
              <MenuItem
                icon={<Box as={TrashIcon} w={4} h={4} />}
                color="red.500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(notification._id);
                }}
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </CardBody>
    </Card>
  );

  return (
    <>
      <Navbar title="Notifications" />
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW={{ base: "100%", md: "container.xl" }} px={{ base: 3, md: 4 }}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Header */}
            <Card bg={cardBg} borderRadius={{ base: "md", md: "lg" }}>
              <CardBody py={{ base: 4, md: 6 }} px={{ base: 3, md: 4 }}>
                <Flex 
                  direction={{ base: 'column', md: 'row' }} 
                  justify={{ base: 'center', md: 'space-between' }}
                  align={{ base: 'center', md: 'center' }}
                  gap={{ base: 4, md: 6 }}
                >
                  <HStack spacing={{ base: 4, md: 6 }} justify="center" align="center">
                    <Box as={BellIconSolid} w={{ base: 6, md: 8 }} h={{ base: 6, md: 8 }} color="blue.500" flexShrink={0} />
                    <Box>
                      <Heading size={{ base: "md", md: "lg" }}>Notifications</Heading>
                      <Text fontSize={{ base: "xs", md: "sm" }} color={mutedColor}>
                        {unreadCount > 0 
                          ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                          : 'All caught up!'
                        }
                      </Text>
                    </Box>
                  </HStack>

                  <HStack spacing={{ base: 1, md: 2 }} flexWrap="wrap" justify={{ base: 'center', md: 'flex-end' }} w={{ base: 'full', md: 'auto' }}>
                    <Select
                      size={{ base: "sm", md: "sm" }}
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      maxW={{ base: "150px", md: "200px" }}
                    >
                      <option value="all">All Types</option>
                      <option value="trip_assigned">Trip Assigned</option>
                      <option value="trip_updated">Trip Updated</option>
                      <option value="trip_completed">Trip Completed</option>
                      <option value="trip_cancelled">Trip Cancelled</option>
                      <option value="urgent">Urgent</option>
                      <option value="system_alert">System Alerts</option>
                    </Select>

                    {unreadCount > 0 && (
                      <Button
                        size="sm"
                        leftIcon={<Box as={CheckCircleIcon} w={4} h={4} />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </Button>
                    )}
                  </HStack>
                </Flex>
              </CardBody>
            </Card>

            {/* Tabs */}
            <Tabs
              variant="enclosed"
              colorScheme="blue"
              index={activeTab}
              onChange={setActiveTab}
            >
              <Center mb={6}>
                <TabList 
                  justify="center"
                  display="flex"
                  gap={2}
                >
                  <Tab>
                  All
                  {notifications.length > 0 && (
                    <Badge ml={2} colorScheme="gray">
                      {notifications.length}
                    </Badge>
                  )}
                </Tab>
                <Tab>
                  Unread
                  {unreadCount > 0 && (
                    <Badge ml={2} colorScheme="blue">
                      {unreadCount}
                    </Badge>
                  )}
                </Tab>
                <Tab>Read</Tab>
              </TabList>
              </Center>

              <TabPanels>
                <TabPanel px={0}>
                  {loading ? (
                    <Center py={20}>
                      <Spinner size="xl" color="blue.500" />
                    </Center>
                  ) : filteredNotifications.length === 0 ? (
                    <Center py={20}>
                      <VStack spacing={3}>
                        <Box as={BellIcon} w={16} h={16} color="gray.400" />
                        <Text color={mutedColor} fontSize="lg">
                          No notifications yet
                        </Text>
                      </VStack>
                    </Center>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {filteredNotifications.map(renderNotification)}
                    </VStack>
                  )}
                </TabPanel>

                <TabPanel px={0}>
                  {loading ? (
                    <Center py={20}>
                      <Spinner size="xl" color="blue.500" />
                    </Center>
                  ) : filteredNotifications.length === 0 ? (
                    <Center py={20}>
                      <VStack spacing={3}>
                        <Box as={CheckCircleIconSolid} w={16} h={16} color="green.400" />
                        <Text color={mutedColor} fontSize="lg">
                          All caught up!
                        </Text>
                        <Text color={mutedColor} fontSize="sm">
                          You have no unread notifications
                        </Text>
                      </VStack>
                    </Center>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {filteredNotifications.map(renderNotification)}
                    </VStack>
                  )}
                </TabPanel>

                <TabPanel px={0}>
                  {loading ? (
                    <Center py={20}>
                      <Spinner size="xl" color="blue.500" />
                    </Center>
                  ) : filteredNotifications.length === 0 ? (
                    <Center py={20}>
                      <VStack spacing={3}>
                        <Box as={BellIcon} w={16} h={16} color="gray.400" />
                        <Text color={mutedColor} fontSize="lg">
                          No read notifications
                        </Text>
                      </VStack>
                    </Center>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {filteredNotifications.map(renderNotification)}
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Box>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Notification
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default NotificationsPage;

import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import axios from '../../config/axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

const ScheduleCalendar = ({ driverId = null, isAdmin = false }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    driver: driverId || '',
    startTime: '',
    endTime: '',
    shiftType: 'morning',
    location: '',
    vehicle: '',
    notes: '',
    breaks: []
  });
  const [conflicts, setConflicts] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (driverId) params.driver = driverId;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await axios.get('/api/schedules', { params });
      
      // Transform schedules to FullCalendar events
      const calendarEvents = response.data.schedules.map(schedule => ({
        id: schedule._id,
        title: schedule.driver?.name || 'Unknown Driver',
        start: schedule.startTime,
        end: schedule.endTime,
        backgroundColor: getStatusColor(schedule.status),
        borderColor: getShiftTypeColor(schedule.shiftType),
        extendedProps: {
          driver: schedule.driver,
          shiftType: schedule.shiftType,
          status: schedule.status,
          location: schedule.location,
          vehicle: schedule.vehicle,
          breaks: schedule.breaks,
          conflicts: schedule.conflicts,
          overtimeHours: schedule.overtimeHours,
          notes: schedule.notes
        }
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      showSnackbar('Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  }, [driverId, filterStatus]);

  // Fetch drivers and vehicles
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [driversRes, vehiclesRes] = await Promise.all([
          axios.get('/api/users/drivers'),
          axios.get('/api/vehicles')
        ]);
        setDrivers(driversRes.data.drivers || driversRes.data);
        setVehicles(vehiclesRes.data.vehicles || vehiclesRes.data);
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };

    if (isAdmin) {
      fetchResources();
    }
    fetchSchedules();
  }, [fetchSchedules, isAdmin]);

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#1976d2',
      confirmed: '#2e7d32',
      'in-progress': '#ed6c02',
      completed: '#388e3c',
      cancelled: '#d32f2f',
      'no-show': '#c62828'
    };
    return colors[status] || '#757575';
  };

  // Get shift type color
  const getShiftTypeColor = (shiftType) => {
    const colors = {
      morning: '#4caf50',
      afternoon: '#ff9800',
      evening: '#9c27b0',
      night: '#3f51b5',
      split: '#00bcd4',
      'on-call': '#f44336'
    };
    return colors[shiftType] || '#757575';
  };

  // Handle event click
  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setFormData({
      driver: clickInfo.event.extendedProps.driver?._id || '',
      startTime: format(clickInfo.event.start, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(clickInfo.event.end, "yyyy-MM-dd'T'HH:mm"),
      shiftType: clickInfo.event.extendedProps.shiftType,
      location: clickInfo.event.extendedProps.location || '',
      vehicle: clickInfo.event.extendedProps.vehicle?._id || '',
      notes: clickInfo.event.extendedProps.notes || '',
      breaks: clickInfo.event.extendedProps.breaks || []
    });
    setConflicts(clickInfo.event.extendedProps.conflicts || []);
    setOpenDialog(true);
  };

  // Handle date select (drag to create)
  const handleDateSelect = (selectInfo) => {
    if (!isAdmin && !driverId) return;

    setSelectedEvent(null);
    setFormData({
      driver: driverId || '',
      startTime: format(selectInfo.start, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(selectInfo.end, "yyyy-MM-dd'T'HH:mm"),
      shiftType: 'morning',
      location: '',
      vehicle: '',
      notes: '',
      breaks: []
    });
    setConflicts([]);
    setOpenDialog(true);
    selectInfo.view.calendar.unselect();
  };

  // Handle event drop (drag-drop to reschedule)
  const handleEventDrop = async (dropInfo) => {
    if (!isAdmin) {
      dropInfo.revert();
      showSnackbar('Only admins can reschedule shifts', 'warning');
      return;
    }

    try {
      const updatedData = {
        startTime: dropInfo.event.start.toISOString(),
        endTime: dropInfo.event.end.toISOString()
      };

      await axios.put(`/api/schedules/${dropInfo.event.id}`, updatedData);
      showSnackbar('Schedule updated successfully', 'success');
      fetchSchedules();
    } catch (error) {
      dropInfo.revert();
      showSnackbar(error.response?.data?.message || 'Failed to update schedule', 'error');
    }
  };

  // Handle event resize
  const handleEventResize = async (resizeInfo) => {
    if (!isAdmin) {
      resizeInfo.revert();
      showSnackbar('Only admins can modify shift duration', 'warning');
      return;
    }

    try {
      const updatedData = {
        startTime: resizeInfo.event.start.toISOString(),
        endTime: resizeInfo.event.end.toISOString()
      };

      await axios.put(`/api/schedules/${resizeInfo.event.id}`, updatedData);
      showSnackbar('Schedule updated successfully', 'success');
      fetchSchedules();
    } catch (error) {
      resizeInfo.revert();
      showSnackbar(error.response?.data?.message || 'Failed to update schedule', 'error');
    }
  };

  // Check conflicts before saving
  const checkConflicts = async (data) => {
    try {
      const response = await axios.post('/api/schedules/check-conflicts', data);
      setConflicts(response.data.conflicts || []);
      return response.data.conflicts || [];
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      // Check conflicts first
      const detectedConflicts = await checkConflicts(formData);

      // Block if there are high-severity conflicts
      const highSeverityConflicts = detectedConflicts.filter(c => c.severity === 'high');
      if (highSeverityConflicts.length > 0) {
        showSnackbar('Cannot create schedule due to conflicts', 'error');
        return;
      }

      if (selectedEvent) {
        // Update existing schedule
        await axios.put(`/api/schedules/${selectedEvent.id}`, formData);
        showSnackbar('Schedule updated successfully', 'success');
      } else {
        // Create new schedule
        await axios.post('/api/schedules', formData);
        showSnackbar('Schedule created successfully', 'success');
      }

      setOpenDialog(false);
      fetchSchedules();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedEvent) return;

    try {
      await axios.delete(`/api/schedules/${selectedEvent.id}`);
      showSnackbar('Schedule deleted successfully', 'success');
      setOpenDialog(false);
      fetchSchedules();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to delete schedule', 'error');
    }
  };

  // Clock in/out handlers
  const handleClockIn = async () => {
    if (!selectedEvent) return;

    try {
      await axios.post(`/api/schedules/${selectedEvent.id}/clock-in`);
      showSnackbar('Clocked in successfully', 'success');
      setOpenDialog(false);
      fetchSchedules();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to clock in', 'error');
    }
  };

  const handleClockOut = async () => {
    if (!selectedEvent) return;

    try {
      await axios.post(`/api/schedules/${selectedEvent.id}/clock-out`);
      showSnackbar('Clocked out successfully', 'success');
      setOpenDialog(false);
      fetchSchedules();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to clock out', 'error');
    }
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          {driverId ? 'My Schedule' : 'Team Schedule'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={filterStatus}
              label="Status Filter"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedEvent(null);
                setFormData({
                  driver: '',
                  startTime: format(new Date(), "yyyy-MM-dd'T'08:00"),
                  endTime: format(new Date(), "yyyy-MM-dd'T'17:00"),
                  shiftType: 'morning',
                  location: '',
                  vehicle: '',
                  notes: '',
                  breaks: []
                });
                setConflicts([]);
                setOpenDialog(true);
              }}
            >
              Add Schedule
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2 }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            events={events}
            editable={isAdmin}
            selectable={isAdmin}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            height="auto"
            eventClick={handleEventClick}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            nowIndicator={true}
            eventContent={(eventInfo) => (
              <Box sx={{ p: 0.5, overflow: 'hidden' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                  {eventInfo.event.title}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  {eventInfo.event.extendedProps.shiftType}
                </Typography>
                {eventInfo.event.extendedProps.overtimeHours > 0 && (
                  <Chip
                    label={`+${eventInfo.event.extendedProps.overtimeHours}h OT`}
                    size="small"
                    color="warning"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
            )}
          />
        </Paper>
      )}

      {/* Schedule Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEvent ? 'Edit Schedule' : 'Create Schedule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isAdmin && (
              <FormControl fullWidth>
                <InputLabel>Driver</InputLabel>
                <Select
                  name="driver"
                  value={formData.driver}
                  label="Driver"
                  onChange={handleFormChange}
                >
                  {drivers.map(driver => (
                    <MenuItem key={driver._id} value={driver._id}>
                      {driver.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  name="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  name="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel>Shift Type</InputLabel>
              <Select
                name="shiftType"
                value={formData.shiftType}
                label="Shift Type"
                onChange={handleFormChange}
              >
                <MenuItem value="morning">Morning</MenuItem>
                <MenuItem value="afternoon">Afternoon</MenuItem>
                <MenuItem value="evening">Evening</MenuItem>
                <MenuItem value="night">Night</MenuItem>
                <MenuItem value="split">Split</MenuItem>
                <MenuItem value="on-call">On-Call</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
            />

            {isAdmin && (
              <FormControl fullWidth>
                <InputLabel>Vehicle</InputLabel>
                <Select
                  name="vehicle"
                  value={formData.vehicle}
                  label="Vehicle"
                  onChange={handleFormChange}
                >
                  <MenuItem value="">None</MenuItem>
                  {vehicles.map(vehicle => (
                    <MenuItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.vehicleNumber || vehicle.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              multiline
              rows={3}
            />

            {/* Conflicts Display */}
            {conflicts.length > 0 && (
              <Alert severity={conflicts.some(c => c.severity === 'high') ? 'error' : 'warning'}>
                <Typography variant="subtitle2" gutterBottom>
                  Conflicts Detected:
                </Typography>
                {conflicts.map((conflict, index) => (
                  <Typography key={index} variant="body2">
                    • {conflict.description}
                  </Typography>
                ))}
              </Alert>
            )}

            {/* Clock In/Out for in-progress shifts */}
            {selectedEvent && (
              <Box sx={{ mt: 2 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Shift Actions
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {selectedEvent.extendedProps.status === 'scheduled' && (
                        <Button
                          variant="outlined"
                          startIcon={<TimeIcon />}
                          onClick={handleClockIn}
                        >
                          Clock In
                        </Button>
                      )}
                      {selectedEvent.extendedProps.status === 'in-progress' && (
                        <Button
                          variant="outlined"
                          startIcon={<CheckIcon />}
                          onClick={handleClockOut}
                        >
                          Clock Out
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {selectedEvent && isAdmin && (
            <Button onClick={handleDelete} color="error" startIcon={<DeleteIcon />}>
              Delete
            </Button>
          )}
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedEvent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ScheduleCalendar;

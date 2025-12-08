import React, { useState, useEffect, useCallback } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Tooltip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

const TimeOffManager = ({ driverId = null, isAdmin = false }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
    coverageNeeded: true
  });
  const [vacationBalance, setVacationBalance] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [coverageSuggestions, setCoverageSuggestions] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch time-off requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/time-off';
      const params = {};
      
      if (driverId) {
        url = `/api/time-off/driver/${driverId}`;
      }
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await axios.get(url, { params });
      
      if (driverId) {
        setRequests(response.data.requests || []);
        setVacationBalance(response.data.balance || null);
      } else {
        setRequests(response.data.requests || response.data);
      }
    } catch (error) {
      console.error('Error fetching time-off requests:', error);
      showSnackbar('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [driverId, filterStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      denied: 'error',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  // Get type label
  const getTypeLabel = (type) => {
    const labels = {
      vacation: 'Vacation',
      sick: 'Sick',
      personal: 'Personal',
      bereavement: 'Bereavement',
      unpaid: 'Unpaid',
      holiday: 'Holiday',
      parental: 'Parental',
      'jury-duty': 'Jury Duty'
    };
    return labels[type] || type;
  };

  // Handle create request
  const handleCreateRequest = () => {
    setSelectedRequest(null);
    setFormData({
      type: 'vacation',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
      coverageNeeded: true
    });
    setConflicts([]);
    setCoverageSuggestions([]);
    setOpenDialog(true);
  };

  // Handle view request
  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    setFormData({
      type: request.type,
      startDate: format(parseISO(request.startDate), 'yyyy-MM-dd'),
      endDate: format(parseISO(request.endDate), 'yyyy-MM-dd'),
      reason: request.reason || '',
      coverageNeeded: request.coverageNeeded
    });
    setConflicts(request.conflicts || []);

    // Fetch coverage suggestions if needed
    if (request.coverageNeeded && isAdmin) {
      try {
        const response = await axios.get(`/api/time-off/${request._id}/coverage-suggestions`);
        setCoverageSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('Error fetching coverage suggestions:', error);
      }
    }

    setOpenDialog(true);
  };

  // Check conflicts
  const checkConflicts = async () => {
    try {
      const data = {
        driver: driverId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.type
      };

      const response = await axios.post('/api/time-off/check-conflicts', data);
      setConflicts(response.data.conflicts || []);
      
      if (formData.coverageNeeded && response.data.conflicts.length === 0) {
        // Auto-fetch coverage suggestions
        const coverageData = { ...data, coverageNeeded: true };
        const coverageResponse = await axios.post('/api/time-off', coverageData);
        if (coverageResponse.data.request.coverageSuggestions) {
          setCoverageSuggestions(coverageResponse.data.request.coverageSuggestions);
        }
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        driver: driverId
      };

      if (selectedRequest) {
        // Update not typically allowed, but included for completeness
        showSnackbar('Time-off requests cannot be edited after submission', 'warning');
        return;
      } else {
        // Create new request
        await axios.post('/api/time-off', data);
        showSnackbar('Time-off request submitted successfully', 'success');
      }

      setOpenDialog(false);
      fetchRequests();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  // Handle approve
  const handleApprove = async (requestId) => {
    try {
      await axios.post(`/api/time-off/${requestId}/approve`);
      showSnackbar('Request approved successfully', 'success');
      fetchRequests();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to approve request', 'error');
    }
  };

  // Handle deny
  const handleDeny = async (requestId) => {
    const reason = prompt('Enter reason for denial:');
    if (!reason) return;

    try {
      await axios.post(`/api/time-off/${requestId}/deny`, { reason });
      showSnackbar('Request denied', 'success');
      fetchRequests();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to deny request', 'error');
    }
  };

  // Handle cancel
  const handleCancel = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    try {
      await axios.post(`/api/time-off/${requestId}/cancel`);
      showSnackbar('Request cancelled successfully', 'success');
      fetchRequests();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to cancel request', 'error');
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) {
      showSnackbar('No requests selected', 'warning');
      return;
    }

    try {
      await axios.post('/api/time-off/bulk-approve', { requestIds: selectedRequests });
      showSnackbar(`${selectedRequests.length} requests approved`, 'success');
      setSelectedRequests([]);
      fetchRequests();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Bulk approval failed', 'error');
    }
  };

  // Handle bulk deny
  const handleBulkDeny = async () => {
    if (selectedRequests.length === 0) {
      showSnackbar('No requests selected', 'warning');
      return;
    }

    const reason = prompt('Enter reason for denial:');
    if (!reason) return;

    try {
      await axios.post('/api/time-off/bulk-deny', { 
        requestIds: selectedRequests,
        reason 
      });
      showSnackbar(`${selectedRequests.length} requests denied`, 'success');
      setSelectedRequests([]);
      fetchRequests();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Bulk denial failed', 'error');
    }
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Toggle request selection
  const toggleRequestSelection = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          {driverId ? 'My Time Off' : 'Time Off Requests'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="denied">Denied</MenuItem>
            </Select>
          </FormControl>
          {driverId && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRequest}
            >
              Request Time Off
            </Button>
          )}
        </Box>
      </Box>

      {/* Vacation Balance Card */}
      {vacationBalance && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vacation Balance ({vacationBalance.year})
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Vacation Days
                  </Typography>
                  <Typography variant="h5">
                    {vacationBalance.available} / {vacationBalance.totalAllocation}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(vacationBalance.available / vacationBalance.totalAllocation) * 100}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {vacationBalance.used} used, {vacationBalance.pending} pending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Sick Days
                  </Typography>
                  <Typography variant="h5">
                    {vacationBalance.sickDaysAvailable} / {vacationBalance.sickDaysAllocation}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(vacationBalance.sickDaysAvailable / vacationBalance.sickDaysAllocation) * 100}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Personal Days
                  </Typography>
                  <Typography variant="h5">
                    {vacationBalance.personalDaysAvailable} / {vacationBalance.personalDaysAllocation}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(vacationBalance.personalDaysAvailable / vacationBalance.personalDaysAllocation) * 100}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
            {vacationBalance.carryoverFromPreviousYear > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You have {vacationBalance.carryoverFromPreviousYear} carryover days from last year 
                (expires April 1st)
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {isAdmin && selectedRequests.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography>
              {selectedRequests.length} request(s) selected
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={handleBulkApprove}
            >
              Approve All
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<CloseIcon />}
              onClick={handleBulkDeny}
            >
              Deny All
            </Button>
          </Box>
        </Paper>
      )}

      {/* Requests Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {isAdmin && <TableCell padding="checkbox"></TableCell>}
                <TableCell>Driver</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Coverage</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} align="center">
                    No time-off requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request._id}>
                    {isAdmin && (
                      <TableCell padding="checkbox">
                        {request.status === 'pending' && (
                          <Checkbox
                            checked={selectedRequests.includes(request._id)}
                            onChange={() => toggleRequestSelection(request._id)}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>{request.driver?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getTypeLabel(request.type)} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{format(parseISO(request.startDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(parseISO(request.endDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{request.totalDays}</TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status} 
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {request.coverageNeeded ? (
                        <Tooltip title="Coverage needed">
                          <PeopleIcon color="warning" fontSize="small" />
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleViewRequest(request)}
                      >
                        <ViewIcon />
                      </IconButton>
                      {isAdmin && request.status === 'pending' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(request._id)}
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeny(request._id)}
                          >
                            <CloseIcon />
                          </IconButton>
                        </>
                      )}
                      {!isAdmin && request.status === 'pending' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancel(request._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Request Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRequest ? 'View Time Off Request' : 'Request Time Off'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth disabled={!!selectedRequest}>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                label="Type"
                onChange={handleFormChange}
              >
                <MenuItem value="vacation">Vacation</MenuItem>
                <MenuItem value="sick">Sick</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="bereavement">Bereavement</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
                <MenuItem value="parental">Parental</MenuItem>
                <MenuItem value="jury-duty">Jury Duty</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  disabled={!!selectedRequest}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  disabled={!!selectedRequest}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Reason"
              name="reason"
              value={formData.reason}
              onChange={handleFormChange}
              multiline
              rows={3}
              disabled={!!selectedRequest}
            />

            <FormControl component="fieldset" disabled={!!selectedRequest}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  name="coverageNeeded"
                  checked={formData.coverageNeeded}
                  onChange={handleFormChange}
                />
                <Typography>Coverage needed</Typography>
              </Box>
            </FormControl>

            {!selectedRequest && (
              <Button onClick={checkConflicts} variant="outlined">
                Check Conflicts
              </Button>
            )}

            {/* Conflicts Display */}
            {conflicts.length > 0 && (
              <Alert severity={conflicts.some(c => c.severity === 'high') ? 'error' : 'warning'}>
                <Typography variant="subtitle2" gutterBottom>
                  {conflicts.some(c => c.severity === 'high') ? 'Blocking Issues:' : 'Warnings:'}
                </Typography>
                {conflicts.map((conflict, index) => (
                  <Typography key={index} variant="body2">
                    • {conflict.description}
                  </Typography>
                ))}
              </Alert>
            )}

            {/* Coverage Suggestions */}
            {coverageSuggestions.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Suggested Coverage
                  </Typography>
                  <List dense>
                    {coverageSuggestions.slice(0, 5).map((suggestion, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={suggestion.driver.name}
                          secondary={`Score: ${suggestion.score}/100 - ${suggestion.reason}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Request Details */}
            {selectedRequest && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Request Details
                  </Typography>
                  <Typography variant="body2">
                    Status: <Chip label={selectedRequest.status} color={getStatusColor(selectedRequest.status)} size="small" />
                  </Typography>
                  {selectedRequest.approvedBy && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Approved by: {selectedRequest.approvedBy.name} on {format(parseISO(selectedRequest.approvedAt), 'MMM dd, yyyy')}
                    </Typography>
                  )}
                  {selectedRequest.deniedBy && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Denied by: {selectedRequest.deniedBy.name} on {format(parseISO(selectedRequest.deniedAt), 'MMM dd, yyyy')}
                      <br />
                      Reason: {selectedRequest.denialReason}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            {selectedRequest ? 'Close' : 'Cancel'}
          </Button>
          {!selectedRequest && (
            <Button onClick={handleSubmit} variant="contained">
              Submit Request
            </Button>
          )}
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

export default TimeOffManager;

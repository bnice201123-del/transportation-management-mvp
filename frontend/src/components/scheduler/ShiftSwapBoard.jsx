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
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

const ShiftSwapBoard = ({ driverId = null, isAdmin = false }) => {
  const [swaps, setSwaps] = useState([]);
  const [openSwaps, setOpenSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [formData, setFormData] = useState({
    originalShift: '',
    targetDriver: '',
    swapType: 'one-way',
    reason: ''
  });
  const [myShifts, setMyShifts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch shift swaps
  const fetchSwaps = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (driverId) params.driver = driverId;

      const response = await axios.get('/api/shift-swaps', { params });
      setSwaps(response.data.swaps || response.data);
    } catch (error) {
      console.error('Error fetching swaps:', error);
      showSnackbar('Failed to load shift swaps', 'error');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  const fetchOpenSwaps = useCallback(async () => {
    try {
      const response = await axios.get('/api/shift-swaps/open-offers');
      setOpenSwaps(response.data.swaps || response.data);
    } catch (error) {
      console.error('Error fetching open swaps:', error);
    }
  }, []);

  const fetchMyShifts = useCallback(async () => {
    try {
      const response = await axios.get(`/api/schedules/driver/${driverId}`);
      setMyShifts(response.data.schedules || []);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  }, [driverId]);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users/drivers');
      setDrivers(response.data.drivers || response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  }, []);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchSwaps();
    fetchOpenSwaps();
    if (driverId) {
      fetchMyShifts();
    }
    if (isAdmin) {
      fetchDrivers();
    }
  }, [driverId, isAdmin, fetchSwaps, fetchOpenSwaps, fetchMyShifts, fetchDrivers]);

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'pending-driver': 'warning',
      'pending-admin': 'info',
      'approved': 'success',
      'denied': 'error',
      'cancelled': 'default',
      'expired': 'default'
    };
    return colors[status] || 'default';
  };

  // Get swap type label
  const getSwapTypeLabel = (type) => {
    const labels = {
      'one-way': 'One-Way',
      'mutual': 'Mutual',
      'open-offer': 'Open Offer'
    };
    return labels[type] || type;
  };

  // Handle create swap
  const handleCreateSwap = () => {
    setSelectedSwap(null);
    setFormData({
      originalShift: '',
      targetDriver: '',
      swapType: 'one-way',
      reason: ''
    });
    setOpenDialog(true);
  };

  // Handle view swap
  const handleViewSwap = (swap) => {
    setSelectedSwap(swap);
    setOpenDialog(true);
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      await axios.post('/api/shift-swaps', formData);
      showSnackbar('Shift swap request created successfully', 'success');
      setOpenDialog(false);
      fetchSwaps();
      fetchOpenSwaps();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to create swap request', 'error');
    }
  };

  // Handle driver response (accept/decline)
  const handleDriverResponse = async (swapId, status) => {
    try {
      await axios.post(`/api/shift-swaps/${swapId}/driver-response`, {
        status,
        notes: status === 'accepted' ? 'Happy to help!' : 'Sorry, cannot accept'
      });
      showSnackbar(`Swap request ${status}`, 'success');
      fetchSwaps();
      fetchOpenSwaps();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  // Handle admin response (approve/deny)
  const handleAdminResponse = async (swapId, status) => {
    const notes = status === 'approved' 
      ? 'Approved by admin' 
      : prompt('Enter reason for denial:');
    
    if (status === 'denied' && !notes) return;

    try {
      await axios.post(`/api/shift-swaps/${swapId}/admin-response`, {
        status,
        notes
      });
      showSnackbar(`Swap request ${status}`, 'success');
      fetchSwaps();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  // Handle cancel
  const handleCancel = async (swapId) => {
    if (!window.confirm('Are you sure you want to cancel this swap request?')) return;

    try {
      await axios.post(`/api/shift-swaps/${swapId}/cancel`);
      showSnackbar('Swap request cancelled', 'success');
      fetchSwaps();
      fetchOpenSwaps();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to cancel swap', 'error');
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
          Shift Swap Marketplace
        </Typography>
        {driverId && (
          <Button
            variant="contained"
            startIcon={<SwapIcon />}
            onClick={handleCreateSwap}
          >
            Request Swap
          </Button>
        )}
      </Box>

      {/* Open Offers Section */}
      {openSwaps.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Open Swap Offers
          </Typography>
          <Grid container spacing={2}>
            {openSwaps.map((swap) => (
              <Grid item xs={12} sm={6} md={4} key={swap._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        label={getSwapTypeLabel(swap.swapType)} 
                        size="small" 
                        color="primary"
                      />
                      <Chip 
                        label={swap.status} 
                        size="small" 
                        color={getStatusColor(swap.status)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      From: {swap.requestingDriver?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {format(parseISO(swap.originalShift?.startTime || new Date()), 'MMM dd, yyyy h:mm a')}
                    </Typography>
                    <Typography variant="body2">
                      Shift Type: {swap.originalShift?.shiftType || 'N/A'}
                    </Typography>
                    {swap.reason && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Reason: {swap.reason}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Expires: {format(parseISO(swap.expiresAt), 'MMM dd, h:mm a')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    {driverId && swap.requestingDriver?._id !== driverId && (
                      <>
                        <Button 
                          size="small" 
                          color="success"
                          onClick={() => handleDriverResponse(swap._id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="small"
                          onClick={() => handleViewSwap(swap)}
                        >
                          View Details
                        </Button>
                      </>
                    )}
                    {swap.requestingDriver?._id === driverId && (
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleCancel(swap._id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* My Swaps / All Swaps Section */}
      <Typography variant="h6" gutterBottom>
        {driverId ? 'My Swap Requests' : 'All Swap Requests'}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : swaps.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No shift swap requests found
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {swaps.map((swap) => (
            <Grid item xs={12} sm={6} md={4} key={swap._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip 
                      label={getSwapTypeLabel(swap.swapType)} 
                      size="small" 
                      color="primary"
                    />
                    <Chip 
                      label={swap.status} 
                      size="small" 
                      color={getStatusColor(swap.status)}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Requesting: {swap.requestingDriver?.name || 'Unknown'}
                  </Typography>
                  {swap.targetDriver && (
                    <Typography variant="body2" color="text.secondary">
                      Target: {swap.targetDriver.name}
                    </Typography>
                  )}
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Original Shift:
                  </Typography>
                  <Typography variant="body2">
                    {format(parseISO(swap.originalShift?.startTime || new Date()), 'MMM dd, h:mm a')}
                  </Typography>
                  {swap.proposedShift && (
                    <>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        Proposed Shift:
                      </Typography>
                      <Typography variant="body2">
                        {format(parseISO(swap.proposedShift.startTime), 'MMM dd, h:mm a')}
                      </Typography>
                    </>
                  )}
                  {swap.conflicts && swap.conflicts.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {swap.conflicts.length} conflict(s) detected
                    </Alert>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleViewSwap(swap)}>
                    View Details
                  </Button>
                  {isAdmin && swap.status === 'pending-admin' && (
                    <>
                      <Button 
                        size="small" 
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleAdminResponse(swap._id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => handleAdminResponse(swap._id, 'denied')}
                      >
                        Deny
                      </Button>
                    </>
                  )}
                  {!isAdmin && swap.status === 'pending-driver' && swap.targetDriver?._id === driverId && (
                    <>
                      <Button 
                        size="small" 
                        color="success"
                        onClick={() => handleDriverResponse(swap._id, 'accepted')}
                      >
                        Accept
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleDriverResponse(swap._id, 'declined')}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {swap.requestingDriver?._id === driverId && ['pending-driver', 'pending-admin'].includes(swap.status) && (
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleCancel(swap._id)}
                    >
                      Cancel
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/View Swap Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSwap ? 'Swap Request Details' : 'Create Swap Request'}
        </DialogTitle>
        <DialogContent>
          {selectedSwap ? (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Status: <Chip label={selectedSwap.status} color={getStatusColor(selectedSwap.status)} size="small" />
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Requesting Driver:</strong> {selectedSwap.requestingDriver?.name}
              </Typography>
              {selectedSwap.targetDriver && (
                <Typography variant="body2">
                  <strong>Target Driver:</strong> {selectedSwap.targetDriver.name}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Original Shift:</strong><br />
                {format(parseISO(selectedSwap.originalShift?.startTime || new Date()), 'MMMM dd, yyyy h:mm a')}
              </Typography>
              {selectedSwap.proposedShift && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Proposed Shift:</strong><br />
                  {format(parseISO(selectedSwap.proposedShift.startTime), 'MMMM dd, yyyy h:mm a')}
                </Typography>
              )}
              {selectedSwap.reason && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Reason:</strong> {selectedSwap.reason}
                </Typography>
              )}
              {selectedSwap.driverResponse && (
                <Alert severity={selectedSwap.driverResponse.status === 'accepted' ? 'success' : 'error'} sx={{ mt: 2 }}>
                  Driver {selectedSwap.driverResponse.status} on {format(parseISO(selectedSwap.driverResponse.respondedAt), 'MMM dd, yyyy')}
                </Alert>
              )}
              {selectedSwap.adminResponse && (
                <Alert severity={selectedSwap.adminResponse.status === 'approved' ? 'success' : 'error'} sx={{ mt: 2 }}>
                  Admin {selectedSwap.adminResponse.status}: {selectedSwap.adminResponse.notes}
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>My Shift to Swap</InputLabel>
                <Select
                  name="originalShift"
                  value={formData.originalShift}
                  label="My Shift to Swap"
                  onChange={handleFormChange}
                >
                  {myShifts.map(shift => (
                    <MenuItem key={shift._id} value={shift._id}>
                      {format(parseISO(shift.startTime), 'MMM dd, yyyy h:mm a')} - {shift.shiftType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Swap Type</InputLabel>
                <Select
                  name="swapType"
                  value={formData.swapType}
                  label="Swap Type"
                  onChange={handleFormChange}
                >
                  <MenuItem value="one-way">One-Way (Give away shift)</MenuItem>
                  <MenuItem value="mutual">Mutual (Exchange shifts)</MenuItem>
                  <MenuItem value="open-offer">Open Offer (Anyone can take)</MenuItem>
                </Select>
              </FormControl>

              {formData.swapType !== 'open-offer' && (
                <FormControl fullWidth>
                  <InputLabel>Target Driver</InputLabel>
                  <Select
                    name="targetDriver"
                    value={formData.targetDriver}
                    label="Target Driver"
                    onChange={handleFormChange}
                  >
                    {drivers.filter(d => d._id !== driverId).map(driver => (
                      <MenuItem key={driver._id} value={driver._id}>
                        {driver.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                fullWidth
                label="Reason"
                name="reason"
                value={formData.reason}
                onChange={handleFormChange}
                multiline
                rows={3}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            {selectedSwap ? 'Close' : 'Cancel'}
          </Button>
          {!selectedSwap && (
            <Button onClick={handleSubmit} variant="contained">
              Create Request
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

export default ShiftSwapBoard;

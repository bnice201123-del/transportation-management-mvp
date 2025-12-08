import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper
} from '@mui/material';
import {
  Devices as DevicesIcon,
  PhoneAndroid as PhoneIcon,
  Laptop as LaptopIcon,
  Tablet as TabletIcon,
  DesktopWindows as DesktopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Verified as VerifiedIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import axios from '../../config/axios';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

const TrustedDevicesManager = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [stats, setStats] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [rememberDuration, setRememberDuration] = useState(30); // days

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesRes, currentRes, statsRes] = await Promise.all([
        axios.get('/api/trusted-devices'),
        axios.get('/api/trusted-devices/current'),
        axios.get('/api/trusted-devices/stats')
      ]);
      setDevices(devicesRes.data.devices || []);
      setCurrentDevice(currentRes.data.device);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching device data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameDevice = async () => {
    try {
      await axios.put(`/api/trusted-devices/${selectedDevice._id}/rename`, {
        customName: newDeviceName
      });
      fetchData();
      setRenameDialogOpen(false);
      setSelectedDevice(null);
      setNewDeviceName('');
    } catch (error) {
      console.error('Error renaming device:', error);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to remove this device? You will need to verify it again on next login.')) {
      try {
        await axios.delete(`/api/trusted-devices/${deviceId}`);
        fetchData();
      } catch (error) {
        console.error('Error removing device:', error);
      }
    }
  };

  const handleToggleRememberDevice = async (deviceId, enabled) => {
    try {
      if (enabled) {
        await axios.post(`/api/trusted-devices/${deviceId}/remember`, {
          duration: rememberDuration
        });
      } else {
        await axios.delete(`/api/trusted-devices/${deviceId}/remember`);
      }
      fetchData();
    } catch (error) {
      console.error('Error toggling remember device:', error);
    }
  };

  const handleVerifyDevice = async (deviceId) => {
    try {
      await axios.post(`/api/trusted-devices/${deviceId}/verify`);
      fetchData();
    } catch (error) {
      console.error('Error verifying device:', error);
    }
  };

  const handleBlockDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to block this device? It will not be able to access your account.')) {
      try {
        await axios.post(`/api/trusted-devices/${deviceId}/block`);
        fetchData();
      } catch (error) {
        console.error('Error blocking device:', error);
      }
    }
  };

  const getDeviceIcon = (deviceType) => {
    const type = deviceType?.toLowerCase() || '';
    if (type.includes('mobile') || type.includes('phone')) return <PhoneIcon />;
    if (type.includes('tablet') || type.includes('ipad')) return <TabletIcon />;
    if (type.includes('laptop')) return <LaptopIcon />;
    return <DesktopIcon />;
  };

  const getTrustLevelColor = (level) => {
    switch (level) {
      case 'verified': return 'success';
      case 'trusted': return 'primary';
      case 'recognized': return 'info';
      case 'suspicious': return 'warning';
      case 'unknown': return 'default';
      default: return 'default';
    }
  };

  const getTrustLevelIcon = (level) => {
    switch (level) {
      case 'verified': return <VerifiedIcon />;
      case 'trusted': return <CheckCircleIcon />;
      case 'recognized': return <CheckCircleIcon />;
      case 'suspicious': return <WarningIcon />;
      case 'unknown': return <WarningIcon />;
      default: return null;
    }
  };

  const getDeviceDisplayName = (device) => {
    if (device.customName) return device.customName;
    const browser = device.deviceInfo?.browser || 'Unknown Browser';
    const os = device.deviceInfo?.os || 'Unknown OS';
    const deviceType = device.deviceInfo?.device || 'Unknown Device';
    return `${browser} on ${os} (${deviceType})`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          <DevicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Trusted Devices
        </Typography>
        <IconButton onClick={fetchData}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{stats.totalDevices}</Typography>
                <Typography variant="body2" color="text.secondary">Total Devices</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{stats.trustedDevices}</Typography>
                <Typography variant="body2" color="text.secondary">Trusted</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{stats.verifiedDevices}</Typography>
                <Typography variant="body2" color="text.secondary">Verified</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{stats.suspiciousDevices}</Typography>
                <Typography variant="body2" color="text.secondary">Suspicious</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Current Device Alert */}
      {currentDevice && (
        <Alert severity="info" icon={<DevicesIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Current Device:</strong> {getDeviceDisplayName(currentDevice)}
          </Typography>
          <Typography variant="caption" display="block">
            Trust Level: {currentDevice.trustLevel} | Trust Score: {currentDevice.trustScore}/100
          </Typography>
        </Alert>
      )}

      {/* Devices List */}
      <Grid container spacing={3}>
        {devices.map((device) => (
          <Grid item xs={12} md={6} key={device._id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="flex-start" mb={2}>
                  <Box sx={{ mr: 2, fontSize: 40, color: 'primary.main' }}>
                    {getDeviceIcon(device.deviceInfo?.device)}
                  </Box>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" gutterBottom>
                        {getDeviceDisplayName(device)}
                      </Typography>
                      {currentDevice?._id === device._id && (
                        <Chip label="Current" color="primary" size="small" />
                      )}
                    </Box>
                    <Box display="flex" gap={1} mb={1}>
                      <Chip
                        icon={getTrustLevelIcon(device.trustLevel)}
                        label={device.trustLevel}
                        color={getTrustLevelColor(device.trustLevel)}
                        size="small"
                      />
                      {device.isBlocked && (
                        <Chip
                          icon={<BlockIcon />}
                          label="Blocked"
                          color="error"
                          size="small"
                        />
                      )}
                      {device.verificationStatus?.isVerified && (
                        <Chip
                          icon={<VerifiedIcon />}
                          label="Verified"
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Device Details */}
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Browser"
                      secondary={device.deviceInfo?.browser || 'Unknown'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Operating System"
                      secondary={device.deviceInfo?.os || 'Unknown'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Seen"
                      secondary={
                        device.lastSeen
                          ? formatDistanceToNow(parseISO(device.lastSeen), { addSuffix: true })
                          : 'Never'
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Location"
                      secondary={
                        device.lastLocation
                          ? `${device.lastLocation.city}, ${device.lastLocation.country}`
                          : 'Unknown'
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Trust Score"
                      secondary={`${device.trustScore}/100`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Login Count"
                      secondary={device.loginCount}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="First Seen"
                      secondary={format(parseISO(device.firstSeen), 'MMM dd, yyyy')}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Remember Device Toggle */}
                <Box mb={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={device.rememberDevice?.enabled || false}
                        onChange={(e) => handleToggleRememberDevice(device._id, e.target.checked)}
                        disabled={device.isBlocked}
                      />
                    }
                    label="Remember this device"
                  />
                  {device.rememberDevice?.enabled && device.rememberDevice?.expiresAt && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Expires: {format(parseISO(device.rememberDevice.expiresAt), 'MMM dd, yyyy')}
                    </Typography>
                  )}
                </Box>

                {/* Actions */}
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Tooltip title="Rename Device">
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setSelectedDevice(device);
                        setNewDeviceName(device.customName || '');
                        setRenameDialogOpen(true);
                      }}
                    >
                      Rename
                    </Button>
                  </Tooltip>

                  {device.trustLevel !== 'verified' && !device.isBlocked && (
                    <Tooltip title="Verify Device">
                      <Button
                        size="small"
                        startIcon={<VerifiedIcon />}
                        color="success"
                        onClick={() => handleVerifyDevice(device._id)}
                      >
                        Verify
                      </Button>
                    </Tooltip>
                  )}

                  {!device.isBlocked && currentDevice?._id !== device._id && (
                    <Tooltip title="Block Device">
                      <Button
                        size="small"
                        startIcon={<BlockIcon />}
                        color="warning"
                        onClick={() => handleBlockDevice(device._id)}
                      >
                        Block
                      </Button>
                    </Tooltip>
                  )}

                  {currentDevice?._id !== device._id && (
                    <Tooltip title="Remove Device">
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleRemoveDevice(device._id)}
                      >
                        Remove
                      </Button>
                    </Tooltip>
                  )}
                </Box>

                {/* Fingerprint Changes Warning */}
                {device.fingerprintChanges && device.fingerprintChanges.length > 0 && (
                  <Alert severity="warning" icon={<HistoryIcon />} sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      Device fingerprint has changed {device.fingerprintChanges.length} time(s).
                      This may indicate suspicious activity.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {devices.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DevicesIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No devices found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your devices will appear here after you log in.
          </Typography>
        </Paper>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Device</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Device Name"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            placeholder="e.g., My Work Laptop"
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Give this device a friendly name to easily identify it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameDevice} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remember Duration Setting */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Settings</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              type="number"
              label="Remember Device Duration (days)"
              value={rememberDuration}
              onChange={(e) => setRememberDuration(parseInt(e.target.value))}
              inputProps={{ min: 1, max: 365 }}
              sx={{ width: 250 }}
            />
            <Typography variant="caption" color="text.secondary">
              Choose how long to remember your devices (1-365 days)
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TrustedDevicesManager;

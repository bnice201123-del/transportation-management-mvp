import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Button,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Error as ErrorIcon,
  GetApp as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  LocationOn as LocationIcon,
  DevicesOther as DevicesIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from '../../config/axios';
import { format, parseISO } from 'date-fns';

const LoginAttemptMonitor = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [suspiciousAttempts, setSuspiciousAttempts] = useState([]);
  const [hourlyTrends, setHourlyTrends] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch all data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [attemptsRes, dashboardRes, suspiciousRes, trendsRes] = await Promise.all([
        axios.get('/api/login-attempts', { params: filters }),
        axios.get('/api/login-attempts/dashboard'),
        axios.get('/api/login-attempts/suspicious'),
        axios.get('/api/login-attempts/hourly-trends')
      ]);

      setAttempts(attemptsRes.data.attempts || []);
      setDashboardData(dashboardRes.data);
      setSuspiciousAttempts(suspiciousRes.data.attempts || []);
      setHourlyTrends(trendsRes.data.trends || []);
    } catch (error) {
      console.error('Error fetching login attempt data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewDetails = (attempt) => {
    setSelectedAttempt(attempt);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'blocked': return 'error';
      case 'suspicious': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircleIcon fontSize="small" />;
      case 'failed': return <ErrorIcon fontSize="small" />;
      case 'blocked': return <BlockIcon fontSize="small" />;
      case 'suspicious': return <WarningIcon fontSize="small" />;
      default: return null;
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 70) return 'error';
    if (score >= 40) return 'warning';
    return 'success';
  };

  // Dashboard Tab
  const renderDashboard = () => {
    if (!dashboardData) return <CircularProgress />;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SecurityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Attempts</Typography>
              </Box>
              <Typography variant="h3">{dashboardData.totalAttempts}</Typography>
              <Typography variant="body2" color="text.secondary">
                Last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Success Rate</Typography>
              </Box>
              <Typography variant="h3">{dashboardData.successRate}%</Typography>
              <Typography variant="body2" color="text.secondary">
                {dashboardData.successfulAttempts} successful
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Suspicious</Typography>
              </Box>
              <Typography variant="h3">{dashboardData.suspiciousCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Flagged activities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <BlockIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Blocked</Typography>
              </Box>
              <Typography variant="h3">{dashboardData.blockedCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Security blocks
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Hourly Trends Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Login Activity Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="successful" stroke="#4caf50" name="Successful" />
                  <Line type="monotone" dataKey="failed" stroke="#f44336" name="Failed" />
                  <Line type="monotone" dataKey="suspicious" stroke="#ff9800" name="Suspicious" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Device Breakdown */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DevicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Device Types
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.deviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Locations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Login Locations
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardData.topLocations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#2196f3" name="Login Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Suspicious Activity */}
        {suspiciousAttempts.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning" icon={<WarningIcon />}>
              <Typography variant="h6" gutterBottom>
                Recent Suspicious Activity
              </Typography>
              {suspiciousAttempts.slice(0, 5).map((attempt, index) => (
                <Box key={attempt._id} sx={{ mt: index > 0 ? 1 : 0 }}>
                  <Typography variant="body2">
                    <strong>{attempt.identifier}</strong> from {attempt.location?.city || 'Unknown'} - 
                    Risk Score: {attempt.riskScore}
                  </Typography>
                </Box>
              ))}
            </Alert>
          </Grid>
        )}
      </Grid>
    );
  };

  // All Attempts Tab
  const renderAllAttempts = () => {
    return (
      <Box>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  size="small"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="success">Successful</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="suspicious">Suspicious</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search identifier..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Attempts Table */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Login Attempts ({attempts.length})</Typography>
              <Box>
                <Tooltip title="Auto-refresh">
                  <IconButton
                    color={autoRefresh ? 'primary' : 'default'}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh now">
                  <IconButton onClick={fetchData}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Identifier</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Risk Score</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt._id}>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(attempt.status)}
                          label={attempt.status}
                          color={getStatusColor(attempt.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{attempt.identifier}</TableCell>
                      <TableCell>
                        <Chip label={attempt.attemptType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {attempt.deviceInfo?.device || 'Unknown'} - {attempt.deviceInfo?.os || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {attempt.location?.city || 'Unknown'}, {attempt.location?.country || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LinearProgress
                            variant="determinate"
                            value={attempt.riskScore}
                            color={getRiskScoreColor(attempt.riskScore)}
                            sx={{ width: 60, mr: 1 }}
                          />
                          <Typography variant="caption">{attempt.riskScore}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(attempt.createdAt), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleViewDetails(attempt)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Suspicious Activity Tab
  const renderSuspiciousActivity = () => {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6">Suspicious Activity Monitoring</Typography>
          <Typography variant="body2">
            These login attempts have been flagged as suspicious based on risk analysis, 
            unusual patterns, or security rules.
          </Typography>
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Flagged Attempts ({suspiciousAttempts.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Identifier</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Risk Score</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suspiciousAttempts.map((attempt) => (
                    <TableRow key={attempt._id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <WarningIcon color="warning" sx={{ mr: 1 }} />
                          {attempt.identifier}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {attempt.metadata?.suspiciousReasons?.join(', ') || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={attempt.riskScore}
                          color={getRiskScoreColor(attempt.riskScore)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {attempt.deviceInfo?.device} - {attempt.deviceInfo?.browser}
                      </TableCell>
                      <TableCell>
                        {attempt.location?.city}, {attempt.location?.country}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(attempt.createdAt), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleViewDetails(attempt)}
                        >
                          Investigate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Details Dialog
  const renderDetailsDialog = () => {
    if (!selectedAttempt) return null;

    return (
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Login Attempt Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip
                icon={getStatusIcon(selectedAttempt.status)}
                label={selectedAttempt.status}
                color={getStatusColor(selectedAttempt.status)}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Identifier</Typography>
              <Typography>{selectedAttempt.identifier}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Attempt Type</Typography>
              <Typography>{selectedAttempt.attemptType}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Risk Score</Typography>
              <Box display="flex" alignItems="center">
                <LinearProgress
                  variant="determinate"
                  value={selectedAttempt.riskScore}
                  color={getRiskScoreColor(selectedAttempt.riskScore)}
                  sx={{ width: 100, mr: 1 }}
                />
                <Typography>{selectedAttempt.riskScore}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Time</Typography>
              <Typography>
                {format(parseISO(selectedAttempt.createdAt), 'MMM dd, yyyy HH:mm:ss')}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Device Information</Typography>
              <Typography>
                {selectedAttempt.deviceInfo?.browser} on {selectedAttempt.deviceInfo?.os} 
                ({selectedAttempt.deviceInfo?.device})
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Location</Typography>
              <Typography>
                {selectedAttempt.location?.city}, {selectedAttempt.location?.region}, 
                {selectedAttempt.location?.country}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">IP Address</Typography>
              <Typography>{selectedAttempt.ipAddress}</Typography>
            </Grid>
            {selectedAttempt.metadata && Object.keys(selectedAttempt.metadata).length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Additional Metadata</Typography>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(selectedAttempt.metadata, null, 2)}
                </pre>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading && !dashboardData) {
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
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Login Attempt Monitor
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Dashboard" />
        <Tab label="All Attempts" />
        <Tab label="Suspicious Activity" />
      </Tabs>

      {activeTab === 0 && renderDashboard()}
      {activeTab === 1 && renderAllAttempts()}
      {activeTab === 2 && renderSuspiciousActivity()}

      {renderDetailsDialog()}
    </Box>
  );
};

export default LoginAttemptMonitor;

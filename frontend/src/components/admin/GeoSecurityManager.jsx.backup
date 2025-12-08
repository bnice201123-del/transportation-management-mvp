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
  IconButton,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Autocomplete,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Refresh as RefreshIcon,
  Public as GlobalIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import axios from '../../config/axios';

const GeoSecurityManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [users, setUsers] = useState([]);
  const [testResults, setTestResults] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'allow',
    scope: { type: 'global', targetRoles: [], targetUsers: [] },
    conditions: {
      geographic: {
        countries: [],
        regions: [],
        cities: [],
        coordinates: { latitude: '', longitude: '', radiusKm: '' },
        ipRanges: []
      },
      timeRestrictions: {
        daysOfWeek: [],
        timeRanges: [],
        dateRanges: []
      }
    },
    actions: {
      requireTwoFactor: false,
      notifyAdmin: false,
      notifyUser: false,
      logEvent: true,
      customMessage: ''
    },
    priority: 0,
    isActive: true
  });

  // Test form state
  const [testData, setTestData] = useState({
    userId: '',
    userRole: '',
    latitude: '',
    longitude: '',
    country: '',
    city: '',
    ipAddress: ''
  });

  const countries = ['US', 'CA', 'UK', 'DE', 'FR', 'JP', 'AU', 'BR', 'IN', 'CN'];
  const roles = ['admin', 'dispatcher', 'driver', 'scheduler', 'rider'];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, statsRes] = await Promise.all([
        axios.get('/api/geo-security'),
        axios.get('/api/geo-security/stats')
      ]);
      setRules(rulesRes.data.rules || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching geo-security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenRuleDialog = (rule = null) => {
    if (rule) {
      setSelectedRule(rule);
      setFormData(rule);
    } else {
      setSelectedRule(null);
      setFormData({
        name: '',
        description: '',
        ruleType: 'allow',
        scope: { type: 'global', targetRoles: [], targetUsers: [] },
        conditions: {
          geographic: {
            countries: [],
            regions: [],
            cities: [],
            coordinates: { latitude: '', longitude: '', radiusKm: '' },
            ipRanges: []
          },
          timeRestrictions: {
            daysOfWeek: [],
            timeRanges: [],
            dateRanges: []
          }
        },
        actions: {
          requireTwoFactor: false,
          notifyAdmin: false,
          notifyUser: false,
          logEvent: true,
          customMessage: ''
        },
        priority: 0,
        isActive: true
      });
    }
    setRuleDialogOpen(true);
  };

  const handleCloseRuleDialog = () => {
    setRuleDialogOpen(false);
    setSelectedRule(null);
  };

  const handleSaveRule = async () => {
    try {
      if (selectedRule) {
        await axios.put(`/api/geo-security/${selectedRule._id}`, formData);
      } else {
        await axios.post('/api/geo-security', formData);
      }
      fetchData();
      handleCloseRuleDialog();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await axios.delete(`/api/geo-security/${ruleId}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  const handleToggleRule = async (ruleId, isActive) => {
    try {
      if (isActive) {
        await axios.post(`/api/geo-security/${ruleId}/enable`);
      } else {
        await axios.post(`/api/geo-security/${ruleId}/disable`);
      }
      fetchData();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleTestRule = async () => {
    try {
      const res = await axios.post('/api/geo-security/test', testData);
      setTestResults(res.data);
    } catch (error) {
      console.error('Error testing rule:', error);
      setTestResults({ error: 'Failed to test rules' });
    }
  };

  const getRuleTypeIcon = (type) => {
    switch (type) {
      case 'allow': return <CheckIcon />;
      case 'deny': return <BlockIcon />;
      case 'require_2fa': return <SecurityIcon />;
      case 'alert': return <WarningIcon />;
      default: return null;
    }
  };

  const getRuleTypeColor = (type) => {
    switch (type) {
      case 'allow': return 'success';
      case 'deny': return 'error';
      case 'require_2fa': return 'warning';
      case 'alert': return 'info';
      default: return 'default';
    }
  };

  const getScopeIcon = (scopeType) => {
    switch (scopeType) {
      case 'global': return <GlobalIcon />;
      case 'role': return <GroupIcon />;
      case 'user': return <PersonIcon />;
      default: return null;
    }
  };

  // Active Rules Tab
  const renderActiveRules = () => {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Active Rules ({rules.filter(r => r.isActive).length})</Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenRuleDialog()}
            >
              Create Rule
            </Button>
            <IconButton onClick={fetchData} sx={{ ml: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{stats.totalRules}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Rules</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{stats.activeRules}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Rules</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{stats.globalRules}</Typography>
                  <Typography variant="body2" color="text.secondary">Global Rules</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4">{stats.userSpecificRules}</Typography>
                  <Typography variant="body2" color="text.secondary">User-Specific</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Scope</TableCell>
                <TableCell>Conditions</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule._id}>
                  <TableCell>
                    <Switch
                      checked={rule.isActive}
                      onChange={(e) => handleToggleRule(rule._id, e.target.checked)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{rule.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rule.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getRuleTypeIcon(rule.ruleType)}
                      label={rule.ruleType}
                      color={getRuleTypeColor(rule.ruleType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getScopeIcon(rule.scope?.type)}
                      label={rule.scope?.type || 'global'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {rule.conditions?.geographic?.countries?.length > 0 && (
                        <Chip
                          label={`${rule.conditions.geographic.countries.length} countries`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )}
                      {rule.conditions?.geographic?.cities?.length > 0 && (
                        <Chip
                          label={`${rule.conditions.geographic.cities.length} cities`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )}
                      {rule.conditions?.timeRestrictions?.daysOfWeek?.length > 0 && (
                        <Chip
                          label="Time restricted"
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenRuleDialog(rule)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeleteRule(rule._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Create/Edit Rule Dialog
  const renderRuleDialog = () => {
    return (
      <Dialog open={ruleDialogOpen} onClose={handleCloseRuleDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedRule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            {/* Rule Type and Scope */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Rule Type"
                value={formData.ruleType}
                onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
              >
                <MenuItem value="allow">Allow</MenuItem>
                <MenuItem value="deny">Deny</MenuItem>
                <MenuItem value="require_2fa">Require 2FA</MenuItem>
                <MenuItem value="alert">Alert Only</MenuItem>
                <MenuItem value="challenge">Challenge</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Scope"
                value={formData.scope.type}
                onChange={(e) => setFormData({
                  ...formData,
                  scope: { ...formData.scope, type: e.target.value }
                })}
              >
                <MenuItem value="global">Global</MenuItem>
                <MenuItem value="role">Role-Based</MenuItem>
                <MenuItem value="user">User-Specific</MenuItem>
              </TextField>
            </Grid>

            {/* Role Selection */}
            {formData.scope.type === 'role' && (
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={roles}
                  value={formData.scope.targetRoles}
                  onChange={(e, newValue) => setFormData({
                    ...formData,
                    scope: { ...formData.scope, targetRoles: newValue }
                  })}
                  renderInput={(params) => <TextField {...params} label="Target Roles" />}
                />
              </Grid>
            )}

            {/* User Selection */}
            {formData.scope.type === 'user' && (
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={users}
                  getOptionLabel={(option) => option.username || option.email}
                  value={users.filter(u => formData.scope.targetUsers.includes(u._id))}
                  onChange={(e, newValue) => setFormData({
                    ...formData,
                    scope: { ...formData.scope, targetUsers: newValue.map(u => u._id) }
                  })}
                  renderInput={(params) => <TextField {...params} label="Target Users" />}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Geographic Conditions" icon={<LocationIcon />} />
              </Divider>
            </Grid>

            {/* Countries */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={countries}
                value={formData.conditions.geographic.countries}
                onChange={(e, newValue) => setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    geographic: { ...formData.conditions.geographic, countries: newValue }
                  }
                })}
                renderInput={(params) => <TextField {...params} label="Countries (ISO codes)" />}
              />
            </Grid>

            {/* Cities */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.conditions.geographic.cities}
                onChange={(e, newValue) => setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    geographic: { ...formData.conditions.geographic, cities: newValue }
                  }
                })}
                renderInput={(params) => <TextField {...params} label="Cities" />}
              />
            </Grid>

            {/* Geofencing */}
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Latitude"
                value={formData.conditions.geographic.coordinates.latitude}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    geographic: {
                      ...formData.conditions.geographic,
                      coordinates: { ...formData.conditions.geographic.coordinates, latitude: e.target.value }
                    }
                  }
                })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Longitude"
                value={formData.conditions.geographic.coordinates.longitude}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    geographic: {
                      ...formData.conditions.geographic,
                      coordinates: { ...formData.conditions.geographic.coordinates, longitude: e.target.value }
                    }
                  }
                })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Radius (km)"
                value={formData.conditions.geographic.coordinates.radiusKm}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    geographic: {
                      ...formData.conditions.geographic,
                      coordinates: { ...formData.conditions.geographic.coordinates, radiusKm: e.target.value }
                    }
                  }
                })}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Time Restrictions" icon={<ScheduleIcon />} />
              </Divider>
            </Grid>

            {/* Days of Week */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={daysOfWeek}
                value={formData.conditions.timeRestrictions.daysOfWeek.map(d => daysOfWeek[d])}
                onChange={(e, newValue) => setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    timeRestrictions: {
                      ...formData.conditions.timeRestrictions,
                      daysOfWeek: newValue.map(day => daysOfWeek.indexOf(day))
                    }
                  }
                })}
                renderInput={(params) => <TextField {...params} label="Days of Week" />}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Actions" />
              </Divider>
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.actions.requireTwoFactor}
                    onChange={(e) => setFormData({
                      ...formData,
                      actions: { ...formData.actions, requireTwoFactor: e.target.checked }
                    })}
                  />
                }
                label="Require 2FA"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.actions.notifyAdmin}
                    onChange={(e) => setFormData({
                      ...formData,
                      actions: { ...formData.actions, notifyAdmin: e.target.checked }
                    })}
                  />
                }
                label="Notify Admin"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.actions.notifyUser}
                    onChange={(e) => setFormData({
                      ...formData,
                      actions: { ...formData.actions, notifyUser: e.target.checked }
                    })}
                  />
                }
                label="Notify User"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.actions.logEvent}
                    onChange={(e) => setFormData({
                      ...formData,
                      actions: { ...formData.actions, logEvent: e.target.checked }
                    })}
                  />
                }
                label="Log Event"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Priority (higher = evaluated first)"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRuleDialog}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained">
            {selectedRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Test Rules Tab
  const renderTestRules = () => {
    return (
      <Box>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Test Geo-Security Rules</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Test how your rules would apply to a specific user and location.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={users}
                  getOptionLabel={(option) => option.username || option.email}
                  onChange={(e, newValue) => setTestData({
                    ...testData,
                    userId: newValue?._id || '',
                    userRole: newValue?.role || ''
                  })}
                  renderInput={(params) => <TextField {...params} label="Select User" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="User Role (or type manually)"
                  value={testData.userRole}
                  onChange={(e) => setTestData({ ...testData, userRole: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Latitude"
                  value={testData.latitude}
                  onChange={(e) => setTestData({ ...testData, latitude: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Longitude"
                  value={testData.longitude}
                  onChange={(e) => setTestData({ ...testData, longitude: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Country Code"
                  value={testData.country}
                  onChange={(e) => setTestData({ ...testData, country: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={testData.city}
                  onChange={(e) => setTestData({ ...testData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="IP Address"
                  value={testData.ipAddress}
                  onChange={(e) => setTestData({ ...testData, ipAddress: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<TestIcon />}
                  onClick={handleTestRule}
                  fullWidth
                >
                  Test Rules
                </Button>
              </Grid>
            </Grid>

            {testResults && (
              <Box mt={3}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>Test Results</Typography>
                {testResults.error ? (
                  <Alert severity="error">{testResults.error}</Alert>
                ) : (
                  <Box>
                    <Alert
                      severity={testResults.allowed ? 'success' : 'error'}
                      icon={testResults.allowed ? <CheckIcon /> : <BlockIcon />}
                    >
                      <Typography variant="body1" fontWeight="bold">
                        {testResults.allowed ? 'Access Allowed' : 'Access Denied'}
                      </Typography>
                      {testResults.message && (
                        <Typography variant="body2">{testResults.message}</Typography>
                      )}
                    </Alert>

                    {testResults.matchedRules && testResults.matchedRules.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>Matched Rules:</Typography>
                        {testResults.matchedRules.map((rule, index) => (
                          <Chip
                            key={index}
                            label={rule.name}
                            color={getRuleTypeColor(rule.ruleType)}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}

                    {testResults.actions && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>Required Actions:</Typography>
                        {testResults.actions.requireTwoFactor && (
                          <Chip label="2FA Required" color="warning" sx={{ mr: 1, mb: 1 }} />
                        )}
                        {testResults.actions.notifyAdmin && (
                          <Chip label="Admin Notified" color="info" sx={{ mr: 1, mb: 1 }} />
                        )}
                        {testResults.actions.notifyUser && (
                          <Chip label="User Notified" color="info" sx={{ mr: 1, mb: 1 }} />
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
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
          <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Geo-Security Rules
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Active Rules" />
        <Tab label="Test Rules" />
      </Tabs>

      {activeTab === 0 && renderActiveRules()}
      {activeTab === 1 && renderTestRules()}

      {renderRuleDialog()}
    </Box>
  );
};

export default GeoSecurityManager;

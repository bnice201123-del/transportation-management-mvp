import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Paper
} from '@mui/material';
import {
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  PhonelinkLock as PhonelinkLockIcon,
  Laptop as LaptopIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import axios from '../../config/axios';
import { format, parseISO } from 'date-fns';

const BiometricSetup = () => {
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [newCredentialName, setNewCredentialName] = useState('');

  useEffect(() => {
    checkSupport();
    fetchCredentials();
  }, []);

  const checkSupport = async () => {
    try {
      // Check if browser supports WebAuthn
      const supported = window.PublicKeyCredential !== undefined &&
                       navigator.credentials !== undefined;
      setIsSupported(supported);

      // Also check with backend
      const res = await axios.get('/api/biometric/supported');
      setIsSupported(res.data.supported && supported);
    } catch (error) {
      console.error('Error checking WebAuthn support:', error);
      setIsSupported(false);
    }
  };

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/biometric');
      setCredentials(res.data.credentials || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRegistration = async () => {
    try {
      setRegistrationInProgress(true);
      setError(null);
      setActiveStep(1);

      // Step 1: Begin registration - get challenge from server
      const beginRes = await axios.post('/api/biometric/register/begin');
      const { options } = beginRes.data;

      // Convert challenge from base64url to ArrayBuffer
      options.challenge = base64urlToArrayBuffer(options.challenge);
      options.user.id = base64urlToArrayBuffer(options.user.id);

      setActiveStep(2);

      // Step 2: Create credential with authenticator
      const credential = await navigator.credentials.create({
        publicKey: options
      });

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      setActiveStep(3);

      // Step 3: Send credential to server for verification
      const credentialData = {
        id: credential.id,
        rawId: arrayBufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
          attestationObject: arrayBufferToBase64url(credential.response.attestationObject)
        }
      };

      await axios.post('/api/biometric/register/complete', credentialData);

      setActiveStep(4);
      fetchCredentials();

      // Reset after 2 seconds
      setTimeout(() => {
        setActiveStep(0);
        setRegistrationInProgress(false);
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register biometric credential');
      setRegistrationInProgress(false);
      setActiveStep(0);
    }
  };

  const handleRenameCredential = async () => {
    try {
      await axios.put(`/api/biometric/${selectedCredential._id}/rename`, {
        customName: newCredentialName
      });
      fetchCredentials();
      setRenameDialogOpen(false);
      setSelectedCredential(null);
      setNewCredentialName('');
    } catch (error) {
      console.error('Error renaming credential:', error);
    }
  };

  const handleRevokeCredential = async (credentialId) => {
    if (window.confirm('Are you sure you want to revoke this biometric credential? You will need to register it again.')) {
      try {
        await axios.post(`/api/biometric/${credentialId}/revoke`);
        fetchCredentials();
      } catch (error) {
        console.error('Error revoking credential:', error);
      }
    }
  };

  // Helper functions for base64url encoding/decoding
  const base64urlToArrayBuffer = (base64url) => {
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  };

  const arrayBufferToBase64url = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const getAuthenticatorIcon = (type) => {
    switch (type) {
      case 'platform':
        return <PhonelinkLockIcon />;
      case 'cross-platform':
        return <KeyIcon />;
      default:
        return <FingerprintIcon />;
    }
  };

  const getAuthenticatorLabel = (type) => {
    switch (type) {
      case 'platform':
        return 'Platform Authenticator (Touch ID, Face ID, Windows Hello)';
      case 'cross-platform':
        return 'Security Key (USB, NFC, Bluetooth)';
      default:
        return 'Unknown';
    }
  };

  const getCredentialDisplayName = (credential) => {
    if (credential.customName) return credential.customName;
    const type = credential.authenticatorType === 'platform' ? 'Device Biometric' : 'Security Key';
    const device = credential.deviceInfo?.device || 'Unknown Device';
    return `${type} on ${device}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!isSupported) {
    return (
      <Box>
        <Alert severity="warning" icon={<WarningIcon />}>
          <Typography variant="h6" gutterBottom>
            Biometric Authentication Not Supported
          </Typography>
          <Typography variant="body2">
            Your browser or device does not support WebAuthn/FIDO2 biometric authentication.
            To use this feature, please use:
          </Typography>
          <ul>
            <li>Chrome, Firefox, Edge, or Safari (latest versions)</li>
            <li>A device with biometric hardware (fingerprint, face recognition)</li>
            <li>Or a compatible security key (USB, NFC, Bluetooth)</li>
          </ul>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          <FingerprintIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Biometric Authentication
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" icon={<SecurityIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          Biometric authentication provides a faster and more secure way to log in using your 
          fingerprint, face recognition, or a security key. Your biometric data never leaves 
          your device and is not stored on our servers.
        </Typography>
      </Alert>

      {/* Registration Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Register New Biometric Credential
          </Typography>

          {!registrationInProgress ? (
            <Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Register your fingerprint, face, or security key to enable biometric authentication.
              </Typography>
              <Button
                variant="contained"
                startIcon={<FingerprintIcon />}
                onClick={handleStartRegistration}
                size="large"
              >
                Start Registration
              </Button>
            </Box>
          ) : (
            <Stepper activeStep={activeStep} orientation="vertical">
              <Step>
                <StepLabel>Initiating Registration</StepLabel>
                <StepContent>
                  <Typography variant="body2">Starting the registration process...</Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Requesting Challenge</StepLabel>
                <StepContent>
                  <Typography variant="body2">Obtaining security challenge from server...</Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Authenticate with Your Device</StepLabel>
                <StepContent>
                  <Alert severity="info" icon={<FingerprintIcon />}>
                    <Typography variant="body2">
                      Please use your fingerprint, face, or security key to authenticate.
                    </Typography>
                  </Alert>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Verifying Credential</StepLabel>
                <StepContent>
                  <Typography variant="body2">Verifying your credential with the server...</Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Complete!</StepLabel>
                <StepContent>
                  <Alert severity="success" icon={<CheckIcon />}>
                    <Typography variant="body2">
                      Biometric credential registered successfully!
                    </Typography>
                  </Alert>
                </StepContent>
              </Step>
            </Stepper>
          )}

          {error && (
            <Alert severity="error" icon={<CloseIcon />} sx={{ mt: 2 }}>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Registered Credentials */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Biometric Credentials ({credentials.length})
          </Typography>

          {credentials.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <FingerprintIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No biometric credentials registered yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register your first credential to get started
              </Typography>
            </Paper>
          ) : (
            <List>
              {credentials.map((credential, index) => (
                <React.Fragment key={credential._id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <Box sx={{ mr: 2, fontSize: 40, color: 'primary.main' }}>
                      {getAuthenticatorIcon(credential.authenticatorType)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">
                            {getCredentialDisplayName(credential)}
                          </Typography>
                          {!credential.isRevoked && (
                            <Chip label="Active" color="success" size="small" />
                          )}
                          {credential.isRevoked && (
                            <Chip label="Revoked" color="error" size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {getAuthenticatorLabel(credential.authenticatorType)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Registered: {format(parseISO(credential.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                          {credential.lastUsed && (
                            <Typography variant="caption" display="block">
                              Last used: {format(parseISO(credential.lastUsed), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                          )}
                          <Typography variant="caption" display="block">
                            Usage count: {credential.usageCount}
                          </Typography>
                          {credential.transports && credential.transports.length > 0 && (
                            <Typography variant="caption" display="block">
                              Transports: {credential.transports.join(', ')}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedCredential(credential);
                          setNewCredentialName(credential.customName || '');
                          setRenameDialogOpen(true);
                        }}
                        disabled={credential.isRevoked}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleRevokeCredential(credential._id)}
                        disabled={credential.isRevoked}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* How It Works Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            How Biometric Authentication Works
          </Typography>
          <Typography variant="body2" paragraph>
            Biometric authentication uses industry-standard WebAuthn/FIDO2 protocols to provide 
            secure, passwordless authentication. Here's what makes it secure:
          </Typography>
          <ul>
            <li>
              <Typography variant="body2">
                <strong>Privacy:</strong> Your biometric data never leaves your device
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Security:</strong> Uses public-key cryptography to prevent phishing
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Convenience:</strong> Login with just a touch or glance
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Multi-device:</strong> Register multiple devices or security keys
              </Typography>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Credential</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Credential Name"
            value={newCredentialName}
            onChange={(e) => setNewCredentialName(e.target.value)}
            placeholder="e.g., My iPhone Touch ID"
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Give this credential a friendly name to easily identify it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameCredential} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BiometricSetup;

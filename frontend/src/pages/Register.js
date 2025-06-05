import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Snackbar,
  Paper
} from '@mui/material';
import WebcamCapture from '../components/WebcamCapture';
import { registerUser } from '../utils/api';

const Register = () => {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCapture = (imageSrc) => {
    setImage(imageSrc);
  };

  const handleRegister = async () => {
    if (!userId.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a user ID',
        severity: 'error'
      });
      return;
    }

    if (!image) {
      setSnackbar({
        open: true,
        message: 'Please capture a face image',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      const displayName = name.trim() || userId.trim();
      const result = await registerUser(userId.trim(), displayName, image);
      
      setSnackbar({
        open: true,
        message: `User ${displayName} registered successfully!`,
        severity: 'success'
      });
      
      // Reset form
      setUserId('');
      setName('');
      setImage(null);
    } catch (error) {
      console.error('Registration error:', error);
      setSnackbar({
        open: true,
        message: error.error || 'Failed to register user. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Register New User
      </Typography>
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3,
          mb: 3,
          maxWidth: 'md',
          mx: 'auto',
          bgcolor: '#f5f9ff' 
        }}
      >
        <Typography variant="body1" paragraph>
          Register new users by capturing their face and providing their details. 
          Make sure the person's face is clearly visible and well-lit for best recognition results.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              
              <TextField
                label="User ID"
                variant="outlined"
                fullWidth
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                margin="normal"
                disabled={loading}
                helperText="Employee ID, student ID, or any unique identifier"
              />
              
              <TextField
                label="Full Name"
                variant="outlined"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                disabled={loading}
              />
              
              {image && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                  onClick={handleRegister}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Registering...' : 'Register User'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Face Capture
              </Typography>
              
              <WebcamCapture 
                onCapture={handleCapture} 
                loading={loading}
                buttonText="Capture Face"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Register; 
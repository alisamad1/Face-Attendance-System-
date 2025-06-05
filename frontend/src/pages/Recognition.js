import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WebcamCapture from '../components/WebcamCapture';
import { recognizeFace } from '../utils/api';

const Recognition = () => {
  const [loading, setLoading] = useState(false);
  const [useDeepLearning, setUseDeepLearning] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCapture = async (imageSrc) => {
    try {
      setLoading(true);
      setError(null);
      setRecognitionResult(null);
      
      const result = await recognizeFace(imageSrc, useDeepLearning);
      
      if (result.recognized) {
        setRecognitionResult(result);
        setSnackbar({
          open: true,
          message: `Welcome, ${result.user.name}! Attendance recorded.`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Face not recognized. Please try again or register.',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Recognition error:', error);
      setError(error.error || 'An error occurred during face recognition.');
      setSnackbar({
        open: true,
        message: error.error || 'Face recognition failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleReset = () => {
    setRecognitionResult(null);
    setError(null);
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Face Recognition
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
          Capture your face to mark attendance. Make sure your face is clearly visible and well-lit.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={useDeepLearning}
              onChange={(e) => setUseDeepLearning(e.target.checked)}
              disabled={loading}
            />
          }
          label="Use advanced deep learning model (if available)"
        />
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Capture Face
              </Typography>
              
              {recognitionResult ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleReset}
                    sx={{ mt: 2 }}
                  >
                    Capture Another
                  </Button>
                </Box>
              ) : (
                <WebcamCapture 
                  onCapture={handleCapture} 
                  loading={loading}
                  buttonText="Recognize Face"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent sx={{ minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Recognition Result
              </Typography>
              
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1">
                    Processing face...
                  </Typography>
                </Box>
              ) : recognitionResult ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CheckCircleOutlineIcon 
                    color="success" 
                    sx={{ fontSize: 64, mb: 2 }} 
                  />
                  <Typography variant="h5" gutterBottom>
                    Hello, {recognitionResult.user.name}!
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Your attendance has been recorded.
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#f0f7ff', 
                    borderRadius: 1, 
                    p: 2, 
                    mt: 2,
                    fontSize: '0.9rem'
                  }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      User ID: {recognitionResult.user.userId}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Recorded at: {formatTime(recognitionResult.attendanceRecorded)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Confidence: {(recognitionResult.confidence * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              ) : error ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <ErrorOutlineIcon 
                    color="error" 
                    sx={{ fontSize: 64, mb: 2 }} 
                  />
                  <Typography color="error" variant="body1">
                    {error}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    Capture your face to mark attendance
                  </Typography>
                </Box>
              )}
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

export default Recognition; 
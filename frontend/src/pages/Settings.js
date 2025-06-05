import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ModelTraining as ModelTrainingIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { trainModel } from '../utils/api';

const Settings = () => {
  const [forceRetrain, setForceRetrain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleTrainModel = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const result = await trainModel(forceRetrain);
      
      setSuccess(true);
      setSnackbar({
        open: true,
        message: result.message || 'Model trained successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error training model:', error);
      setError(error.error || 'Failed to train model. Please try again.');
      setSnackbar({
        open: true,
        message: error.error || 'Failed to train model. Please try again.',
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
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ModelTrainingIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">
                  Model Training
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body1" paragraph>
                Train the facial recognition deep learning model using the registered users' data.
                This process may take several minutes depending on the number of users and available system resources.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  You need at least 2 registered users to train the model.
                </Typography>
              </Alert>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={forceRetrain}
                    onChange={(e) => setForceRetrain(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Force retraining (discard previous model)"
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ModelTrainingIcon />}
                  onClick={handleTrainModel}
                  disabled={loading}
                  sx={{ py: 1.5, px: 4 }}
                >
                  {loading ? 'Training...' : 'Train Model'}
                </Button>
              </Box>
              
              {success && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    Model trained successfully! The system will now use the improved model for face recognition.
                  </Typography>
                </Alert>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    {error}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <InfoIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">
                About the Model
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="body1" paragraph>
              The facial recognition system uses two different recognition methods:
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Standard Recognition"
                  secondary="Uses face encoding comparisons for quick and efficient face recognition. This is the default method."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Deep Learning Model"
                  secondary="Uses a convolutional neural network (CNN) based on VGG16 architecture for more accurate recognition, especially with varied lighting and angles."
                />
              </ListItem>
            </List>
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Training the deep learning model improves recognition accuracy over time as more face data becomes available.
              You can enable the deep learning model when marking attendance from the recognition page.
            </Typography>
          </Paper>
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

export default Settings; 
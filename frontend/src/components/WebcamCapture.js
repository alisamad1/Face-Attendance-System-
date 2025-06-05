import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, CircularProgress, Typography, Paper } from '@mui/material';
import { Camera as CameraIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const WebcamCapture = ({ onCapture, loading = false, showOverlay = true, buttonText = "Capture" }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [error, setError] = useState(null);

  const handleDevices = useCallback((mediaDevices) => {
    const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
    setDevices(videoDevices);
    if (videoDevices.length > 0 && !selectedDeviceId) {
      // Try to select the rear camera by default on mobile, if available
      const rearCamera = videoDevices.find(
        device => device.label.toLowerCase().includes("back") || 
                device.label.toLowerCase().includes("rear")
      );
      if (rearCamera) {
        setSelectedDeviceId(rearCamera.deviceId);
        setFacingMode("environment");
      } else {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    // Get available video devices
    navigator.mediaDevices.enumerateDevices()
      .then(handleDevices)
      .catch(err => {
        console.error("Error accessing media devices:", err);
        setError("Could not access camera. Please make sure your camera is connected and you've granted permission.");
      });
  }, [handleDevices]);

  const toggleCamera = () => {
    setFacingMode(prevState => prevState === "user" ? "environment" : "user");
    setImgSrc(null);
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      if (onCapture) {
        onCapture(imageSrc);
      }
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setImgSrc(null);
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode,
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
  };

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 2, backgroundColor: '#ffebee' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        mt: 2
      }}
    >
      {imgSrc ? (
        <Box sx={{ position: 'relative', maxWidth: '100%' }}>
          <img
            src={imgSrc}
            alt="Screenshot"
            style={{ maxWidth: '100%', borderRadius: '8px' }}
          />
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '8px'
              }}
            >
              <CircularProgress color="secondary" />
            </Box>
          )}
        </Box>
      ) : (
        <Box className="webcam-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            style={{ width: '100%', borderRadius: '8px' }}
            mirrored={facingMode === "user"}
          />
          {showOverlay && (
            <Box className="webcam-overlay">
              <Box className="face-guide"></Box>
            </Box>
          )}
        </Box>
      )}
      
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {imgSrc ? (
          <>
            <Button
              variant="outlined"
              color="primary"
              onClick={retake}
              disabled={loading}
              startIcon={<RefreshIcon />}
            >
              Retake
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={capture}
              disabled={loading}
              startIcon={<CameraIcon />}
            >
              {buttonText}
            </Button>
            {devices.length > 1 && (
              <Button
                variant="outlined"
                onClick={toggleCamera}
                disabled={loading}
              >
                Switch Camera
              </Button>
            )}
          </>
        )}
      </Box>

      <Typography className="webcam-info" variant="body2" color="textSecondary">
        {!imgSrc && "Position your face within the guide for best results"}
      </Typography>
    </Box>
  );
};

export default WebcamCapture; 
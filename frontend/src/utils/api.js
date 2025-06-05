import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Convert base64 image to file object
export const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Register a new user
export const registerUser = async (userId, name, imageData) => {
  try {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('name', name);
    
    // Convert base64 image to file
    const imageFile = dataURLtoFile(imageData, `${userId}_photo.jpg`);
    formData.append('file', imageFile);
    
    const response = await axios.post(`${API_URL}/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error.response?.data || error.message;
  }
};

// Recognize a face
export const recognizeFace = async (imageData, useDeepLearning = false) => {
  try {
    const formData = new FormData();
    
    // Convert base64 image to file
    const imageFile = dataURLtoFile(imageData, 'recognition.jpg');
    formData.append('file', imageFile);
    formData.append('useDeepLearning', useDeepLearning.toString());
    
    const response = await axios.post(`${API_URL}/recognize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error recognizing face:', error);
    throw error.response?.data || error.message;
  }
};

// Get all attendance records
export const getAttendanceRecords = async () => {
  try {
    const response = await axios.get(`${API_URL}/attendance`);
    return response.data.records;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error.response?.data || error.message;
  }
};

// Get all users
export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data.users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error.response?.data || error.message;
  }
};

// Train the model
export const trainModel = async (forceRetrain = false) => {
  try {
    const response = await axios.post(`${API_URL}/train-model`, {
      forceRetrain
    });
    return response.data;
  } catch (error) {
    console.error('Error training model:', error);
    throw error.response?.data || error.message;
  }
}; 
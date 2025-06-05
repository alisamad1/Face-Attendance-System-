import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Typography,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { getAttendanceRecords } from '../utils/api';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttendanceRecords();
      
      // Add unique id to each record for DataGrid
      const recordsWithId = data.map((record, index) => ({
        ...record,
        id: index,
        recordTime: new Date(record.timestamp),
      }));
      
      setRecords(recordsWithId);
      setFilteredRecords(recordsWithId);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setError('Failed to load attendance records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRecords(records);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = records.filter(record => 
        record.userId?.toLowerCase().includes(term) || 
        record.name?.toLowerCase().includes(term)
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, records]);

  const handleRefresh = () => {
    fetchAttendanceRecords();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const columns = [
    { field: 'userId', headerName: 'User ID', flex: 1, minWidth: 120 },
    { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 150 },
    { 
      field: 'timestamp', 
      headerName: 'Date & Time', 
      flex: 1.5, 
      minWidth: 180,
      valueGetter: (params) => params.row.timestamp,
      renderCell: (params) => formatDate(params.value)
    },
    { 
      field: 'confidence', 
      headerName: 'Confidence', 
      flex: 1, 
      minWidth: 120,
      renderCell: (params) => {
        const value = params.value || 0;
        const percentage = (value * 100).toFixed(2);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '60%', mr: 1 }}>
              <Box
                sx={{
                  width: `${percentage}%`,
                  height: 8,
                  bgcolor: percentage < 70 ? '#ffcdd2' : percentage < 90 ? '#fff9c4' : '#c8e6c9',
                  borderRadius: 1,
                }}
              />
            </Box>
            <Typography variant="body2">{percentage}%</Typography>
          </Box>
        );
      },
    },
  ];

  // Calculate dashboard statistics
  const totalRecords = filteredRecords.length;
  const uniqueUsers = new Set(filteredRecords.map(r => r.userId)).size;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRecords = filteredRecords.filter(r => 
    new Date(r.timestamp) >= todayStart
  ).length;

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Records
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant="h3">
                {loading ? <CircularProgress size={30} /> : totalRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="success" gutterBottom>
                Today's Attendance
              </Typography>
              <Typography variant="h3">
                {loading ? <CircularProgress size={30} /> : todayRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: '#fff8e1', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" color="warning.dark" gutterBottom>
                Unique Users
              </Typography>
              <Typography variant="h3">
                {loading ? <CircularProgress size={30} /> : uniqueUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap' }}>
          <Typography variant="h6">
            Attendance List
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' }, mt: { xs: 2, sm: 0 } }}>
            <TextField
              placeholder="Search by name or ID"
              size="small"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 240 } }}
            />
            
            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={filteredRecords}
              columns={columns}
              loading={loading}
              pagination
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
                sorting: {
                  sortModel: [{ field: 'timestamp', sort: 'desc' }],
                },
              }}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Attendance; 
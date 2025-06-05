import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Camera as CameraIcon,
  ListAlt as ListAltIcon,
  People as PeopleIcon,
  EventAvailable as EventAvailableIcon,
  EmojiPeople as EmojiPeopleIcon,
} from '@mui/icons-material';
import { getUsers, getAttendanceRecords } from '../utils/api';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both users and attendance records in parallel
      const [usersData, attendanceData] = await Promise.all([
        getUsers(),
        getAttendanceRecords()
      ]);
      
      setUsers(usersData);
      setAttendanceRecords(attendanceData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Get today's attendance
  const getTodayAttendance = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return attendanceRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= today;
    });
  };

  // Get last 7 days attendance data
  const getLast7DaysData = () => {
    const dates = [];
    const counts = [];
    
    // Create an array of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dates.push(dateStr);
      
      // Count records for this day
      const count = attendanceRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= date && recordDate < new Date(date.getTime() + 24 * 60 * 60 * 1000);
      }).length;
      
      counts.push(count);
    }
    
    return { dates, counts };
  };

  // Get user distribution data
  const getUserDistributionData = () => {
    const userAttendanceCounts = {};
    
    // Count attendance records for each user
    attendanceRecords.forEach(record => {
      if (userAttendanceCounts[record.userId]) {
        userAttendanceCounts[record.userId]++;
      } else {
        userAttendanceCounts[record.userId] = 1;
      }
    });
    
    // Get the top 5 users by attendance count
    const topUsers = Object.entries(userAttendanceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const labels = topUsers.map(([userId]) => {
      const user = users.find(u => u.userId === userId);
      return user ? user.name : userId;
    });
    
    const data = topUsers.map(([_, count]) => count);
    
    return { labels, data };
  };

  // Prepare chart data
  const last7DaysData = getLast7DaysData();
  const userDistributionData = getUserDistributionData();

  // Calculate statistics
  const totalUsers = users.length;
  const totalRecords = attendanceRecords.length;
  const todayRecords = getTodayAttendance().length;
  const uniqueAttendees = new Set(attendanceRecords.map(record => record.userId)).size;

  const barChartData = {
    labels: last7DaysData.dates,
    datasets: [
      {
        label: 'Attendance',
        data: last7DaysData.counts,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  };

  const doughnutChartData = {
    labels: userDistributionData.labels,
    datasets: [
      {
        label: 'Records',
        data: userDistributionData.data,
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(255, 99, 132)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<CameraIcon />}
          onClick={() => navigate('/recognition')}
        >
          Mark Attendance
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  Total Users
                </Typography>
              </Box>
              <Typography variant="h3">
                {loading ? <CircularProgress size={30} /> : totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EventAvailableIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="success.main">
                  Today's Attendance
                </Typography>
              </Box>
              <Typography variant="h3">
                {loading ? <CircularProgress size={30} /> : todayRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff8e1', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmojiPeopleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" color="warning.dark">
                  Unique Attendees
                </Typography>
              </Box>
              <Typography variant="h3">
                {loading ? <CircularProgress size={30} /> : uniqueAttendees}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f3e5f5', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ListAltIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="secondary.main">
                  Total Records
                </Typography>
              </Box>
              <Typography variant="h3">
                {loading ? <CircularProgress size={30} /> : totalRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper elevation={3} sx={{ p: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Last 7 Days Chart */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Attendance Trend (Last 7 Days)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={barChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* User Distribution Chart */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top 5 Users by Attendance
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                {userDistributionData.labels.length > 0 ? (
                  <Doughnut
                    data={doughnutChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%' 
                  }}>
                    <Typography color="textSecondary">
                      No attendance data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/register')}
              sx={{ py: 1.5 }}
            >
              Register New User
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CameraIcon />}
              onClick={() => navigate('/recognition')}
              sx={{ py: 1.5 }}
            >
              Mark Attendance
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ListAltIcon />}
              onClick={() => navigate('/attendance')}
              sx={{ py: 1.5 }}
            >
              View All Records
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard; 
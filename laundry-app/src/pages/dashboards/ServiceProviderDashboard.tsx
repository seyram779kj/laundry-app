import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { ServiceProviderUser } from '../../types/auth';

const ServiceProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const serviceProvider = user as ServiceProviderUser;

  // Get earnings data from user object or use defaults
  const pendingOrders = serviceProvider?.earnings?.pending ?? 0;
  const completedOrders = serviceProvider?.earnings?.completed ?? 0;
  const totalEarnings = serviceProvider?.earnings?.total ?? 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user ? `${user.firstName} ${user.lastName}` : 'Provider'}
      </Typography>

      {/* Stats Overview */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Orders
              </Typography>
              <Typography variant="h3">
                {pendingOrders}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completed Today
              </Typography>
              <Typography variant="h3">
                {completedOrders}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Earnings
              </Typography>
              <Typography variant="h3">
                ${totalEarnings}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 8px)' } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/provider/orders')}
              sx={{ height: '100%', py: 2 }}
            >
              View Orders
            </Button>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 8px)' } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/provider/earnings')}
              sx={{ height: '100%', py: 2 }}
            >
              View Earnings
            </Button>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 8px)' } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/provider/availability')}
              sx={{ height: '100%', py: 2 }}
            >
              Set Availability
            </Button>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 8px)' } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/provider/profile')}
              sx={{ height: '100%', py: 2 }}
            >
              Update Profile
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Recent Activity */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your latest order requests
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/provider/orders')}
              >
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Earnings Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Track your earnings and performance
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/provider/earnings')}
              >
                View Earnings Details
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ServiceProviderDashboard; 
export {};

import React from 'react';
import { Box, Typography, Paper, Button, Stack } from '@mui/material';
import { useAppSelector } from '../app/hooks';
import { useNavigate } from 'react-router-dom';
import { ServiceProviderUser } from '../types/auth';

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <Stack spacing={3} direction="row" useFlexGap flexWrap="wrap">
            <Box sx={{ width: '100%' }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={2} direction="row" useFlexGap flexWrap="wrap">
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/users')}
                    >
                      Manage Users
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/orders')}
                    >
                      View Orders
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/services')}
                    >
                      Manage Services
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/analytics')}
                    >
                      View Analytics
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/payments')}
                    >
                      Manage Payments
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/admin/reviews')}
                    >
                      Moderate Reviews
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        );

      case 'customer':
        return (
          <Stack spacing={3} direction="row" useFlexGap flexWrap="wrap">
            <Box sx={{ width: '100%' }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={2} direction="row" useFlexGap flexWrap="wrap">
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/customer/new-order')}
                    >
                      Place New Order
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/customer/orders')}
                    >
                      View Orders
                    </Button>
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/customer/services')}
                    >
                      Browse Services
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        );

      case 'service_provider':
        const serviceProvider = user as ServiceProviderUser;
        const pendingOrders = serviceProvider.earnings?.pending ?? 0;
        const completedOrders = serviceProvider.earnings?.completed ?? 0;
        const totalEarnings = serviceProvider.earnings?.total ?? 0;

        return (
          <Stack spacing={3}>
            <Box sx={{ width: '100%' }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Today's Overview
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                      <Typography variant="h4" color="white">
                        {pendingOrders}
                      </Typography>
                      <Typography variant="subtitle1" color="white">
                        Pending Orders
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Typography variant="h4" color="white">
                        {completedOrders}
                      </Typography>
                      <Typography variant="subtitle1" color="white">
                        Completed Today
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                      <Typography variant="h4" color="white">
                        ${totalEarnings}
                      </Typography>
                      <Typography variant="subtitle1" color="white">
                        Today's Earnings
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ width: '100%' }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Active Orders
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Manage your current orders
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/provider/orders')}
                  sx={{ mt: 2 }}
                >
                  View Active Orders
                </Button>
              </Paper>
            </Box>
          </Stack>
        );

      default:
        return (
          <Typography variant="body1" color="text.secondary">
            Welcome! Please select an action from the menu.
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user ? `${user.firstName} ${user.lastName}` : 'User'}
      </Typography>
      {getDashboardContent()}
    </Box>
  );
};

export default Dashboard;

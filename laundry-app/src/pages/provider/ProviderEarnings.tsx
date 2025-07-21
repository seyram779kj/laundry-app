import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useAppSelector } from '../../app/hooks';
import { ServiceProviderUser } from '../../types/auth';

interface EarningHistory {
  date: string;
  orderId: string;
  service: string;
  amount: number;
  status: 'pending' | 'completed';
}

interface Earnings {
  total: number;
  pending: number;
  completed: number;
  history: EarningHistory[];
}

const ProviderEarnings: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const serviceProvider = user as ServiceProviderUser;
  
  const earnings: Earnings = {
    total: serviceProvider.earnings?.total ?? 0,
    pending: serviceProvider.earnings?.pending ?? 0,
    completed: serviceProvider.earnings?.completed ?? 0,
    history: [], // TODO: Add actual earnings history from API
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Earnings Overview
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light' }}>
            <Typography variant="h4" color="white">
              ${earnings.total}
            </Typography>
            <Typography variant="subtitle1" color="white">
              Total Earnings
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light' }}>
            <Typography variant="h4" color="white">
              ${earnings.pending}
            </Typography>
            <Typography variant="subtitle1" color="white">
              Pending Orders
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light' }}>
            <Typography variant="h4" color="white">
              ${earnings.completed}
            </Typography>
            <Typography variant="subtitle1" color="white">
              Completed Orders
            </Typography>
          </Paper>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Earnings History
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Order ID</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {earnings.history.map((earning: EarningHistory, index: number) => (
                <TableRow key={index}>
                  <TableCell>{new Date(earning.date).toLocaleDateString()}</TableCell>
                  <TableCell>{earning.orderId}</TableCell>
                  <TableCell>{earning.service}</TableCell>
                  <TableCell>${earning.amount}</TableCell>
                  <TableCell>
                    <Typography
                      color={earning.status === 'completed' ? 'success.main' : 'warning.main'}
                    >
                      {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {earnings.history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No earnings history available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ProviderEarnings; 
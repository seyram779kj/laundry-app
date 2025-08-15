import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';

interface EarningHistory {
  _id: string;
  orderNumber: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  items: Array<{
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface EarningsData {
  totalEarnings: number;
  pendingEarnings: number;
  completedEarnings: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  history: EarningHistory[];
}

const ProviderEarnings: React.FC = () => {
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedEarnings: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    history: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Fetch orders assigned to this provider
      const response = await axios.get(
        'http://localhost:5000/api/orders?role=service_provider&include_available=false',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const orders = response.data.data.docs || response.data.data;
        console.log('Orders for earnings:', orders);

        // Calculate earnings
        let totalEarnings = 0;
        let pendingEarnings = 0;
        let completedEarnings = 0;
        let completedOrders = 0;
        let pendingOrders = 0;

        const earningHistory: EarningHistory[] = orders.map((order: any) => {
          const amount = order.totalAmount;
          const paymentStatus = order.payment?.status || 'pending';
          
          if (paymentStatus === 'completed') {
            completedEarnings += amount;
            completedOrders++;
          } else if (['pending', 'processing'].includes(paymentStatus)) {
            pendingEarnings += amount;
            pendingOrders++;
          }

          return {
            _id: order._id,
            orderNumber: order.orderNumber,
            customer: order.customer,
            items: order.items,
            totalAmount: amount,
            status: paymentStatus,
            createdAt: order.createdAt,
            completedAt: paymentStatus === 'completed' ? (order.payment?.completedAt || order.updatedAt) : undefined
          };
        });

        totalEarnings = completedEarnings + pendingEarnings;
        setEarnings({
          totalEarnings,
          pendingEarnings,
          completedEarnings,
          totalOrders: orders.length,
          completedOrders,
          pendingOrders,
          history: earningHistory
        });
      } else {
        setError('Failed to fetch earnings data');
      }
    } catch (err: any) {
      console.error('Fetch earnings error:', err);
      setError(err.response?.data?.error || 'Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Earnings Overview
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h4">
              ${earnings.totalEarnings.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">
              Total Earnings
            </Typography>
            <Typography variant="body2">
              {earnings.totalOrders} orders
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Typography variant="h4">
              ${earnings.completedEarnings.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">
              Completed Earnings
            </Typography>
            <Typography variant="body2">
              {earnings.completedOrders} completed payments
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Typography variant="h4">
              ${earnings.pendingEarnings.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">
              Pending Earnings
            </Typography>
            <Typography variant="body2">
              {earnings.pendingOrders} pending payments
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Earnings History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Earnings History
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {earnings.history.length > 0 ? (
                earnings.history.map((earning) => (
                  <TableRow key={earning._id}>
                    <TableCell>{earning.orderNumber}</TableCell>
                    <TableCell>
                      {`${earning.customer.firstName} ${earning.customer.lastName}`}
                    </TableCell>
                    <TableCell>
                      {earning.items.map((item, index) => (
                        <div key={index}>
                          {item.serviceName} (x{item.quantity})
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        ${earning.totalAmount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={earning.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(earning.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(earning.completedAt || earning.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                      No earnings history available. Start taking orders to see your earnings!
                    </Typography>
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
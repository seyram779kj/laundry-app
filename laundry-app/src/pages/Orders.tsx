// src/pages/Orders.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../app/store';
import { shallowEqual } from 'react-redux';

import { Order } from '../types/order';
import {
  statusColors,
  paymentStatusColors,
  statusLabels,
  paymentStatusLabels
} from '../types/order';
import { formatOrderForDisplay } from '../utils/typeUtils';

// Use thunks from the central slice instead of local ones
import { fetchOrdersByRole, setError } from '../features/orders/orderSlice';

const Orders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error } = useSelector((state: RootState) => state.orders || { orders: [], loading: false, error: null }, shallowEqual);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchOrdersByRole('customer'));
  }, [dispatch]);

  const handlePayNow = (order: Order) => {
    setSelectedOrder(order);
    setPhoneNumber(order.payment.paymentDetails.phoneNumber || '');
    setOpenPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedOrder) return;

    try {
      setPaymentLoading(true);
      const token = localStorage.getItem('token');

      // Ensure there is a payment record for this order
      let paymentId = (selectedOrder as any).payment?._id as string | undefined;
      if (!paymentId) {
        const createResp = await axios.post(
          `http://localhost:5000/api/payments`,
          {
            orderId: selectedOrder._id,
            amount: selectedOrder.totalAmount,
            paymentMethod: 'momo',
            paymentDetails: {}
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!createResp.data?.success) {
          throw new Error(createResp.data?.error || 'Failed to create payment');
        }
        paymentId = createResp.data.data._id;
      }

      // Initiate MoMo payment for the specific payment ID
      const momoResp = await axios.post(
        `http://localhost:5000/api/payments/${paymentId}/momo`,
        { phoneNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (momoResp.data?.success) {
        dispatch(fetchOrdersByRole('customer'));
        setOpenPaymentDialog(false);
      } else {
        dispatch(setError(momoResp.data?.error || 'Failed to process payment'));
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to process payment';
      dispatch(setError(msg));
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  const getActionButtons = (order: Order) => {
    const paymentStatus = order.payment?.status as string;
    const orderStatus = order.status as string;
    if (['pending', 'processing'].includes(paymentStatus) && !['cancelled', 'completed'].includes(orderStatus)) {
      return (
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => handlePayNow(order)}
          startIcon={<CheckCircleIcon />}
          sx={{ mb: 1 }}
        >
          Pay Now
        </Button>
      );
    }
    return null;
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button
            onClick={() => dispatch(fetchOrdersByRole('customer'))}
            sx={{ ml: 2 }}
            variant="outlined"
            size="small"
          >
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        My Orders
      </Typography>

      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" color="text.secondary">
            No orders available
          </Typography>
          <Button
            onClick={() => dispatch(fetchOrdersByRole('customer'))}
            sx={{ mt: 2 }}
            variant="outlined"
            color="primary"
          >
            Refresh
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'flex-start',
          }}
        >
          {orders.map((orderData) => {
            const order = formatOrderForDisplay(orderData);
            return (
            <Box
              key={order._id}
              sx={{
                width: {
                  xs: '100%',
                  sm: 'calc(50% - 12px)',
                  md: 'calc(33.33% - 16px)',
                  lg: 'calc(25% - 18px)',
                },
                minWidth: '300px',
              }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      #{order.orderNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={statusLabels[order.status] || order.status}
                        color={statusColors[order.status] || 'default'}
                        size="small"
                      />
                      <Chip
                        label={paymentStatusLabels[order.payment.status] || order.payment.status}
                        color={paymentStatusColors[order.payment.status] || 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Typography variant="subtitle1" gutterBottom>
                    {order.serviceProvider
                      ? `Provider: ${order.serviceProvider.firstName} ${order.serviceProvider.lastName}`
                      : 'Provider: Not assigned'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Items: {order.items.map((item) => `${item.serviceName} (${item.quantity})`).join(', ')}
                  </Typography>

                  <Typography variant="h6" color="primary" gutterBottom>
                    Total: {order.formattedTotal}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created: {formatDate(order.createdAt)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Delivery: {formatDate(order.deliveryDate)}
                  </Typography>

                  <Stack spacing={1}>
                    {getActionButtons(order)}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            );
          })}
        </Box>
      )}

      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Pay for Order #{selectedOrder?.orderNumber}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Phone Number (MoMo)"
            fullWidth
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={paymentLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)} disabled={paymentLoading} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            color="primary"
            disabled={paymentLoading}
            startIcon={paymentLoading ? <CircularProgress size={16} /> : null}
          >
            {paymentLoading ? 'Processing...' : 'Pay Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;

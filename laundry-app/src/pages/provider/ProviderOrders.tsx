// src/pages/provider/ProviderOrders.tsx
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
import { RootState, AppDispatch } from '../../app/store';
import { shallowEqual } from 'react-redux';
import { createAsyncThunk } from '@reduxjs/toolkit';

// Import the centralized types
import {
  Order,
  OrdersState,
} from '../../types';
import {
  statusColors,
  paymentStatusColors,
  statusLabels,
  paymentStatusLabels
} from '../../types/order';
import { formatOrderForDisplay } from '../../utils/typeUtils';

// Redux actions
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ role, includeAvailable = false }: { role: string; includeAvailable?: boolean }) => {
    const token = localStorage.getItem('token');
    const endpoint = role === 'service_provider' ? `/api/orders/provider/assigned?include_available=${includeAvailable}` : `/api/orders?role=${role}`;
    const response = await axios.get(`http://localhost:5000${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return role === 'service_provider' ? response.data.data : response.data.data.docs;
  }
);

export const setError = (error: string) => ({
  type: 'orders/setError',
  payload: error,
});

const ProviderOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error } = useSelector((state: RootState) => state.orders || { orders: [], loading: false, error: null }, shallowEqual);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchOrders({ role: 'service_provider', includeAvailable: true }));
  }, [dispatch]);

  const handlePayNow = (order: Order) => {
    setSelectedOrder(order);
    setPhoneNumber(order.payment.paymentDetails.phoneNumber || '');
    setOpenPaymentDialog(true);
  };

  const handleSelfAssign = async (order: Order) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/orders/${order._id}/assign-self`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        dispatch(fetchOrders({ role: 'service_provider', includeAvailable: true }));
      } else {
        dispatch(setError('Failed to assign order'));
      }
    } catch (err: any) {
      console.error('Self-assign error:', err);
      dispatch(setError(err.response?.data?.error || 'Failed to assign order'));
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedOrder) return;

    try {
      setPaymentLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/payments/momo`,
        {
          orderId: selectedOrder._id,
          phoneNumber,
          amount: selectedOrder.totalAmount,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        dispatch(fetchOrders({ role: 'service_provider', includeAvailable: true }));
        setOpenPaymentDialog(false);
      } else {
        dispatch(setError('Failed to process payment'));
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      dispatch(setError(err.response?.data?.error || 'Failed to process payment'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  const getActionButtons = (order: Order) => {
    const buttons = [];
    if (order.payment.status === 'pending' && ['pending', 'confirmed', 'assigned', 'in_progress', 'ready_for_pickup'].includes(order.status)) {
      buttons.push(
        <Button
          key="pay-now"
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
    if (!order.serviceProvider && ['pending', 'confirmed'].includes(order.status)) {
      buttons.push(
        <Button
          key="assign-self"
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => handleSelfAssign(order)}
          sx={{ mb: 1 }}
        >
          Assign to Me
        </Button>
      );
    }
    return buttons.length > 0 ? buttons : null;
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
            onClick={() => dispatch(fetchOrders({ role: 'service_provider', includeAvailable: true }))}
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
            onClick={() => dispatch(fetchOrders({ role: 'service_provider', includeAvailable: true }))}
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

                  <Typography variant="subtitle1" gutterBottom>
                    Customer: {order.customer.firstName} {order.customer.lastName}
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

export default ProviderOrders;
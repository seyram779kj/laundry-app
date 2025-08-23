// src/pages/provider/ProviderOrders.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChatIcon from '@mui/icons-material/Chat';
import { format } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { shallowEqual } from 'react-redux';

// Import the centralized types
import { Order, OrderStatus } from '../../types/order';
import {
  statusColors,
  paymentStatusColors,
  statusLabels,
  paymentStatusLabels
} from '../../types/order';
import { formatOrderForDisplay } from '../../utils/typeUtils';

// Slice thunks
import { fetchProviderOrders, setError, updateOrderStatus } from '../../features/orders/orderSlice';

const API_BASE_URL = 'http://localhost:5000/api';

const statusFlow: OrderStatus[] = [
  'pending',
  'confirmed',
  'assigned',
  'in_progress',
  'ready_for_pickup',
  'picked_up',
  'ready_for_delivery',
  'completed',
];

const nextStatus = (current: OrderStatus | string): OrderStatus | null => {
  const idx = statusFlow.indexOf(current as OrderStatus);
  if (idx === -1) return null;
  const next = statusFlow[idx + 1];
  return next || null;
};

const nextStatusButtonLabel = (next: OrderStatus | null): string => {
  if (!next) return '';
  const map: Record<OrderStatus, string> = {
    pending: 'Confirm',
    confirmed: 'Assign',
    assigned: 'Start Work',
    in_progress: 'Ready for Pickup',
    ready_for_pickup: 'Mark Picked Up',
    picked_up: 'Ready for Delivery',
    ready_for_delivery: 'Complete Order',
    completed: 'Completed',
    cancelled: 'Cancelled',
  } as any;
  return map[next] || 'Advance Status';
};

const ProviderOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error } = useSelector((state: RootState) => state.orders || { orders: [], loading: false, error: null }, shallowEqual);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [confirmingItem, setConfirmingItem] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProviderOrders({ includeAvailable: true }));
  }, [dispatch]);

  const authHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleSelfAssign = async (order: Order) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/orders/${order._id}/assign-self`,
        {},
        { headers: authHeader() }
      );

      if (response.data.success) {
        dispatch(fetchProviderOrders({ includeAvailable: true }));
      } else {
        dispatch(setError('Failed to assign order'));
      }
    } catch (err: any) {
      console.error('Self-assign error:', err);
      dispatch(setError(err.response?.data?.error || 'Failed to assign order'));
    }
  };

  const handleConfirmPayment = async (order: Order) => {
    if (!order.payment || order.payment.status === 'completed') return;
    try {
      setConfirming(order._id);
      const paymentId = (order.payment as any)?._id || (order.payment as any)?.id;
      if (paymentId) {
        await axios.put(
          `${API_BASE_URL}/payments/${paymentId}/status`,
          { status: 'completed' },
          { headers: { ...authHeader(), 'Content-Type': 'application/json' } }
        );
      } else {
        // Fallback: some backends expose an order-based payment status update
        await axios.put(
          `${API_BASE_URL}/orders/${order._id}/payment-status`,
          { status: 'completed' },
          { headers: { ...authHeader(), 'Content-Type': 'application/json' } }
        );
      }
      dispatch(fetchProviderOrders({ includeAvailable: true }));
    } catch (err: any) {
      console.error('Confirm payment error:', err);
      dispatch(setError(err.response?.data?.error || 'Failed to confirm payment'));
    } finally {
      setConfirming(null);
    }
  };

  const handleViewChat = async (order: Order) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chats/room`,
        { customerId: (order as any).customer?._id || (order as any).customer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chatRoomId = res.data._id;
      navigate(`/chat/supplier/${chatRoomId}`);
    } catch (err) {
      dispatch(setError('Failed to open chat'));
    }
  };

  const handleAdvanceStatus = async (order: Order) => {
    const target = nextStatus(order.status);
    if (!target) return;
    try {
      setAdvancing(order._id);
      await dispatch(updateOrderStatus({ orderId: order._id, status: target })).unwrap();
    } catch (err: any) {
      console.error('Advance status error:', err);
      dispatch(setError(err?.message || 'Failed to update order status'));
    } finally {
      setAdvancing(null);
    }
  };

  const handleConfirmItem = async (orderId: string, itemId: string) => {
    try {
      setConfirmingItem(itemId);
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/orders/${orderId}/clothing-items/${itemId}/confirm`,
        { confirmed: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        dispatch(fetchProviderOrders({ includeAvailable: true }));
      } else {
        dispatch(setError('Failed to confirm clothing item'));
      }
    } catch (err: any) {
      console.error('Confirm clothing item error:', err);
      dispatch(setError(err.response?.data?.error || 'Failed to confirm clothing item'));
    } finally {
      setConfirmingItem(null);
    }
  };

  // Add a clothing item to a specific order item (service)
  const handleAddClothingItem = async (orderId: string, itemIndex: number) => {
    try {
      const description = window.prompt('Enter item description');
      if (!description || !description.trim()) return;
      const specialInstructions = window.prompt('Any special instructions?') || '';
      setConfirmingItem('adding');

      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/orders/${orderId}/items/${itemIndex}/clothing-items`,
        { description: description.trim(), specialInstructions },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      dispatch(fetchProviderOrders({ includeAvailable: true }));
    } catch (err: any) {
      console.error('Add clothing item error:', err);
      dispatch(setError(err.response?.data?.error || 'Failed to add clothing item'));
    } finally {
      setConfirmingItem(null);
    }
  };

  const formatDate = (dateString: string) => format(new Date(dateString), 'MMM dd, yyyy hh:mm a');

  const getActionButtons = (order: Order) => {
    const buttons: React.ReactNode[] = [];

    // Chat
    buttons.push(
      <Button
        key="chat"
        size="small"
        variant="outlined"
        onClick={() => handleViewChat(order)}
        startIcon={<ChatIcon />}
        sx={{ mb: 1 }}
      >
        Chat
      </Button>
    );

    // Removed Confirm Payment button - payments now auto-sync via Paystack
    // if (order.payment?.status === 'pending') {
    //   buttons.push(
    //     <Button
    //       key="confirm-payment"
    //       size="small"
    //       variant="contained"
    //       color="primary"
    //       onClick={() => handleConfirmPayment(order)}
    //       startIcon={<CheckCircleIcon />}
    //       disabled={confirming === order._id}
    //       sx={{ mb: 1 }}
    //     >
    //       {confirming === order._id ? 'Confirming...' : 'Confirm Payment'}
    //     </Button>
    //   );
    // }

    // Self-assign if not assigned yet
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

    // Advance Status
    const next = nextStatus(order.status);
    if (next) {
      buttons.push(
        <Button
          key="advance-status"
          size="small"
          variant="outlined"
          onClick={() => handleAdvanceStatus(order)}
          disabled={advancing === order._id}
        >
          {advancing === order._id ? 'Updating...' : nextStatusButtonLabel(next)}
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
            onClick={() => dispatch(fetchProviderOrders({ includeAvailable: true }))}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 0 }}>
          My Orders
        </Typography>
              </Box>

      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" color="text.secondary">
            No orders available
          </Typography>
          <Button
            onClick={() => dispatch(fetchProviderOrders({ includeAvailable: true }))}
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
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Items per Service:
                      </Typography>
                      {order.items.map((item, itemIndex) => (
                        <Box key={`${order._id}-${itemIndex}`} sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {item.serviceName}
                          </Typography>
                          {(item.clothingItems && item.clothingItems.length > 0) ? (
                            item.clothingItems.map((clothingItem) => (
                              <Box key={clothingItem.itemId} sx={{ ml: 1, mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>{clothingItem.itemId}</strong>: {clothingItem.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                  {clothingItem.serviceName} - ¢{clothingItem.unitPrice.toFixed(2)}
                                </Typography>
                                <Chip
                                  label={clothingItem.isConfirmed ? 'Confirmed' : 'Pending'}
                                  size="small"
                                  color={clothingItem.isConfirmed ? 'success' : 'warning'}
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                                {order.serviceProvider && !clothingItem.isConfirmed && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => handleConfirmItem(order._id, clothingItem.itemId)}
                                    disabled={confirmingItem === clothingItem.itemId}
                                    sx={{ fontSize: '0.7rem', py: 0.2, px: 1, mr: 1 }}
                                  >
                                    {confirmingItem === clothingItem.itemId ? 'Confirming...' : 'Confirm Received'}
                                  </Button>
                                )}
                              </Box>
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, display: 'block' }}>
                              No items yet.
                            </Typography>
                          )}
                          {order.serviceProvider && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleAddClothingItem(order._id, itemIndex)}
                              disabled={confirmingItem === 'adding'}
                              sx={{ fontSize: '0.7rem', py: 0.2, px: 1 }}
                            >
                              {confirmingItem === 'adding' ? 'Adding...' : 'Add Item'}
                            </Button>
                          )}
                        </Box>
                      ))}
                    </Box>
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

                  <Stack spacing={1}>{getActionButtons(order)}</Stack>
                </CardContent>
              </Card>
            </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default ProviderOrders;

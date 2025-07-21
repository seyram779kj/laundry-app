import React, { useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../features/orders/orderSlice';
import { RootState } from '../app/store';

const Orders: React.FC = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state: RootState) => state.orders);

  // Always use a safe array
  const safeOrders = Array.isArray(orders) ? orders : [];

  useEffect(() => {
    dispatch(fetchOrders() as any);
  }, [dispatch]);

  const pendingOrders = safeOrders.filter(order => order.status === 'pending');
  const completedOrders = safeOrders.filter(order => order.status === 'delivered' || order.status === 'confirmed');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>
      <Paper sx={{ p: 3 }}>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && safeOrders.length === 0 && (
          <Typography>No orders found</Typography>
        )}

        {!loading && !error && safeOrders.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>Pending Orders</Typography>
            <List>
              {pendingOrders.map(order => (
                <ListItem key={order.id}>
                  <ListItemText
                    primary={`Order #${order.id}`}
                    secondary={`Status: ${order.status} | Total: $${order.totalAmount}`}
                  />
                  <Chip label="Pending" color="warning" />
                </ListItem>
              ))}
            </List>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Completed Orders</Typography>
            <List>
              {completedOrders.map(order => (
                <ListItem key={order.id}>
                  <ListItemText
                    primary={`Order #${order.id}`}
                    secondary={`Status: ${order.status} | Total: $${order.totalAmount}`}
                  />
                  <Chip label="Completed" color="success" />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Orders; 

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
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MessageIcon from '@mui/icons-material/Message';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type OrderStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'ready_for_pickup' | 'completed' | 'cancelled';

interface Order {
  _id: string;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  serviceProvider?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    businessDetails?: any;
  };
  items: Array<{
    service: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions?: string;
  }>;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  pickupAddress: {
    type: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions: string;
  };
  deliveryAddress: {
    type: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions: string;
  };
  pickupDate: string;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
  notes: {
    customer: string;
    serviceProvider: string;
    admin: string;
  };
  orderNumber: string;
  formattedTotal: string;
}

const statusColors: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  confirmed: 'info',
  assigned: 'info',
  in_progress: 'primary',
  ready_for_pickup: 'secondary',
  completed: 'success',
  cancelled: 'error',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  ready_for_pickup: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const Orders_t: React.FC = () => {
  const [orders, setOrders_t] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [unreadChats, setUnreadChats] = useState<{[orderId: string]: boolean}>({});
  const [updating, setUpdating] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication token not found');
        return;
      }

      console.log('Fetching orders...');
      const response = await axios.get('http://localhost:5000/api/orders?role=service_provider&include_available=true', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Orders response:', response.data);

      if (response.data.success) {
        const ordersData = response.data.data.docs || response.data.data;
        console.log('Orders data:', ordersData);
        setOrders_t(ordersData);
        await checkUnreadMessages(ordersData, token);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err: any) {
      console.error('Fetch orders error:', err);
      setError(err.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const checkUnreadMessages = async (ordersList: Order[], token: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;

    if (!userId) return;

    const unreadStatus: {[orderId: string]: boolean} = {};

    for (const order of ordersList) {
      try {
        const chatRoomRes = await axios.post(
          'http://localhost:5000/api/chats/room',
          { customerId: order.customer._id, orderId: order._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const chatRoomId = chatRoomRes.data._id;
        const messagesRes = await axios.get(
          `http://localhost:5000/api/chats/${chatRoomId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const messages = messagesRes.data;
        unreadStatus[order._id] = messages.some((msg: any) => 
          msg.senderType !== 'service_provider' && 
          (!msg.readBy || !msg.readBy.includes(userId))
        );
      } catch (err) {
        console.error(`Error checking messages for order ${order._id}:`, err);
        unreadStatus[order._id] = false;
      }
    }

    setUnreadChats(unreadStatus);
  };

  const handleAssignToSelf = async (orderId: string) => {
    try {
      setUpdating(orderId);
      const token = localStorage.getItem('token');

      console.log('Assigning order to self:', orderId);
      const response = await axios.put(
        `http://localhost:5000/api/orders/${orderId}/assign-self`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Assign response:', response.data);

      if (response.data.success) {
        await fetchOrders();
        setError(null);
      } else {
        setError('Failed to assign order to yourself');
      }
    } catch (err: any) {
      console.error('Assign order error:', err);
      setError(err.response?.data?.error || 'Failed to assign order');
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdating(orderId);
      const token = localStorage.getItem('token');
      
      console.log('Updating status:', { orderId, newStatus });
      const response = await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Status update response:', response.data);

      if (response.data.success) {
        await fetchOrders();
        setError(null);
      } else {
        setError('Failed to update order status');
      }
    } catch (err: any) {
      console.error('Status update error:', err);
      setError(err.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleAddNotes = () => {
    if (selectedOrder) {
      setNotes(selectedOrder.notes.serviceProvider || '');
      setNotesDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/orders/${selectedOrder._id}`,
        { notes: { ...selectedOrder.notes, serviceProvider: notes } },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchOrders();
        setNotesDialogOpen(false);
        setError(null);
      } else {
        setError('Failed to save notes');
      }
    } catch (err: any) {
      console.error('Save notes error:', err);
      setError(err.response?.data?.error || 'Failed to save notes');
    }
  };

  const handleViewChat = async (order: Order) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/chats/room',
        { customerId: order.customer._id, orderId: order._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatRoomId = response.data._id;
      navigate(`/provider/chat/${chatRoomId}`);
    } catch (err: any) {
      console.error('Error opening chat:', err);
      setError('Failed to open chat');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  const getActionButtons = (order: Order) => {
    const isUpdating = updating === order._id;
    
    if (!order.serviceProvider && (order.status === 'pending' || order.status === 'confirmed')) {
      return (
        <Button
          size="small"
          variant="contained"
          color="primary"
          disabled={isUpdating}
          onClick={() => handleAssignToSelf(order._id)}
          startIcon={isUpdating ? <CircularProgress size={16} /> : <AssignmentIcon />}
          sx={{ mb: 1 }}
        >
          {isUpdating ? 'Assigning...' : 'Assign to Me'}
        </Button>
      );
    }

    if (order.status === 'assigned' && order.serviceProvider) {
      return (
        <Button
          size="small"
          variant="outlined"
          color="primary"
          disabled={isUpdating}
          onClick={() => handleStatusChange(order._id, 'in_progress')}
          startIcon={isUpdating ? <CircularProgress size={16} /> : <PlayArrowIcon />}
          sx={{ mb: 1 }}
        >
          {isUpdating ? 'Starting...' : 'Start Work'}
        </Button>
      );
    }

    if (order.status === 'in_progress') {
      return (
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          disabled={isUpdating}
          onClick={() => handleStatusChange(order._id, 'ready_for_pickup')}
          startIcon={isUpdating ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          sx={{ mb: 1 }}
        >
          {isUpdating ? 'Updating...' : 'Mark Ready'}
        </Button>
      );
    }

    if (order.status === 'ready_for_pickup') {
      return (
        <Button
          size="small"
          variant="contained"
          color="success"
          disabled={isUpdating}
          onClick={() => handleStatusChange(order._id, 'completed')}
          startIcon={isUpdating ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          sx={{ mb: 1 }}
        >
          {isUpdating ? 'Completing...' : 'Complete'}
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
            onClick={fetchOrders} 
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
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>

      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No orders available
          </Typography>
          <Button 
            onClick={fetchOrders} 
            sx={{ mt: 2 }}
            variant="outlined"
          >
            Refresh
          </Button>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3,
          justifyContent: 'flex-start'
        }}>
          {orders.map((order) => (
            <Box 
              key={order._id} 
              sx={{ 
                width: { 
                  xs: '100%', 
                  sm: 'calc(50% - 12px)', 
                  md: 'calc(33.33% - 16px)', 
                  lg: 'calc(25% - 18px)' 
                },
                minWidth: '300px'
              }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      #{order.orderNumber}
                    </Typography>
                    <Chip
                      label={statusLabels[order.status]}
                      color={statusColors[order.status]}
                      size="small"
                    />
                  </Box>

                  <Typography variant="subtitle1" gutterBottom>
                    Customer: {`${order.customer.firstName} ${order.customer.lastName}`}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Items: {order.items.map(item => `${item.serviceName} (${item.quantity})`).join(', ')}
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

                  {!order.serviceProvider && (order.status === 'pending' || order.status === 'confirmed') && (
                    <Chip
                      label="Available for Assignment"
                      color="success"
                      size="small"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  )}

                  <Stack spacing={1}>
                    {getActionButtons(order)}
                    
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Badge 
                        color="error" 
                        variant="dot" 
                        invisible={!unreadChats[order._id]}
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewChat(order)}
                        >
                          <MessageIcon />
                        </IconButton>
                      </Badge>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, order)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Menu for additional actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedOrder && (
          <>
            <MenuItem onClick={handleAddNotes}>
              📝 Add Notes
            </MenuItem>
            <MenuItem onClick={() => console.log('View details:', selectedOrder)}>
              👁️ View Details
            </MenuItem>
            {['pending', 'confirmed', 'assigned', 'in_progress', 'ready_for_pickup'].includes(selectedOrder.status) && (
              <MenuItem onClick={() => {
                handleStatusChange(selectedOrder._id, 'cancelled');
                handleMenuClose();
              }}>
                ❌ Cancel Order
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)}>
        <DialogTitle>Add Service Provider Notes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained">
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders_t;

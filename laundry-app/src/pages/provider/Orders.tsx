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
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MessageIcon from '@mui/icons-material/Message';
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

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [unreadChats, setUnreadChats] = useState<{[orderId: string]: boolean}>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    await loadOrders();
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/orders/provider/assigned', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.data);
        // Check for unread messages for each order
        await checkUnreadMessages(response.data.data, token);
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
        // Find or create chat room for this order
        const chatRoomRes = await axios.post(
          'http://localhost:5000/api/chats/room',
          { customerId: order.customer._id, orderId: order._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const chatRoomId = chatRoomRes.data._id;

        // Get messages for this chat room
        const messagesRes = await axios.get(
          `http://localhost:5000/api/chats/${chatRoomId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const messages = messagesRes.data;
        // Check if there are unread messages (messages not read by this provider)
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleAssignToSelf = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.patch(
        `http://localhost:5000/api/orders/${orderId}/assign-self`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchOrders(); // Refresh the orders list
      } else {
        setError('Failed to assign order to yourself');
      }
    } catch (err: any) {
      console.error('Assign order error:', err);
      setError(err.response?.data?.error || 'Failed to assign order');
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/orders/${selectedOrder._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchOrders();
        handleMenuClose();
      } else {
        setError('Failed to update order status');
      }
    } catch (err: any) {
      console.error('Status update error:', err);
      setError(err.response?.data?.error || 'Failed to update order status');
    }
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

      // Find or create chat room for this order
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
        Orders
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Scheduled For</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>
                  <Stack direction="column" spacing={0.5}>
                    <Typography variant="body2">
                      {`${order.customer.firstName} ${order.customer.lastName}`}
                    </Typography>
                    {!order.serviceProvider && (order.status === 'pending' || order.status === 'confirmed') && (
                      <Chip
                        label="Available"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  {order.items.map((item, index) => (
                    <div key={index}>{`${item.serviceName} x${item.quantity}`}</div>
                  ))}
                </TableCell>
                <TableCell>{order.formattedTotal}</TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[order.status]}
                    color={statusColors[order.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, order)}
                    >
                      <MoreVertIcon />
                    </IconButton>
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
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Status Update Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {/* Self-assignment option for available orders */}
        {(selectedOrder?.status === 'pending' || selectedOrder?.status === 'confirmed') && !selectedOrder?.serviceProvider && (
          <MenuItem onClick={() => selectedOrder && handleAssignToSelf(selectedOrder._id)}>
            Assign to Myself
          </MenuItem>
        )}

        {/* Status progression options */}
        {selectedOrder?.status === 'assigned' && (
          <MenuItem onClick={() => handleStatusChange('in_progress')}>
            Mark as In Progress
          </MenuItem>
        )}
        {selectedOrder?.status === 'in_progress' && (
          <MenuItem onClick={() => handleStatusChange('ready_for_pickup')}>
            Mark as Ready for Pickup
          </MenuItem>
        )}
        {selectedOrder?.status === 'ready_for_pickup' && (
          <MenuItem onClick={() => handleStatusChange('completed')}>
            Mark as Completed
          </MenuItem>
        )}

        {/* Confirmation option for pending orders assigned to provider */}
        {selectedOrder?.status === 'pending' && selectedOrder?.serviceProvider && (
          <MenuItem onClick={() => handleStatusChange('confirmed')}>
            Confirm Order
          </MenuItem>
        )}

        {/* Cancel option for orders that can be cancelled */}
        {['pending', 'confirmed', 'assigned', 'in_progress', 'ready_for_pickup'].includes(selectedOrder?.status || '') && (
          <MenuItem onClick={() => handleStatusChange('cancelled')}>
            Cancel Order
          </MenuItem>
        )}

        {/* Notes option for all orders */}
        <MenuItem onClick={handleAddNotes}>
          Add Notes
        </MenuItem>
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

export default Orders;
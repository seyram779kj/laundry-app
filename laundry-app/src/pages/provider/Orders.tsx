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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack, // Added import for Stack
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MessageIcon from '@mui/icons-material/Message';
import { format } from 'date-fns';
import axios from 'axios';

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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost:5000/api/orders?role=service_provider&include_available=true', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        console.log('Orders API response:', JSON.stringify(data, null, 2));

        const ordersArray = data.success && data.data?.docs ? data.data.docs : [];
        const mappedOrders = ordersArray.map((order: any) => ({
          _id: order._id,
          customer: {
            _id: order.customer?._id || '',
            firstName: order.customer?.firstName || '',
            lastName: order.customer?.lastName || '',
            email: order.customer?.email || '',
            phoneNumber: order.customer?.phoneNumber || '',
          },
          serviceProvider: order.serviceProvider
            ? {
                _id: order.serviceProvider._id,
                firstName: order.serviceProvider.firstName,
                lastName: order.serviceProvider.lastName,
                email: order.serviceProvider.email,
                phoneNumber: order.serviceProvider.phoneNumber,
                businessDetails: order.serviceProvider.businessDetails,
              }
            : undefined,
          status: order.status,
          totalAmount: order.totalAmount,
          subtotal: order.subtotal,
          tax: order.tax,
          deliveryFee: order.deliveryFee,
          items: order.items.map((item: any) => ({
            service: item.service,
            serviceName: item.serviceName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            specialInstructions: item.specialInstructions,
          })),
          pickupAddress: {
            type: order.pickupAddress?.type || '',
            street: order.pickupAddress?.street || '',
            city: order.pickupAddress?.city || '',
            state: order.pickupAddress?.state || '',
            zipCode: order.pickupAddress?.zipCode || '',
            instructions: order.pickupAddress?.instructions || '',
          },
          deliveryAddress: {
            type: order.deliveryAddress?.type || '',
            street: order.deliveryAddress?.street || '',
            city: order.deliveryAddress?.city || '',
            state: order.deliveryAddress?.state || '',
            zipCode: order.deliveryAddress?.zipCode || '',
            instructions: order.deliveryAddress?.instructions || '',
          },
          pickupDate: order.pickupDate,
          deliveryDate: order.deliveryDate,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          notes: {
            customer: order.notes?.customer || '',
            serviceProvider: order.notes?.serviceProvider || '',
            admin: order.notes?.admin || '',
          },
          orderNumber: order.orderNumber,
          formattedTotal: order.formattedTotal,
        }));
        setOrders(mappedOrders);
        console.log('Mapped orders:', mappedOrders);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Orders fetch error:', errorMessage, error);
        setError('Failed to load orders');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleSelfAssign = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/assign-self`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign order');
      }

      const updatedOrder = await response.json();
      setOrders(orders.map(order =>
        order._id === orderId ? updatedOrder.data : order
      ));
      setError(null);
      handleMenuClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Self-assign error:', errorMessage, error);
      setError('Failed to assign order to yourself');
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`http://localhost:5000/api/orders/${selectedOrder._id}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      setOrders(orders.map(order =>
        order._id === selectedOrder._id ? updatedOrder.data : order
      ));
      setError(null);
      handleMenuClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Status update error:', errorMessage, error);
      setError('Failed to update order status');
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
      const response = await fetch(`http://localhost:5000/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: { ...selectedOrder.notes, serviceProvider: notes } }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      const updatedOrder = await response.json();
      setOrders(orders.map(order =>
        order._id === selectedOrder._id ? updatedOrder.data : order
      ));
      setError(null);
      setNotesDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Save notes error:', errorMessage, error);
      setError('Failed to save notes');
    }
  };

  const handleViewChat = async (order: Order) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/chats/room',
        { customerId: order.customer._id, orderId: order._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chatRoomId = res.data._id;
      window.location.href = `/chat/provider/${chatRoomId}`;
    } catch (error) {
      console.error('Chat error:', error);
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
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewChat(order)}
                    >
                      <MessageIcon />
                    </IconButton>
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
          <MenuItem onClick={() => selectedOrder && handleSelfAssign(selectedOrder._id)}>
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
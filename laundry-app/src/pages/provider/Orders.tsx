export {};

import React, { useState } from 'react';
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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { format } from 'date-fns';

// Define order status types
type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'ready_for_delivery' | 'completed' | 'cancelled';

interface Order {
  id: string;
  customerName: string;
  service: string;
  items: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  scheduledFor: string;
  notes?: string;
}

// Mock data - replace with actual API call
const mockOrders: Order[] = [
  {
    id: 'ORD001',
    customerName: 'John Doe',
    service: 'Wash & Fold',
    items: 5,
    total: 45.00,
    status: 'pending',
    createdAt: '2024-03-20T10:00:00',
    scheduledFor: '2024-03-21T14:00:00',
  },
  {
    id: 'ORD002',
    customerName: 'Jane Smith',
    service: 'Dry Cleaning',
    items: 3,
    total: 35.00,
    status: 'in_progress',
    createdAt: '2024-03-20T09:30:00',
    scheduledFor: '2024-03-21T16:00:00',
  },
  // Add more mock orders as needed
];

const statusColors: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  accepted: 'info',
  in_progress: 'primary',
  ready_for_delivery: 'secondary',
  completed: 'success',
  cancelled: 'error',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  ready_for_delivery: 'Ready for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (selectedOrder) {
      setOrders(orders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, status: newStatus }
          : order
      ));
      handleMenuClose();
    }
  };

  const handleAddNotes = () => {
    if (selectedOrder) {
      setNotes(selectedOrder.notes || '');
      setNotesDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleSaveNotes = () => {
    if (selectedOrder) {
      setOrders(orders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, notes }
          : order
      ));
      setNotesDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

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
              <TableCell>Service</TableCell>
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
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.service}</TableCell>
                <TableCell>{order.items}</TableCell>
                <TableCell>${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[order.status]}
                    color={statusColors[order.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>{formatDate(order.scheduledFor)}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, order)}
                  >
                    <MoreVertIcon />
                  </IconButton>
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
        <MenuItem onClick={() => handleStatusChange('accepted')}>
          Accept Order
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('in_progress')}>
          Mark as In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('ready_for_delivery')}>
          Mark as Ready for Delivery
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('completed')}>
          Mark as Completed
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('cancelled')}>
          Cancel Order
        </MenuItem>
        <MenuItem onClick={handleAddNotes}>
          Add Notes
        </MenuItem>
      </Menu>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)}>
        <DialogTitle>Add Notes</DialogTitle>
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
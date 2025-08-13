import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fetchOrders } from '../features/orders/orderSlice';
import { RootState } from '../app/store';
import axios from 'axios';

interface Tracking {
  _id: string;
  order: string;
  currentLocation: string;
  trackingSteps: Array<{
    status: string;
    timestamp: string;
    location?: string;
    notes?: string;
    updatedBy?: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  estimatedDelivery?: string;
  actualDelivery?: string;
  driverInfo?: {
    name?: string;
    phone?: string;
    vehicleNumber?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  payment?: { // Assuming payment details are nested within the order
    _id: string;
    status: string;
    paymentMethod?: string;
    paymentDetails?: {
      phoneNumber?: string;
      transactionRef?: string;
      momoStatus?: string;
    };
  serviceProvider?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  customer?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  statusHistory?: Array<{ // This seems to be Order status history, not payment history
    status: string;
    changedBy: string;
    changedAt: string;
    notes?: string;
  }>;
}

const Orders: React.FC = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state: RootState) => state.orders, shallowEqual);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<{ [orderId: string]: any }>({}); // Replace 'any' with a proper Tracking interface
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Always use a safe array
  const safeOrders: Order[] = Array.isArray(orders) ? orders : [];

  // Find the selected order to access its payment details
  const selectedOrder = safeOrders.find(order => order.id === selectedOrderId);

  // Add interface for Payment with statusHistory
  // This interface seems misplaced and should be part of the Order interface above
  interface PaymentWithHistory {

    _id: string;
    status: string;
    statusHistory?: Array<{
      status: string;
      changedAt: string;
      changedBy: string;}>}

  useEffect(() => {
    dispatch(fetchOrders() as any);
  }, [dispatch]);

  useEffect(() => {
    const fetchOrderData = async () => {
      dispatch(fetchOrders() as any);
    };
    fetchOrderData();
  }, [dispatch]);

  useEffect(() => {
    const fetchTrackingData = async () => {
      const newTrackingData: { [orderId: string]: Tracking } = {};
      for (const order of safeOrders) {
        try {
          const response = await axios.get(`/api/tracking/${order.id}`);
          if (response.data.success) {
            newTrackingData[order.id] = response.data.data;
          }
        } catch (err) {
          console.error(`Failed to fetch tracking for order ${order.id}:`, err);
        }
      }
      setTrackingData(newTrackingData);
    };

    if (safeOrders.length > 0) {
      fetchTrackingData();
    }
  }, [safeOrders]); // Fetch tracking data when orders change


  const handlePayNow = (orderId: string) => {
    setSelectedOrderId(orderId);
    setOpenPaymentDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedOrderId(null);
    setPhoneNumber('');
    setPaymentMethod('momo');
    setPaymentError(null);
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder?.payment?._id || !phoneNumber) {
      setPaymentError('Payment details not available or phone number missing.');
      return;
    }

    try {
      // Initiate MoMo payment using the new payment endpoint
      const response = await axios.post(`/api/payments/${selectedOrder.payment._id}/momo`, {
        phoneNumber,
      });

      if (response.data.success) {
        // Refresh orders to reflect updated payment and order status
        dispatch(fetchOrders() as any);
        handleCloseDialog();
        // Optionally show a success message
        alert('Payment initiated successfully. Please check your phone to complete the transaction.');
      } else {
        setPaymentError(response.data.message || response.data.error || 'Failed to process payment');
      }
    } catch (err) {
      setPaymentError('Failed to process payment');
    }
  };

  const getChangedByLabel = (changedBy: string, order: Order) => {
    if (order.serviceProvider && changedBy === order.serviceProvider._id) {
      return 'Provider';
    } else if (order.customer && changedBy === order.customer._id) {
      return 'Customer';
    } else {
      return 'Admin';
    }
  };

  const getPaymentChangedByLabel = (changedBy: string, order: Order) => {
    if (order.payment?.serviceProvider && changedBy === order.payment.serviceProvider._id) {
      return 'Provider';
    } else if (order.payment?.customer && changedBy === order.payment.customer._id) {
      return 'Customer';
    } else {
      return 'Admin';
    }}

  // Group orders by status
  const statusGroups = {
    pending: safeOrders.filter(order => order.status === 'pending'),
    confirmed: safeOrders.filter(order => order.status === 'confirmed'),
    assigned: safeOrders.filter(order => order.status === 'assigned'),
    in_progress: safeOrders.filter(order => order.status === 'in_progress'),
    ready_for_pickup: safeOrders.filter(order => order.status === 'ready_for_pickup'),
    completed: safeOrders.filter(order => order.status === 'completed'),
    cancelled: safeOrders.filter(order => order.status === 'cancelled'),
  };

  const statusColors: { [key: string]: 'default' | 'primary' | 'warning' | 'success' | 'error' } = {
    pending: 'warning',
    confirmed: 'primary',
    assigned: 'primary',
    in_progress: 'primary',
    ready_for_pickup: 'primary',
    completed: 'success',
    cancelled: 'error',
  };

  return (
    <Box className="p-4 max-w-4xl mx-auto">
      <Typography variant="h4" gutterBottom className="text-gray-800 font-bold">
        My Orders
      </Typography>
      <Paper className="p-6 shadow-lg">
        {loading ? (
          <CircularProgress className="mx-auto" />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : safeOrders.length === 0 ? (
          <Typography>No orders found</Typography>
        ) : (
          <>
            {Object.entries(statusGroups).map(([status, orders]) => (
              orders.length > 0 && (
                <div key={status}>
                  <Typography variant="h6" gutterBottom className="text-gray-700 mt-4">
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} Orders
                  </Typography>
                  <List>
                    {orders.map(order => (
                      <ListItem key={order.id} className="border-b py-4">
                        <ListItemText
                          primary={`Order #${order.id}`}
                          secondary={
                            <>
                              <span>Status: {order.status}</span>
                              <br />
                              <span>Total: ${order.totalAmount.toFixed(2)}</span>
                              <br />
                              <span>
                                Payment Status: {order.payment?.status || 'No payment initiated'}
                             </span>
                              {order.paymentDetails && order.paymentMethod === 'momo' && (
                                <>
                                  <br />
                                  <span>MoMo Details:</span>
                                  <ul className="list-disc pl-5">
                                    <li>Phone: {order.paymentDetails.phoneNumber || 'N/A'}</li>
                                    <li>Transaction Ref: {order.paymentDetails.transactionRef || 'N/A'}</li>
                                    <li>MoMo Status: {order.paymentDetails.momoStatus || 'N/A'}</li>
                                  </ul>
                                </>
                              )}
                              {order.statusHistory && (
                                // This is Order Status History
                                <>
                                  <br />
                                  <span>Order Status History:</span>
                                  <ul className="list-disc pl-5">
                                    {order.statusHistory.map((history, index) => (
                                      <li key={index}>
                                        {history.status} by {getChangedByLabel(history.changedBy, order)} - {new Date(history.changedAt).toLocaleString()}
                                        {history.notes && ` (${history.notes})`}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                               {order.payment?.statusHistory && (
                                <>
                                  <br />
                                  <span>Payment History:</span>
                                  <ul className="list-disc pl-5">
                                    {order.payment.statusHistory.map((history, index) => (
                                      <li key={index}>
                                        {history.status} by {getChangedByLabel(history.changedBy, order)} - {new Date(history.changedAt).toLocaleString()}
                                        {history.notes && ` (${history.notes})`}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                              {trackingData[order.id] && (
       <>
         <br />
         <span>Tracking Information:</span>
         <ul className="list-disc pl-5">
           <li>Current Location: {trackingData[order.id].currentLocation}</li>
           {trackingData[order.id].trackingSteps.length > 0 && (
             <li>
               Tracking History:
               <ul className="list-disc pl-5">
                 {trackingData[order.id].trackingSteps.map((step, stepIndex) => (
                   <li key={stepIndex}>
                     {step.status} at {new Date(step.timestamp).toLocaleString()}
                     {step.notes && ` (${step.notes})`}
                     {step.updatedBy && ` by ${step.updatedBy.firstName} ${step.updatedBy.lastName}`}
                   </li>
                 ))}
               </ul>
             </li>
           )}
         </ul>
       </>
     )}

                            </>
                          }
                        />
                        <div className="flex items-center space-x-2">
                          <Chip
                            label={order.status.charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                            color={statusColors[order.status] || 'default'}
                          />
                          {order.paymentStatus === 'pending' && (
                           <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handlePayNow(order.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </ListItem>
                    ))}
                  </List>
                </div>
              )
            ))}
          </>
        )}
      </Paper>

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleCloseDialog}>
        <DialogTitle>Initiate Payment</DialogTitle>
        <DialogContent>
          {paymentError && (
            <Typography color="error" className="mb-4">
              {paymentError}
            </Typography>
          )}
          <TextField
            select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            fullWidth
            margin="normal"
            disabled
          >
            <MenuItem value="momo">Mobile Money (MoMo)</MenuItem>
          </TextField>
          <TextField
            label="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Enter MoMo phone number"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleProcessPayment}
            color="primary"
            variant="contained"
            disabled={!phoneNumber}
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
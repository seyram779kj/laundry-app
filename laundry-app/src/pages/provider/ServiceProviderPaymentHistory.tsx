import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Typography, Box, CircularProgress, Alert } from '@mui/material';
import { RootState } from '../../app/store';
import { Payment } from '../../types/order'; // Adjust the import path if necessary
import PaymentList from '../../components/payment/PaymentList'; // Adjust the import path if necessary
import api from '../../services/api'; // Assuming your API service is here

const ServiceProviderPaymentHistory: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.id || !token) {
        // Handle case where user is not logged in or token is missing
        setError('User not authenticated.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Assuming the backend filters by serviceProvider when userId query param is present for service providers
        const response = await api.get(`/payments?userId=${user.id}`);
        // Assuming the API response has a 'data' field which is an array of payments
        if (response.data && Array.isArray(response.data.data.docs)) {
             setPayments(response.data.data.docs); // Adjust based on your API response structure
        } else if (response.data && Array.isArray(response.data.data)) {
             setPayments(response.data.data); // Adjust based on your API response structure
        }
         else {
            setPayments([]);
         }
      } catch (err: any) {
        console.error('Error fetching service provider payments:', err);
        setError(err.message || 'Failed to fetch payments.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user?.id, token]); // Re-run effect if user ID or token changes

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payment History (Service Provider)
      </Typography>
      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && (
        <PaymentList payments={payments} />
      )}
    </Box>
  );
};

export default ServiceProviderPaymentHistory;
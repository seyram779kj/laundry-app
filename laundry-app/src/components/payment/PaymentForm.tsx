import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  createPaymentIntent,
  fetchPaymentMethods,
  savePaymentMethod,
  processPayment,
} from '../../features/payment/paymentSlice';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
}) => {
  const dispatch = useAppDispatch();
  const { loading, error, paymentMethods } = useAppSelector(
    (state) => state.payment
  );
  const [selectedMethod, setSelectedMethod] = useState<string>('new');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      let paymentMethodId = selectedMethod;

      if (selectedMethod === 'new') {
        // Mock creating a new payment method
        const mockPaymentMethod = {
          id: 'mock_' + Date.now(),
          card: {
            brand: 'visa',
            last4: cardNumber.slice(-4)
          }
        };
        await dispatch(savePaymentMethod(mockPaymentMethod.id));
        paymentMethodId = mockPaymentMethod.id;
      }

      const paymentIntent = await dispatch(
        createPaymentIntent(amount)
      ).unwrap();

      const result = await dispatch(
        processPayment({
          paymentIntentId: paymentIntent.id,
          paymentMethodId,
        })
      ).unwrap();

      if (result.status === 'succeeded') {
        onSuccess();
      } else {
        onError('Payment failed');
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Select Payment Method</FormLabel>
          <RadioGroup
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          >
            {paymentMethods.map((method) => (
              <FormControlLabel
                key={method.id}
                value={method.id}
                control={<Radio />}
                label={`${method.card.brand.toUpperCase()} ending in ${method.card.last4}`}
              />
            ))}
            <FormControlLabel
              value="new"
              control={<Radio />}
              label="Add new card"
            />
          </RadioGroup>
        </FormControl>

        {selectedMethod === 'new' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Card Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Expiry Date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="MM/YY"
                  sx={{ width: '50%' }}
                />
                <TextField
                  label="CVC"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="123"
                  sx={{ width: '50%' }}
                />
              </Box>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Total Amount:</Typography>
          <Typography variant="h6" color="primary">
            ${(amount / 100).toFixed(2)}
          </Typography>
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || (selectedMethod === 'new' && (!cardNumber || !expiryDate || !cvc))}
          sx={{ mt: 3 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Pay Now'
          )}
        </Button>
      </form>
    </Paper>
  );
};

export default PaymentForm; 
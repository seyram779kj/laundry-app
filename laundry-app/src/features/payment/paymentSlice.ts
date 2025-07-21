import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface PaymentState {
  loading: boolean;
  error: string | null;
  paymentIntent: any | null;
  paymentMethods: any[];
}

const initialState: PaymentState = {
  loading: false,
  error: null,
  paymentIntent: null,
  paymentMethods: [],
};

// Mock payment methods for development
const mockPaymentMethods = [
  {
    id: 'mock_1',
    card: {
      brand: 'visa',
      last4: '4242'
    }
  }
];

export const createPaymentIntent = createAsyncThunk(
  'payment/createIntent',
  async (amount: number) => {
    // Mock successful payment intent creation
    return {
      id: 'mock_intent_' + Date.now(),
      amount,
      status: 'succeeded'
    };
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'payment/fetchMethods',
  async () => {
    // Return mock payment methods
    return mockPaymentMethods;
  }
);

export const savePaymentMethod = createAsyncThunk(
  'payment/saveMethod',
  async (paymentMethodId: string) => {
    // Mock saving payment method
    return {
      id: paymentMethodId,
      card: {
        brand: 'visa',
        last4: '4242'
      }
    };
  }
);

export const processPayment = createAsyncThunk(
  'payment/process',
  async ({ paymentIntentId, paymentMethodId }: { paymentIntentId: string; paymentMethodId: string }) => {
    // Mock successful payment processing
    return {
      status: 'succeeded',
      id: paymentIntentId
    };
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentError: (state) => {
      state.error = null;
    },
    clearPaymentIntent: (state) => {
      state.paymentIntent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Payment Intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentIntent = action.payload;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create payment intent';
      })
      // Fetch Payment Methods
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMethods = action.payload;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch payment methods';
      })
      // Save Payment Method
      .addCase(savePaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods.push(action.payload);
      })
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state) => {
        state.loading = false;
        state.paymentIntent = null;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Payment processing failed';
      });
  },
});

export const { clearPaymentError, clearPaymentIntent } = paymentSlice.actions;
export default paymentSlice.reducer; 
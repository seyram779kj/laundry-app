import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface PaymentState {
  loading: boolean;
  error: string | null;
  paymentIntent: any | null;
  paymentMethods: any[];
  paymentHistory: {
    data: any[];
    pagination: any;
    loading: boolean;
    error: string | null;
  };
  paymentStats: any;
  selectedPayment: any | null;
}

const initialState: PaymentState = {
  loading: false,
  error: null,
  paymentIntent: null,
  paymentMethods: [],
  paymentHistory: {
    data: [],
    pagination: {},
    loading: false,
    error: null,
  },
  paymentStats: null,
  selectedPayment: null,
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

export const processMoMoPayment = createAsyncThunk(
  'payment/processMoMo',
  async ({ paymentId, phoneNumber }: { paymentId: string; phoneNumber: string }) => {
    const response = await fetch(`/api/payments/${paymentId}/momo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ phoneNumber })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'MoMo payment failed');
    }
    
    return await response.json();
  }
);

export const checkMoMoStatus = createAsyncThunk(
  'payment/checkMoMoStatus',
  async (paymentId: string) => {
    const response = await fetch(`/api/payments/${paymentId}/momo/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check MoMo status');
    }

    return await response.json();
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const response = await fetch(`/api/payments/history?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }

    return await response.json();
  }
);

export const fetchPaymentStats = createAsyncThunk(
  'payment/fetchStats',
  async (params: { startDate?: string; endDate?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const response = await fetch(`/api/payments/history/stats?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment statistics');
    }

    return await response.json();
  }
);

export const exportPaymentHistory = createAsyncThunk(
  'payment/exportHistory',
  async (params: {
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    format?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const response = await fetch(`/api/payments/history/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export payment history');
    }

    if (params.format === 'csv') {
      const blob = await response.blob();
      return blob;
    }

    return await response.json();
  }
);

export const fetchPaymentReceipt = createAsyncThunk(
  'payment/fetchReceipt',
  async (paymentId: string) => {
    const response = await fetch(`/api/payments/${paymentId}/receipt`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment receipt');
    }

    return await response.json();
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
    clearPaymentHistory: (state) => {
      state.paymentHistory.data = [];
      state.paymentHistory.pagination = {};
      state.paymentHistory.error = null;
    },
    setSelectedPayment: (state, action) => {
      state.selectedPayment = action.payload;
    },
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
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
      })
      // Fetch Payment History
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.paymentHistory.loading = true;
        state.paymentHistory.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.paymentHistory.loading = false;
        state.paymentHistory.data = action.payload.data.docs;
        state.paymentHistory.pagination = {
          page: action.payload.data.page,
          pages: action.payload.data.pages,
          total: action.payload.data.total,
          limit: action.payload.data.limit,
        };
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.paymentHistory.loading = false;
        state.paymentHistory.error = action.error.message || 'Failed to fetch payment history';
      })
      // Fetch Payment Stats
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.paymentStats = action.payload.data;
      })
      // Fetch Payment Receipt
      .addCase(fetchPaymentReceipt.fulfilled, (state, action) => {
        state.selectedPayment = action.payload.data;
      });
  },
});

export const {
  clearPaymentError,
  clearPaymentIntent,
  clearPaymentHistory,
  setSelectedPayment,
  clearSelectedPayment
} = paymentSlice.actions;
export default paymentSlice.reducer;

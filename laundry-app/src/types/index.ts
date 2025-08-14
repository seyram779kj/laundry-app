export type UserRole = 'customer' | 'service_provider' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  unit: 'kg' | 'piece';
  category: string;
}

export interface OrderItem {
  serviceId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  pickupAddress: Address;
  deliveryAddress: Address;
  pickupDate: string;
  deliveryDate: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}



export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  paidAt?: string;
  createdAt: string;
}

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'bank_transfer';

export interface ServiceProvider {
  id: string;
  userId: string;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  assignedOrders: string[]; // Order IDs
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

export interface ServiceState {
  services: Service[];
  loading: boolean;
  error: string | null;
}

export interface PaymentState {
  payments: Payment[];
  currentPayment: Payment | null;
  loading: boolean;
  error: string | null;
} 
 // src/types/index.ts
// Replace or update your existing types with these

export type OrderStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'ready_for_pickup' | 'ready_for_delivery' | 'picked_up' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface ServiceProvider {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  businessDetails?: any;
}

export interface Payment {
  _id: string;
  order: string;
  customer: string;
  serviceProvider?: string | null;
  amount: number;
  paymentMethod: string;
  paymentDetails: {
    phoneNumber?: string;
    momoNetwork?: string;
  };
  status: PaymentStatus;
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: string;
    notes: string;
  }>;
}

export interface OrderItem {
  service: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface Address {
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  instructions: string;
}

export interface Order {
  _id: string;
  customer: Customer;
  serviceProvider?: ServiceProvider | null;
  items: OrderItem[];
  status: OrderStatus;
  payment: Payment;
  totalAmount: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  pickupAddress: Address;
  deliveryAddress: Address;
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
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    changedAt: string;
    notes: string;
  }>;
}

export interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

// Add any other types you need to export
export * from './order'; // Re-export from order.ts if you want to keep both files
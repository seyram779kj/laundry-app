import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  LocalLaundryService,
  DryCleaning,
  Iron,
  CleaningServices,
  Close,
  Phone,
  Email,
  WhatsApp,
  CreditCard,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { createOrder } from '../features/orders/orderSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { OrderItem } from '../types';
import ServiceSelection from '../components/order/ServiceSelection';
import ItemQuantity from '../components/order/ItemQuantity';
import AddressSelection from '../components/order/AddressSelection';
import OrderSummary from '../components/order/OrderSummary';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
}

interface BackendService {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface OrderDates {
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderAddresses {
  pickup: string;
  delivery: string;
}

interface FormattedDates {
  pickup: string;
  delivery: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const services = [
  {
    id: 'wash-fold',
    title: 'Wash & Fold',
    description: 'Professional washing, drying, and folding service for your everyday clothes.',
    price: 'Starting at $2.50/lb',
    image: '/images/wash-fold.jpg',
    icon: <LocalLaundryService />,
    details: [
      'Separated by color and fabric type',
      'Eco-friendly detergents',
      'Gentle washing cycles',
      'Professional folding',
      'Ready for pickup in 24 hours'
    ]
  },
  {
    id: 'dry-cleaning',
    title: 'Dry Cleaning',
    description: 'Expert dry cleaning for delicate fabrics and special garments.',
    price: 'Starting at $5.99/item',
    image: '/images/dry-cleaning.jpg',
    icon: <DryCleaning />,
    details: [
      'Professional stain treatment',
      'Gentle cleaning process',
      'Special care for delicate fabrics',
      'Eco-friendly solvents',
      'Same-day service available'
    ]
  },
  {
    id: 'ironing',
    title: 'Ironing & Pressing',
    description: 'Professional ironing and pressing service for crisp, clean clothes.',
    price: 'Starting at $3.99/item',
    image: '/images/ironing.jpg',
    icon: <Iron />,
    details: [
      'Professional pressing equipment',
      'Attention to detail',
      'Proper temperature control',
      'Special care for delicate fabrics',
      'Ready in 24 hours'
    ]
  },
  {
    id: 'stain-removal',
    title: 'Stain Removal',
    description: 'Expert stain removal for tough spots and marks.',
    price: 'Starting at $4.99/stain',
    image: '/images/stain-removal.jpg',
    icon: <CleaningServices />,
    details: [
      'Advanced stain treatment',
      'Specialized cleaning agents',
      'Pre-treatment assessment',
      'Guaranteed results',
      'Same-day service available'
    ]
  }
];

const steps = [
  'Select Service',
  'Select Items',
  'Pickup Details',
  'Delivery Details',
  'Review & Pay'
];

interface SelectedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'momo',
    name: 'Mobile Money',
    icon: <Phone />,
    description: 'Pay using MTN, Vodafone, or AirtelTigo Mobile Money'
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: <CreditCard />,
    description: 'Pay using Visa, Mastercard, or other cards'
  }
];

const NewOrder: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [orderTitle, setOrderTitle] = useState('');
  const [addresses, setAddresses] = useState<OrderAddresses>({
    pickup: '',
    delivery: ''
  });
  const [dates, setDates] = useState<OrderDates>({
    pickupDate: '',
    pickupTime: '',
    deliveryDate: '',
    deliveryTime: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderId, setOrderId] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const dispatch = useAppDispatch();
  const { loading } = useSelector((state: RootState) => state.orders);
  const { services } = useSelector((state: RootState) => state.services);
  const serviceList = Array.isArray(services) ? services : [];
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    // Handle navigation from Services page
    if (location.state) {
      const { selectedService: serviceId, initialStep } = location.state as { 
        selectedService: string;
        initialStep?: number;
      };
      
      if (serviceId) {
        const foundService = serviceList.find(s => s.id === serviceId);
        if (foundService) {
          setSelectedServices([foundService]);
          setOrderTitle(foundService.name);
        }
      }
      
      if (initialStep !== undefined) {
        setActiveStep(initialStep);
      }
    }

    if (showThankYou) {
      console.log('Thank you message shown, preparing to redirect...');
      const timer = setTimeout(() => {
        console.log('Redirecting to orders page...');
        navigate('/orders', { replace: true });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state, serviceList, activeStep, showThankYou, navigate]);

  const handleServiceSelect = (serviceId: string) => {
    console.log('Selected service ID:', serviceId);
    // Find the service from the backend services (which use _id)
    const backendService = serviceList.find(s => (s as any)._id === serviceId) as any;
    if (!backendService) {
      console.error('Service not found:', serviceId);
      return;
    }
    
    const service = {
      id: serviceId, // Use the MongoDB _id as the id
      name: backendService.name,
      description: backendService.description,
      basePrice: backendService.basePrice || 0
    };
    console.log('Created service:', service);
    setSelectedService(service);
    setSelectedServices([service]);
    setOrderTitle(service.name);
    setActiveStep(1); // This sets it to the "Select Items" step
  };

  const handleItemsChange = (items: Item[], totalPrice: number) => {
    const orderItems: OrderItem[] = items.map(item => ({
      serviceId: selectedService?.id || '',
      quantity: item.quantity,
      price: item.price
    }));
    setSelectedItems(orderItems);
    setTotalPrice(totalPrice);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddressChange = (newAddresses: OrderAddresses) => {
    setAddresses(newAddresses);
  };

  const handleDateChange = (formattedDates: FormattedDates) => {
    const [pickupDate, pickupTime] = formattedDates.pickup.split(' ');
    const [deliveryDate, deliveryTime] = formattedDates.delivery.split(' ');
    setDates({
      pickupDate,
      pickupTime,
      deliveryDate,
      deliveryTime,
    });
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handleSubmit = async () => {
    try {
      // Fetch the selected service details to get the provider
      const serviceId = selectedServices[0]?.id;
      if (!serviceId) throw new Error('No service selected');
      const res = await fetch(`http://localhost:5000/api/services/${serviceId}`);
      if (!res.ok) throw new Error('Failed to fetch service details');
      const serviceData = await res.json();
      const providerId = serviceData.data?.provider?._id;
      if (!providerId) throw new Error('No provider found for selected service');
      await dispatch(createOrder({
        serviceId,
        serviceProviderId: providerId,
        items: selectedItems,
        pickupAddress: addresses.pickup,
        deliveryAddress: addresses.delivery,
        pickupDate: dates.pickupDate,
        deliveryDate: dates.deliveryDate,
      })).unwrap();
      navigate('/orders', { replace: true });
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const handleServiceClick = (service: any) => {
    setSelectedService(service);
  };

  const handleCloseDialog = () => {
    setSelectedService(null);
  };

  const handleBookService = () => {
    if (selectedService) {
      setSelectedServices(prev => [...prev, selectedService]);
      setSelectedService(null);
    }
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setPaymentError(null);
  };

  const handleMoMoPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const response = await fetch('/api/payments/momo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalPrice,
          currency: 'GHS',
          customerPhone: user?.phoneNumber,
          customerEmail: user?.email,
          orderId: orderId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowThankYou(true);
      } else {
        setPaymentError(data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      setPaymentError('An error occurred while processing payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStepContent = (step: number) => {
    if (!user) return null; // Add null check for user

    if (showThankYou) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" color="primary" gutterBottom>
            Thank You!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Your order has been placed successfully.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Redirecting to orders...
          </Typography>
        </Box>
      );
    }

    switch (step) {
      case 0:
        return (
          <ServiceSelection
            onServiceSelect={handleServiceSelect}
            onNext={() => setActiveStep(1)}
          />
        );
      case 1:
        return (
          <ItemQuantity
            selectedServiceId={selectedServices[0]?.id || ''}
            onItemsChange={handleItemsChange}
          />
        );
      case 2:
        return (
          <AddressSelection
            addresses={addresses}
            dates={formatDates(dates)}
            onAddressChange={handleAddressChange}
            onDateChange={handleDateChange}
            user={user}
          />
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Delivery Details for {selectedService?.name}
            </Typography>
            <AddressSelection
              addresses={addresses}
              dates={formatDates(dates)}
              onAddressChange={handleAddressChange}
              onDateChange={handleDateChange}
              user={user}
              isDelivery
            />
          </Box>
        );
      case 4:
        return (
          <Box>
            <OrderSummary
              items={selectedItems}
              addresses={addresses}
              dates={formatDates(dates)}
              onEdit={() => setActiveStep(2)}
              totalPrice={totalPrice}
            />
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
              >
                Place Order
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return !!selectedService;
      case 1:
        return selectedItems.length > 0;
      case 2:
        return !!addresses.pickup && !!dates.pickupDate;
      case 3:
        return !!addresses.delivery && !!dates.deliveryDate;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const formatDates = (dates: OrderDates) => ({
    pickup: `${dates.pickupDate} ${dates.pickupTime}`,
    delivery: `${dates.deliveryDate} ${dates.deliveryTime}`
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          New Order
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {orderTitle}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}

        {activeStep !== 0 && activeStep !== steps.length - 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === 1 && selectedItems.length === 0}
            >
              Continue
            </Button>
          </Box>
        )}
        {activeStep === steps.length - 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
            >
              Back
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NewOrder; 
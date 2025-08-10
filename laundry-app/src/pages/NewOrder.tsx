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
  category?: string;
  imageUrl?: string;
  provider?: any;
}


interface BackendService {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  imageUrl?: string;
  provider?: any;
  isActive?: boolean;
  isAvailable?: boolean;
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

const steps = ['Select Service', 'Select Items', 'Pickup Address', 'Delivery Address', 'Order Summary'];

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
  
  // Add state for fetching services directly
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { loading } = useSelector((state: RootState) => state.orders);
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // Fetch services directly in this component
 useEffect(() => {
  const fetchAvailableServices = async () => {
    setServicesLoading(true);
    setServicesError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      console.log('Fetched services for customers:', data);
      
      let servicesArray: BackendService[] = [];
      
      // Handle your backend response structure
      if (data.success && data.data) {
        servicesArray = Array.isArray(data.data.docs) ? data.data.docs : data.data;
      } else if (Array.isArray(data)) {
        servicesArray = data;
      }
      
      // Only show active services to customers
      const activeServices = servicesArray.filter(service => service.isActive !== false);
      
      // Convert to frontend format
      const formattedServices: Service[] = activeServices.map((service: BackendService) => ({
        id: service._id,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        category: service.category,
        imageUrl: service.imageUrl,
        provider: service.provider
      }));
      
      console.log('Formatted services for customers:', formattedServices);
      setAvailableServices(formattedServices);
      
    } catch (error) {
      console.error('Error fetching services:', error);
      setServicesError('Failed to load services');
      setAvailableServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  fetchAvailableServices();
}, []); // Ensure the dependency array is empty to run only once on mount

  useEffect(() => {
    // Handle navigation from Services page
    if (location.state) {
      const { selectedService: serviceId, initialStep } = location.state as { 
        selectedService: string;
        initialStep?: number;
      };
      
      if (serviceId && availableServices.length > 0) {
        const foundService = availableServices.find(s => s.id === serviceId);
        if (foundService) {
          setSelectedServices([foundService]);
          setOrderTitle(foundService.name);
          setSelectedService(foundService);
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
      // ... rest of your component remains the same ...

      return () => clearTimeout(timer);
    }
  }, [location.state, availableServices, activeStep, showThankYou, navigate]);

 const handleItemsChange = (items: Item[], totalPrice: number) => {
  const orderItems: OrderItem[] = items.map(item => ({
    serviceId: selectedService?.id || '',
    quantity: item.quantity,
    price: item.price
  }));
  setSelectedItems(orderItems);
  setTotalPrice(totalPrice);
};

// In the getStepContent function, ensure you pass the correct props to ItemQuantit


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

  const getStepContent = (step: number) => {
    if (!user) return null;

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
        if (servicesLoading) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          );
        }
        
        if (servicesError) {
          return (
            <Alert severity="error" sx={{ my: 2 }}>
              {servicesError}
            </Alert>
          );
        }
        
        if (availableServices.length === 0) {
          return (
            <Alert severity="info" sx={{ my: 2 }}>
              No services available at the moment.
            </Alert>
          );
        }
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a Service
            </Typography>
            <Box display="flex" flexWrap="wrap" sx={{ mt: 1 }}>
              {availableServices.map((service) => (
                <Box key={service.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1 }}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 4,
                      },
                      border: selectedService?.id === service.id ? '2px solid' : '1px solid',
                      borderColor: selectedService?.id === service.id ? 'primary.main' : 'divider',
                    }}
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.imageUrl && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={service.imageUrl.startsWith('http') 
                          ? service.imageUrl 
                          : `http://localhost:5000${service.imageUrl}`
                        }
                        alt={service.name}
                      />
                    )}
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {service.description}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${service.basePrice}
                      </Typography>
                      {service.category && (
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {service.category.replace('-', ' ')}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
            
            {selectedService && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                >
                  Continue with {selectedService.name}
                </Button>
              </Box>
            )}
          </Box>
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

  // ... rest of your component remains the same ...

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          New Order
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {orderTitle || 'Select a service to get started'}
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

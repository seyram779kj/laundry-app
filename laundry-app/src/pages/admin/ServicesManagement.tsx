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
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  CheckCircle as ActiveIcon,
  Block as InactiveIcon,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: 'wash-fold' | 'dry-cleaning' | 'ironing' | 'stain-removal' | 'specialty';
  isActive: boolean;
  estimatedTime: string;
  requirements?: string;
  createdAt: string;
  updatedAt: string;
}

const ServicesManagement: React.FC = () => {
  const { canManageOrders } = usePermissions();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'view' | 'edit' | 'add'>('view');
  const [error, setError] = useState<string | null>(null);

  // Fetch real services data from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
        // Ensure services is always an array
        const servicesArray = Array.isArray(data) ? data : (data.services || data.data || []);
        setServices(servicesArray);
      } catch (error) {
        console.error('Services fetch error:', error);
        setError('Failed to load services');
        setServices([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleViewService = (service: Service) => {
    setSelectedService(service);
    setDialogType('view');
    setDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setDialogType('edit');
    setDialogOpen(true);
  };

  const handleAddService = () => {
    setSelectedService(null);
    setDialogType('add');
    setDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete service');
        }

        // Ensure services is always an array
        const servicesArray = Array.isArray(services) ? services : [];
        setServices(servicesArray.filter(service => service.id !== serviceId));
        setError(null);
      } catch (err) {
        setError('Failed to delete service');
      }
    }
  };

  const handleToggleServiceStatus = async (serviceId: string) => {
    try {
      // Ensure services is always an array
      const servicesArray = Array.isArray(services) ? services : [];
      const service = servicesArray.find(s => s.id === serviceId);
      if (!service) return;

      const response = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !service.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service status');
      }

      const updatedService = await response.json();
      setServices(servicesArray.map(service => 
        service.id === serviceId ? updatedService : service
      ));
      setError(null);
    } catch (err) {
      setError('Failed to update service status');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wash-fold': return 'primary';
      case 'dry-cleaning': return 'secondary';
      case 'ironing': return 'warning';
      case 'stain-removal': return 'error';
      case 'specialty': return 'info';
      default: return 'default';
    }
  };

  // Ensure services is always an array before filtering
  const servicesArray = Array.isArray(services) ? services : [];

  if (!canManageOrders()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to manage services.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Services Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddService}
        >
          Add Service
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Services
              </Typography>
              <Typography variant="h4">
                {servicesArray.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Services
              </Typography>
              <Typography variant="h4" color="success.main">
                {servicesArray.filter(s => s.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Inactive Services
              </Typography>
              <Typography variant="h4" color="warning.main">
                {servicesArray.filter(s => !s.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Price
              </Typography>
              <Typography variant="h4" color="primary.main">
                ${(servicesArray.reduce((sum, s) => sum + s.basePrice, 0) / servicesArray.length).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {servicesArray.map((service) => (
          <Box key={service.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)', lg: 'calc(25% - 18px)' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {service.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {service.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={service.isActive ? 'Active' : 'Inactive'}
                    color={service.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={service.category.replace('-', ' ')}
                    color={getCategoryColor(service.category)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="h6" color="primary">
                    ${service.basePrice.toFixed(2)}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Estimated Time: {service.estimatedTime}
                </Typography>
                
                {service.requirements && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Requirements: {service.requirements}
                  </Typography>
                )}
                
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(service.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewService(service)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Service">
                    <IconButton
                      size="small"
                      onClick={() => handleEditService(service)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={service.isActive ? 'Deactivate' : 'Activate'}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleServiceStatus(service.id)}
                    >
                      {service.isActive ? <InactiveIcon /> : <ActiveIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Service">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Service Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'add' ? 'Add New Service' : 
           dialogType === 'edit' ? 'Edit Service' : 'Service Details'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Service management dialog content would go here.
            This would include forms for editing service information,
            pricing, categories, and requirements.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          {dialogType === 'edit' && (
            <Button variant="contained">
              Save Changes
            </Button>
          )}
          {dialogType === 'add' && (
            <Button variant="contained">
              Create Service
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesManagement; 
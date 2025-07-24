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
  SelectChangeEvent,
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
  imageUrl?: string; // Added imageUrl to the interface
}

const ServicesManagement: React.FC = () => {
  const { canManageOrders } = usePermissions();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'view' | 'edit' | 'add'>('view');
  const [error, setError] = useState<string | null>(null);

  // Add Service form state
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: 'wash-fold',
    estimatedTime: '',
    requirements: '',
    isActive: true,
    picture: null as File | null,
  });
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Add edit form state
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    description: '',
    basePrice: '',
    category: 'wash-fold',
    estimatedTime: '',
    requirements: '',
    isActive: true,
    picture: null as File | null,
    imageUrl: '',
  });
  const [editPicturePreview, setEditPicturePreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
        let servicesArray: any[] = [];
        if (Array.isArray(data)) {
          servicesArray = data;
        } else if (Array.isArray(data.services)) {
          servicesArray = data.services;
        } else if (Array.isArray(data.data)) {
          servicesArray = data.data;
        } else if (data.data && Array.isArray(data.data.services)) {
          servicesArray = data.data.services;
        }
        const mappedServices = servicesArray.map((service: any) => ({
          ...service,
          id: service._id || service.id,
        }));
        setServices(mappedServices);
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
    setEditForm({
      id: service.id,
      name: service.name,
      description: service.description,
      basePrice: String(service.basePrice),
      category: service.category,
      estimatedTime: service.estimatedTime,
      requirements: service.requirements || '',
      isActive: service.isActive,
      picture: null,
      imageUrl: service.imageUrl || '',
    });
    setEditPicturePreview(service.imageUrl || null);
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

  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files && files[0]) {
      setAddForm((prev) => ({ ...prev, picture: files[0] }));
      setPicturePreview(URL.createObjectURL(files[0]));
    } else {
      setAddForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleAddFormSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleAddServiceSubmit = async () => {
    setAddLoading(true);
    setAddError(null);
    try {
      const formData = new FormData();
      formData.append('name', addForm.name);
      formData.append('description', addForm.description);
      formData.append('basePrice', addForm.basePrice);
      formData.append('category', addForm.category);
      formData.append('estimatedTime', addForm.estimatedTime);
      formData.append('requirements', addForm.requirements);
      formData.append('isActive', String(addForm.isActive));
      if (addForm.picture) {
        formData.append('picture', addForm.picture);
      }
      const response = await fetch('http://localhost:5000/api/services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to create service');
      }
      const newService = await response.json();
      setServices((prev) => Array.isArray(prev) ? [...prev, newService] : [newService]);
      setDialogOpen(false);
      setAddForm({
        name: '',
        description: '',
        basePrice: '',
        category: 'wash-fold',
        estimatedTime: '',
        requirements: '',
        isActive: true,
        picture: null,
      });
      setPicturePreview(null);
    } catch (err: any) {
      setAddError(err.message || 'Failed to create service');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files && files[0]) {
      setEditForm((prev) => ({ ...prev, picture: files[0] }));
      setEditPicturePreview(URL.createObjectURL(files[0]));
    } else if (type === 'checkbox') {
      setEditForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleEditFormSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleEditServiceSubmit = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
      formData.append('basePrice', String(Number(editForm.basePrice)));
      formData.append('category', editForm.category);
      formData.append('estimatedTime', editForm.estimatedTime);
      formData.append('requirements', editForm.requirements);
      formData.append('isActive', String(editForm.isActive));
      if (editForm.picture) {
        formData.append('picture', editForm.picture);
      }
      const response = await fetch(`http://localhost:5000/api/services/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      } as any); // as any to allow FormData
      if (!response.ok) {
        throw new Error('Failed to update service');
      }
      const updatedService = await response.json();
      setServices((prev) => prev.map((s) => (s.id === updatedService.data.id || s.id === updatedService.data._id) ? { ...s, ...updatedService.data, id: updatedService.data._id || updatedService.data.id } : s));
      setDialogOpen(false);
      setEditForm({
        id: '',
        name: '',
        description: '',
        basePrice: '',
        category: 'wash-fold',
        estimatedTime: '',
        requirements: '',
        isActive: true,
        picture: null,
        imageUrl: '',
      });
      setEditPicturePreview(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update service');
    } finally {
      setEditLoading(false);
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

  // Filter out invalid services before rendering
  const validServicesArray = servicesArray.filter(
    service => service && service.id && typeof service.category === 'string' && typeof service.name === 'string'
  );

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

  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
        {validServicesArray.map((service) => (
          <Box key={service.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)', lg: 'calc(25% - 18px)' } }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {service.imageUrl && (
                <Box sx={{ width: '100%', textAlign: 'center', pt: 2 }}>
                  <img src={service.imageUrl.startsWith('http') ? service.imageUrl : `${backendUrl}${service.imageUrl}`}
                       alt={service.name || 'Service'}
                       style={{ maxWidth: '90%', maxHeight: 120, borderRadius: 8 }} />
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {service.name || 'Unnamed Service'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {service.description || 'No description provided.'}
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
                    label={(service.category || '').replace('-', ' ')}
                    color={getCategoryColor(service.category || '')}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="h6" color="primary">
                    ${typeof service.basePrice === 'number' ? service.basePrice.toFixed(2) : '0.00'}
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
          {dialogType === 'add' ? (
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Service Name"
                name="name"
                value={addForm.name}
                onChange={handleAddFormChange}
                required
                fullWidth
              />
              <TextField
                label="Description"
                name="description"
                value={addForm.description}
                onChange={handleAddFormChange}
                required
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Base Price"
                name="basePrice"
                type="number"
                value={addForm.basePrice}
                onChange={handleAddFormChange}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={addForm.category}
                  label="Category"
                  onChange={handleAddFormSelectChange}
                >
                  <MenuItem value="wash-fold">Wash & Fold</MenuItem>
                  <MenuItem value="dry-cleaning">Dry Cleaning</MenuItem>
                  <MenuItem value="ironing">Ironing</MenuItem>
                  <MenuItem value="stain-removal">Stain Removal</MenuItem>
                  <MenuItem value="specialty">Specialty</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Estimated Time"
                name="estimatedTime"
                value={addForm.estimatedTime}
                onChange={handleAddFormChange}
                required
                fullWidth
                placeholder="e.g. 2 hours"
              />
              <TextField
                label="Requirements (optional)"
                name="requirements"
                value={addForm.requirements}
                onChange={handleAddFormChange}
                fullWidth
              />
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 1 }}
              >
                Upload Picture
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  name="picture"
                  onChange={handleAddFormChange}
                />
              </Button>
              {picturePreview && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <img src={picturePreview} alt="Preview" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8 }} />
                </Box>
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={addForm.isActive}
                    onChange={e => setAddForm(f => ({ ...f, isActive: e.target.checked }))}
                    name="isActive"
                  />
                }
                label="Active"
              />
              {addError && <Alert severity="error">{addError}</Alert>}
            </Box>
          ) : dialogType === 'edit' ? (
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Service Name"
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
                required
                fullWidth
              />
              <TextField
                label="Description"
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
                required
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Base Price"
                name="basePrice"
                type="number"
                value={editForm.basePrice}
                onChange={handleEditFormChange}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={editForm.category}
                  label="Category"
                  onChange={handleEditFormSelectChange}
                >
                  <MenuItem value="wash-fold">Wash & Fold</MenuItem>
                  <MenuItem value="dry-cleaning">Dry Cleaning</MenuItem>
                  <MenuItem value="ironing">Ironing</MenuItem>
                  <MenuItem value="stain-removal">Stain Removal</MenuItem>
                  <MenuItem value="specialty">Specialty</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Estimated Time"
                name="estimatedTime"
                value={editForm.estimatedTime}
                onChange={handleEditFormChange}
                required
                fullWidth
                placeholder="e.g. 2 hours"
              />
              <TextField
                label="Requirements (optional)"
                name="requirements"
                value={editForm.requirements}
                onChange={handleEditFormChange}
                fullWidth
              />
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 1 }}
              >
                Upload Picture
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  name="picture"
                  onChange={handleEditFormChange}
                />
              </Button>
              {editPicturePreview && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <img src={editPicturePreview} alt="Preview" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8 }} />
                </Box>
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.isActive}
                    onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                    name="isActive"
                  />
                }
                label="Active"
              />
              {editError && <Alert severity="error">{editError}</Alert>}
            </Box>
          ) : (
            <Typography variant="body1">
              Service management dialog content would go here.
              This would include forms for editing service information,
              pricing, categories, and requirements.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          {dialogType === 'add' && (
            <Button variant="contained" onClick={handleAddServiceSubmit} disabled={addLoading}>
              {addLoading ? 'Creating...' : 'Create Service'}
            </Button>
          )}
          {dialogType === 'edit' && (
            <Button variant="contained" onClick={handleEditServiceSubmit} disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesManagement; 
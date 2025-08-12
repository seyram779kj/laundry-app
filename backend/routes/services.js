import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Typography, Box, CircularProgress, Grid } from '@mui/material';

// Assume getStaticServices is imported or defined elsewhere if needed for initial data load,
// but the primary issue is input focus, which is a client-side React problem.
// If the service fetching was indeed the problem, the backend route would need adjustment,
// but the user's stated problem is input focus.

function ServiceForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const serviceToEdit = location.state?.service;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/services/categories/list'); // Assuming this API endpoint exists
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        } else {
          setError('Failed to fetch categories');
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);


  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required('Service name is required'),
    category: Yup.string().required('Category is required'),
    basePrice: Yup.number().required('Base price is required').positive('Base price must be positive'),
    description: Yup.string().required('Description is required'),
    isAvailable: Yup.boolean(),
  });

  // Initial values for the form
  const initialValues = {
    name: serviceToEdit ? serviceToEdit.name : '',
    category: serviceToEdit ? serviceToEdit.category : '',
    basePrice: serviceToEdit ? serviceToEdit.basePrice : 0,
    description: serviceToEdit ? serviceToEdit.description : '',
    isAvailable: serviceToEdit ? serviceToEdit.isAvailable : true,
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    setError('');
    const method = serviceToEdit ? 'PUT' : 'POST';
    const url = serviceToEdit ? `/api/services/${serviceToEdit._id}` : '/api/services';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          // Add authorization token if applicable
          // 'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      navigate('/services'); // Navigate back to the services list on success

    } catch (err) {
      console.error("Form submission error:", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Handling the focus issue: Use a stable key or ensure Formik's internal handling
  // of input focus is not disrupted. For Formik, state changes that don't directly
  // involve the input's value or its ref should generally not cause loss of focus.
  // If a re-render is happening due to external state changes, consider optimizing
  // those re-renders or ensuring the input components are stable.
  // For now, let's assume Formik's default behavior is sufficient and the issue
  // might stem from other parts of the application re-rendering this component unnecessarily.
  // We can add a `key` prop to the Formik component if we suspect it needs to be
  // re-mounted when certain props change, but that's usually a last resort.

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        {serviceToEdit ? 'Edit Service' : 'Add New Service'}
      </Typography>
      {error && (
        <Typography color="error" variant="body2" align="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize // This helps if serviceToEdit changes, though not directly related to focus loss
      >
        {({ isSubmitting, values, setFieldValue }) => (
          <Form>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  name="name"
                  label="Service Name"
                  fullWidth
                  variant="outlined"
                  error={!!(touched.name && errors.name)}
                  helperText={touched.name && errors.name}
                  // Key prop is not typically needed here for focus, Formik manages it.
                  // If focus is lost, it's more likely due to parent re-renders.
                  // InputProps={{ style: { pointerEvents: 'auto' } }} // This is not needed for focus
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  select
                  name="category"
                  label="Category"
                  fullWidth
                  variant="outlined"
                  SelectProps={{ native: true }}
                  error={!!(touched.category && errors.category)}
                  helperText={touched.category && errors.category}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Field>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="basePrice"
                  label="Base Price"
                  type="number"
                  fullWidth
                  variant="outlined"
                  error={!!(touched.basePrice && errors.basePrice)}
                  helperText={touched.basePrice && errors.basePrice}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="isAvailable"
                  label="Availability"
                  select
                  fullWidth
                  variant="outlined"
                  SelectProps={{ native: true }}
                  error={!!(touched.isAvailable && errors.isAvailable)}
                  helperText={touched.isAvailable && errors.isAvailable}
                >
                  <option value={true}>Available</option>
                  <option value={false}>Not Available</option>
                </Field>
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  name="description"
                  label="Description"
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  error={!!(touched.description && errors.description)}
                  helperText={touched.description && errors.description}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || isLoading}
                sx={{ px: 4, py: 1.5 }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : (serviceToEdit ? 'Update Service' : 'Add Service')}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default ServiceForm;
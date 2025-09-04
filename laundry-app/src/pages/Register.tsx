import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Divider,
  Stack,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { register } from '../features/auth/authSlice';
import { UserRole } from '../types/auth';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import AppleIcon from '@mui/icons-material/Apple';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { formatUserData } from '../utils/textUtils';

const steps = ['Email Verification', 'User Information', 'Complete Registration'];

const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as UserRole,
  });

  // Phone number validation functions
  const validatePhoneNumber = (phone: string): { isValid: boolean; message: string } => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Ghanaian phone number validation
    // Valid formats: 0241234567, 0541234567, 0201234567, 0501234567, 0261234567, 0561234567
    // Also supports: +233241234567, +233541234567, etc.
    
    if (!cleanPhone) {
      return { isValid: false, message: 'Phone number is required' };
    }
    
    // Check if it starts with +233 (international format)
    if (cleanPhone.startsWith('233')) {
      const localNumber = cleanPhone.substring(3);
      if (localNumber.length === 9) {
        const prefix = localNumber.substring(0, 2);
        if (['02', '03', '05', '06', '07', '08', '09'].includes(prefix)) {
          return { isValid: true, message: '' };
        }
      }
    }
    
    // Check local format (10 digits starting with 0)
    if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
      const prefix = cleanPhone.substring(1, 3);
      if (['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(prefix)) {
        return { isValid: true, message: '' };
      }
    }
    
    return { isValid: false, message: 'Please enter a valid Ghanaian phone number' };
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    
    // If it starts with +233, format as international
    if (cleanValue.startsWith('233')) {
      const localNumber = cleanValue.substring(3);
      if (localNumber.length <= 9) {
        return `+233 ${localNumber}`;
      }
    }
    
    // Format as local number
    if (cleanValue.length <= 10) {
      if (cleanValue.startsWith('0')) {
        return cleanValue;
      } else if (cleanValue.length > 0) {
        return `0${cleanValue}`;
      }
    }
    
    return cleanValue;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const formattedValue = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSocialLogin = (provider: string) => {
    alert(`${provider} login will be implemented soon!`);
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!email.includes('@')) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return 'First name is required';
    }
    if (!formData.lastName.trim()) {
      return 'Last name is required';
    }
    
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      return phoneValidation.message;
    }
    
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    return null;
  };

  const handleCheckEmail = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Verification code sent to your email!');
        setActiveStep(1);
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { API_BASE_URL } = await import('../services/api');
      const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEmailVerified(true);
        setSuccess('Email verified successfully!');
        setActiveStep(2);
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== REGISTRATION ATTEMPT STARTED ===');
    console.log('Form data:', { 
      email: email, 
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      password: formData.password ? '***' : 'empty',
      role: formData.role
    });
    
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      console.log('❌ Validation error:', validationError);
      setError(validationError);
      return;
    }

    if (!isEmailVerified) {
      setError('Please verify your email first');
      return;
    }

    console.log('✅ Starting registration process...');
    setLoading(true);
    try {
      // Format user data before sending to database (excluding password)
      const formattedUserData = formatUserData({
        email: email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      });

      console.log('🚀 Dispatching register action...');
      const result = await dispatch(register({
        ...formattedUserData,
        password: formData.password,
        role: formattedUserData.role as UserRole,
        verificationCode: verificationCode,
      })).unwrap();
      
      console.log('✅ Registration successful:', result);
      
      // Navigate to dashboard based on role
      let targetPath = '/customer';
      switch (result.role) {
        case 'admin': targetPath = '/admin'; break;
        case 'service_provider': targetPath = '/provider'; break;
        case 'customer': targetPath = '/customer'; break;
        default: targetPath = '/customer';
      }
      
      console.log(`🎯 Navigating to: ${targetPath}`);
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(typeof err === 'string' ? err : (err?.message || 'Registration failed. Please try again.'));
    } finally {
      console.log('🏁 Registration process finished');
      setLoading(false);
    }
  };

  const phoneValidation = validatePhoneNumber(formData.phoneNumber);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 1: Email Verification
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Enter your email address to receive a verification code
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleCheckEmail}
              disabled={loading || !email.trim()}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 2: Verify Email
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Enter the 6-digit code sent to {email}
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
              }}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                sx={{ flex: 1 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                sx={{ flex: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify Code'}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 3: Complete Registration
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Fill in your personal information to complete registration
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="0241234567 or +233241234567"
                  error={formData.phoneNumber.length > 0 && !phoneValidation.isValid}
                  helperText={formData.phoneNumber.length > 0 ? phoneValidation.message : 'Enter your Ghanaian phone number'}
                  InputProps={{
                    endAdornment: formData.phoneNumber.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {phoneValidation.isValid ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  helperText={formData.password.length > 0 && formData.password.length < 8 ? 'Password must be at least 8 characters' : ''}
                  InputProps={{
                    endAdornment: formData.password.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {formData.password.length >= 8 ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  error={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword}
                  helperText={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword ? 'Passwords do not match' : ''}
                  InputProps={{
                    endAdornment: formData.confirmPassword.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {formData.password === formData.confirmPassword ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading || !phoneValidation.isValid}
                >
                  {loading ? <CircularProgress size={24} /> : 'Complete Registration'}
                </Button>
              </Box>
            </form>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Create Account
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Create your customer account to start using our laundry services
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Animated decorative element on first step (replaces social login) */}
        {activeStep === 0 && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            {/* Simple animated dot that moves horizontally */}
            <Box
              sx={{
                width: 200,
                height: 8,
                bgcolor: 'grey.200',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                '::before': {
                  content: '""',
                  position: 'absolute',
                  top: -6,
                  left: 0,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: 'moveDot 1.6s ease-in-out infinite',
                },
                '@keyframes moveDot': {
                  '0%': { transform: 'translateX(0)' },
                  '50%': { transform: 'translateX(180px)' },
                  '100%': { transform: 'translateX(0)' },
                },
              }}
            />
          </Box>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register; 
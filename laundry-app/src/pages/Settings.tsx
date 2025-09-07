import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Popover,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useAppSelector } from '../app/hooks';

const Settings: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Change Password Dropdown State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null);

  // Dummy notification state for UI
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
  };
  const handleSavePhoneNumber = () => {
    // TODO: Implement API call to update phone number
    console.log('Saving phone number:', phoneNumber);
  };
  const handleDropdownClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleDropdownClose = () => {
    setAnchorEl(null);
    setChangeError(null);
    setChangeSuccess(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };
  const open = Boolean(anchorEl);
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);
    setChangeSuccess(null);
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangeError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setChangeError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangeError('New passwords do not match.');
      return;
    }
    setChangeLoading(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setChangeError(data.error || 'Failed to change password.');
      } else {
        setChangeSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setChangeError('Network error. Please try again.');
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        <FormControlLabel
          control={<Switch checked={emailNotifications} onChange={() => setEmailNotifications((v) => !v)} />}
          label="Email Notifications"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>
        <Button variant="contained" color="primary" onClick={handleDropdownClick} sx={{ mb: 2 }}>
          Change Password
        </Button>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleDropdownClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Box sx={{ p: 2, minWidth: 300 }}>
            <form onSubmit={handleChangePassword}>
              <TextField
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                fullWidth
                margin="normal"
              />
              {changeError && <Alert severity="error">{changeError}</Alert>}
              {changeSuccess && <Alert severity="success">{changeSuccess}</Alert>}
              <Button type="submit" variant="contained" color="primary" disabled={changeLoading} sx={{ mt: 2 }}>
                {changeLoading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </form>
          </Box>
        </Popover>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Contact Information
        </Typography>
        <Stack spacing={3}>
          <TextField
            label="Phone Number"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            fullWidth
            type="tel"
            placeholder="Enter your phone number"
          />
          <Box>
            <Button
              variant="contained"
              onClick={handleSavePhoneNumber}
              disabled={!phoneNumber}
            >
              Save Phone Number
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};
export default Settings;
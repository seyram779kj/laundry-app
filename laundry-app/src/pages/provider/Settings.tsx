export {};

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
} from '@mui/material';
import { useAppSelector } from '../../app/hooks';
import { ServiceProviderUser } from '../../types/auth';

const Settings: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const serviceProvider = user as ServiceProviderUser;

  const [phoneNumber, setPhoneNumber] = useState(serviceProvider?.phoneNumber || '');
  const [location, setLocation] = useState(serviceProvider?.location || '');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
  };

  const handleSavePhoneNumber = () => {
    // TODO: Implement API call to update phone number
    console.log('Saving phone number:', phoneNumber);
  };

  const handleRemoveLocation = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmRemoveLocation = () => {
    // TODO: Implement API call to remove location
    setLocation('');
    setConfirmDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
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

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Location
        </Typography>
        <Stack spacing={3}>
          <TextField
            label="Current Location"
            value={location}
            fullWidth
            disabled
            helperText="Your current service area location"
          />
          <Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleRemoveLocation}
              disabled={!location}
            >
              Remove Location
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Remove Location</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove your location? This will affect your ability to receive orders in your current service area.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmRemoveLocation} color="error" variant="contained">
            Remove Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings; 
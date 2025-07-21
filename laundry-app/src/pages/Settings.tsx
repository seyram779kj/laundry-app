import React from 'react';
import { Box, Typography, Paper, Switch, FormControlLabel } from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <FormControlLabel
          control={<Switch />}
          label="Email Notifications"
        />
        <FormControlLabel
          control={<Switch />}
          label="SMS Notifications"
        />
      </Paper>
    </Box>
  );
};

export default Settings; 
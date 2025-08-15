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
  TablePagination,
  Chip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchPaymentHistory,
  fetchPaymentStats,
  exportPaymentHistory,
  fetchPaymentReceipt,
  clearPaymentHistory,
  setSelectedPayment,
  clearSelectedPayment,
} from '../features/payment/paymentSlice';

// Status and method configurations
const paymentStatuses = [
  { value: 'all', label: 'All Statuses', color: 'default' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'processing', label: 'Processing', color: 'info' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'failed', label: 'Failed', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' },
];

const paymentMethods = [
  { value: 'all', label: 'All Methods' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'digital_wallet', label: 'Digital Wallet' },
  { value: 'momo', label: 'Mobile Money' },
];

const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'amount', label: 'Amount' },
  { value: 'status', label: 'Status' },
  { value: 'paymentMethod', label: 'Payment Method' },
];

const PaymentHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    paymentHistory, 
    paymentStats, 
    selectedPayment,
    loading 
  } = useAppSelector((state) => state.payment);
  const { user } = useAppSelector((state) => state.auth);

  // Filter states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Dialog states
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);

  // Load data on component mount and when filters change
  useEffect(() => {
    loadPaymentHistory();
    loadPaymentStats();
  }, [page, rowsPerPage, search, status, paymentMethod, startDate, endDate, sortBy, sortOrder]);

  const loadPaymentHistory = () => {
    const params: any = {
      page: page + 1,
      limit: rowsPerPage,
      sortBy,
      sortOrder,
    };

    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    if (paymentMethod !== 'all') params.paymentMethod = paymentMethod;
    if (startDate) params.startDate = startOfDay(startDate).toISOString();
    if (endDate) params.endDate = endOfDay(endDate).toISOString();

    dispatch(fetchPaymentHistory(params));
  };

  const loadPaymentStats = () => {
    const params: any = {};
    if (startDate) params.startDate = startOfDay(startDate).toISOString();
    if (endDate) params.endDate = endOfDay(endDate).toISOString();

    dispatch(fetchPaymentStats(params));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleViewReceipt = async (paymentId: string) => {
    await dispatch(fetchPaymentReceipt(paymentId));
    setReceiptDialog(true);
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    const params: any = { format };
    if (status !== 'all') params.status = status;
    if (paymentMethod !== 'all') params.paymentMethod = paymentMethod;
    if (startDate) params.startDate = startOfDay(startDate).toISOString();
    if (endDate) params.endDate = endOfDay(endDate).toISOString();

    try {
      const result = await dispatch(exportPaymentHistory(params));
      
      if (format === 'csv' && result.payload instanceof Blob) {
        // Download CSV file
        const url = window.URL.createObjectURL(result.payload);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `payment-history-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      setExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const applyQuickFilter = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(start);
    setEndDate(end);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setPaymentMethod('all');
    setStartDate(null);
    setEndDate(null);
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(0);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    const statusConfig = paymentStatuses.find(s => s.value === status);
    return (statusConfig?.color as any) || 'default';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" color="primary">
          Payment History
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPaymentHistory}
            disabled={paymentHistory.loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialog(true)}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialog(true)}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      {paymentStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Total Payments
                    </Typography>
                    <Typography variant="h4">
                      {paymentStats.totals?.totalPayments || 0}
                    </Typography>
                  </Box>
                  <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Total Amount
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(paymentStats.totals?.totalAmount || 0)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Completed
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(paymentStats.totals?.completedAmount || 0)}
                    </Typography>
                  </Box>
                  <Chip label="Completed" color="success" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Pending
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(paymentStats.totals?.pendingAmount || 0)}
                    </Typography>
                  </Box>
                  <Chip label="Pending" color="warning" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Quick Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by transaction ID, order number, or notes..."
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearch('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={() => applyQuickFilter(7)}>Last 7 days</Button>
              <Button size="small" onClick={() => applyQuickFilter(30)}>Last 30 days</Button>
              <Button size="small" onClick={() => applyQuickFilter(90)}>Last 90 days</Button>
              <Button size="small" onClick={clearFilters} color="secondary">Clear All</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Payment History Table */}
      <Paper>
        {paymentHistory.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : paymentHistory.error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {paymentHistory.error}
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.data.map((payment) => (
                    <TableRow key={payment._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {payment.transactionId || payment.paymentDetails?.transactionRef || payment._id.slice(-8)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {payment.orderInfo && (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {payment.orderInfo.orderNumber}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {payment.orderInfo.itemCount} item(s)
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {payment.formattedAmount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.paymentMethod.replace('_', ' ').toUpperCase()} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.status.toUpperCase()} 
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(payment.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Receipt">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewReceipt(payment._id)}
                            disabled={payment.status !== 'completed'}
                          >
                            <ReceiptIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {paymentHistory.pagination && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={paymentHistory.pagination.total || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )}
          </>
        )}
      </Paper>

      {/* Filter Dialog */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
                  {paymentStatuses.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Method">
                  {paymentMethods.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort By">
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sort Order</InputLabel>
                <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} label="Sort Order">
                  <MenuItem value="desc">Descending</MenuItem>
                  <MenuItem value="asc">Ascending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearFilters}>Clear All</Button>
          <Button onClick={() => setFilterDialog(false)}>Cancel</Button>
          <Button onClick={() => setFilterDialog(false)} variant="contained">Apply Filters</Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Payment History</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Export your payment history data in the selected format.
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              fullWidth
            >
              Export as CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('json')}
              fullWidth
            >
              Export as JSON
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onClose={() => setReceiptDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Payment Receipt</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Payment Information</Typography>
                  <Typography><strong>Transaction ID:</strong> {selectedPayment.payment?.transactionId}</Typography>
                  <Typography><strong>Amount:</strong> {selectedPayment.payment?.formattedAmount}</Typography>
                  <Typography><strong>Status:</strong> {selectedPayment.payment?.status}</Typography>
                  <Typography><strong>Method:</strong> {selectedPayment.payment?.paymentMethod}</Typography>
                  <Typography><strong>Date:</strong> {selectedPayment.payment?.createdAt && formatDate(selectedPayment.payment.createdAt)}</Typography>
                </Grid>
                {selectedPayment.order && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Order Information</Typography>
                    <Typography><strong>Order Number:</strong> {selectedPayment.order.orderNumber}</Typography>
                    <Typography><strong>Status:</strong> {selectedPayment.order.status}</Typography>
                    <Typography><strong>Items:</strong> {selectedPayment.order.items?.length || 0} item(s)</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
                  <Typography><strong>Name:</strong> {selectedPayment.customer?.name}</Typography>
                  <Typography><strong>Email:</strong> {selectedPayment.customer?.email}</Typography>
                  <Typography><strong>Phone:</strong> {selectedPayment.customer?.phone}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Download Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentHistory;

const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { protect, admin, serviceProvider } = require('../middleware/auth');
const momoService = require('../services/momoService');

// Get all payments (with filtering)
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentMethod, 
      startDate, 
      endDate,
      userId 
    } = req.query;
    
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment method
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by user
    if (userId) {
      if (req.user.role === 'admin') {
        query.$or = [{ customer: userId }, { serviceProvider: userId }];
      } else {
        query.$or = [{ customer: req.user.id }, { serviceProvider: req.user.id }];
      }
    } else if (req.user.role !== 'admin') {
      query.$or = [{ customer: req.user.id }, { serviceProvider: req.user.id }];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'order', select: 'orderNumber status totalAmount' },
        { path: 'customer', select: 'firstName lastName email' },
        { path: 'serviceProvider', select: 'firstName lastName businessDetails' }
      ],
      sort: { createdAt: -1 }
    };

    const payments = await Payment.paginate(query, options);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// Get payment by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber status totalAmount')
      .populate('customer', 'firstName lastName email')
      .populate('serviceProvider', 'firstName lastName businessDetails');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        payment.customer.toString() !== req.user.id && 
        payment.serviceProvider?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
});

// Create payment for order
router.post('/', protect, async (req, res) => {
  try {
    const {
      orderId,
      amount,
      paymentMethod,
      paymentDetails,
      notes
    } = req.body;

    // Validate required fields
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order ID, amount, and payment method are required' 
      });
    }

    // Get order details
    const order = await Order.findById(orderId)
      .populate('customer', 'firstName lastName email')
      .populate('serviceProvider', 'firstName lastName businessDetails');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if user is the customer for this order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ order: orderId });
    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment already exists for this order' 
      });
    }

    const paymentData = {
      order: orderId,
      customer: order.customer._id,
      serviceProvider: order.serviceProvider._id,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDetails: paymentDetails || {},
      status: 'pending',
      notes: notes || ''
    };

    const payment = await Payment.create(paymentData);
    await payment.populate([
      { path: 'order', select: 'orderNumber status totalAmount' },
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'serviceProvider', select: 'firstName lastName businessDetails' }
    ]);

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
});

// Update payment status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, transactionId, notes } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions (admin or service provider)
    if (req.user.role !== 'admin' && payment.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
      completed: [],
      failed: ['pending'],
      cancelled: []
    };

    if (!validTransitions[payment.status].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status transition from ${payment.status} to ${status}` 
      });
    }

    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;
    if (notes) payment.notes = notes;

    payment.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: notes || ''
    });

    await payment.save();
    await payment.populate([
      { path: 'order', select: 'orderNumber status totalAmount' },
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'serviceProvider', select: 'firstName lastName businessDetails' }
    ]);

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment status' });
  }
});

// Process payment (simulate payment processing)
router.post('/:id/process', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && payment.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment is not in pending status' 
      });
    }

    // Simulate payment processing
    payment.status = 'processing';
    payment.processedAt = new Date();
    payment.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate processing delay
    setTimeout(async () => {
      payment.status = 'completed';
      payment.completedAt = new Date();
      
      payment.statusHistory.push({
        status: 'completed',
        changedBy: req.user.id,
        changedAt: new Date(),
        notes: 'Payment processed successfully'
      });

      await payment.save();
    }, 2000);

    await payment.save();
    await payment.populate([
      { path: 'order', select: 'orderNumber status totalAmount' },
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'serviceProvider', select: 'firstName lastName businessDetails' }
    ]);

    res.json({
      success: true,
      data: payment,
      message: 'Payment processing started'
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment' });
  }
});

// Get payment statistics
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by user role
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }

    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalPayments = await Payment.countDocuments(query);
    const totalRevenue = await Payment.aggregate([
      { $match: { ...query, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPayments = await Payment.countDocuments({ ...query, status: 'pending' });
    const completedPayments = await Payment.countDocuments({ ...query, status: 'completed' });

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingPayments,
        completedPayments
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment statistics' });
  }
});

// Process MoMo payment
router.post('/:id/momo', protect, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber status totalAmount')
      .populate('customer', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions
    if (payment.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment is not in pending status' 
      });
    }

    if (payment.paymentMethod !== 'momo') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment method is not Mobile Money' 
      });
    }

    // Validate phone number
    if (!phoneNumber || !momoService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid phone number is required' 
      });
    }

    const formattedPhone = momoService.formatPhoneNumber(phoneNumber);

    // Initiate MoMo payment
    const momoResult = await momoService.initiatePayment({
      amount: payment.amount,
      phoneNumber: formattedPhone,
      customerName: `${payment.customer.firstName} ${payment.customer.lastName}`,
      orderId: payment.order._id
    });

    // Update payment with MoMo details
    payment.paymentDetails = {
      phoneNumber: formattedPhone,
      transactionRef: momoResult.transactionRef,
      momoStatus: momoResult.status
    };

    if (momoResult.success) {
      if (momoResult.status === 'completed') {
        payment.status = 'completed';
        payment.transactionId = momoResult.transactionId;
        payment.completedAt = new Date();
      } else if (momoResult.status === 'pending') {
        payment.status = 'processing';
        payment.processedAt = new Date();
      }
    } else {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = momoResult.message;
    }

    await payment.save();

    res.json({
      success: momoResult.success,
      data: payment,
      message: momoResult.message,
      momoDetails: {
        transactionRef: momoResult.transactionRef,
        status: momoResult.status,
        paymentUrl: momoResult.paymentUrl
      }
    });
  } catch (error) {
    console.error('MoMo payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to process MoMo payment' });
  }
});

// Check MoMo payment status
router.get('/:id/momo/status', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions
    if (payment.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (payment.paymentMethod !== 'momo' || !payment.paymentDetails?.transactionRef) {
      return res.status(400).json({ 
        success: false, 
        error: 'No MoMo transaction found for this payment' 
      });
    }

    // Check status with MoMo service
    const statusResult = await momoService.checkPaymentStatus(payment.paymentDetails.transactionRef);

    // Update payment status if changed
    if (statusResult.success && statusResult.status !== payment.paymentDetails.momoStatus) {
      payment.paymentDetails.momoStatus = statusResult.status;
      
      if (statusResult.status === 'completed' && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.transactionId = statusResult.transactionId;
        payment.completedAt = new Date();
      } else if (statusResult.status === 'failed' && payment.status !== 'failed') {
        payment.status = 'failed';
        payment.failedAt = new Date();
        payment.failureReason = statusResult.message;
      }

      await payment.save();
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        momoStatus: statusResult.status,
        transactionRef: payment.paymentDetails.transactionRef,
        message: statusResult.message
      }
    });
  } catch (error) {
    console.error('MoMo status check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check MoMo payment status' });
  }
});

// Get payment methods
router.get('/methods/list', async (req, res) => {
  try {
    const paymentMethods = [
      { id: 'credit_card', name: 'Credit Card', icon: 'credit_card' },
      { id: 'debit_card', name: 'Debit Card', icon: 'credit_card' },
      { id: 'bank_transfer', name: 'Bank Transfer', icon: 'account_balance' },
      { id: 'cash', name: 'Cash', icon: 'attach_money' },
      { id: 'digital_wallet', name: 'Digital Wallet', icon: 'account_balance_wallet' },
      { id: 'momo', name: 'Mobile Money', icon: 'phone_android' }
    ];
    
    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment methods' });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Service = require('../models/Service');
const { protect, admin, serviceProvider } = require('../middleware/auth');

// Get all orders (with filtering)
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role, userId } = req.query;
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by user role
    if (role === 'customer') {
      query.customer = req.user.id;
    } else if (role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }

    // Filter by specific user
    if (userId) {
      if (req.user.role === 'admin') {
        query.$or = [{ customer: userId }, { serviceProvider: userId }];
      } else {
        query.$or = [{ customer: req.user.id }, { serviceProvider: req.user.id }];
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'customer', select: 'firstName lastName email phoneNumber' },
        { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
        { path: 'service', select: 'name price description' }
      ],
      sort: { createdAt: -1 }
    };

    const orders = await Order.paginate(query, options);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email phoneNumber')
      .populate('serviceProvider', 'firstName lastName email phoneNumber businessDetails')
      .populate('service', 'name price description');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if user has access to this order
    if (req.user.role !== 'admin' && 
        order.customer.toString() !== req.user.id && 
        order.serviceProvider?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', protect, async (req, res) => {
  try {
    const {
      serviceId,
      serviceProviderId,
      items,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      deliveryDate,
      paymentMethod,
      isUrgent,
      priority,
      specialInstructions,
      subtotal,
      totalAmount,
      tax,
      deliveryFee
    } = req.body;

    console.log('Order creation payload:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order items are required' 
      });
    }

    if (!pickupAddress || !deliveryAddress || !pickupDate || !deliveryDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pickup/delivery addresses and dates are required' 
      });
    }

    // Validate and process items
    const processedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const service = await Service.findById(item.service);
      if (!service) {
        return res.status(404).json({ 
          success: false, 
          error: `Service not found: ${item.service}` 
        });
      }

      const quantity = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || service.price || 0;
      const totalPrice = quantity * unitPrice;

      processedItems.push({
        service: item.service,
        serviceName: item.serviceName || service.name,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        specialInstructions: item.specialInstructions || ''
      });

      calculatedSubtotal += totalPrice;
    }

    // Calculate totals
    const finalSubtotal = parseFloat(subtotal) || calculatedSubtotal;
    const finalTax = parseFloat(tax) || (finalSubtotal * 0.1);
    const finalDeliveryFee = parseFloat(deliveryFee) || (isUrgent ? 10 : 5);
    const finalTotal = parseFloat(totalAmount) || (finalSubtotal + finalTax + finalDeliveryFee);

    // Create order data
    const orderData = {
      customer: req.user.id,
      serviceProvider: serviceProviderId || null,
      items: processedItems,
      status: 'pending',
      subtotal: finalSubtotal,
      tax: finalTax,
      deliveryFee: finalDeliveryFee,
      totalAmount: finalTotal,
      pickupAddress: {
        type: pickupAddress.type || 'home',
        street: pickupAddress.street,
        city: pickupAddress.city,
        state: pickupAddress.state,
        zipCode: pickupAddress.zipCode,
        instructions: pickupAddress.instructions || ''
      },
      deliveryAddress: {
        type: deliveryAddress.type || 'home',
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.zipCode,
        instructions: deliveryAddress.instructions || ''
      },
      pickupDate: new Date(pickupDate),
      deliveryDate: new Date(deliveryDate),
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'pending',
      isUrgent: Boolean(isUrgent),
      priority: priority || 'normal',
      notes: {
        customer: specialInstructions || '',
        serviceProvider: '',
        admin: ''
      }
    };

    console.log('Final order data:', JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData);
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' }
    ]);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create order' });
  }
});

// Update order status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check permissions
    if (req.user.role === 'service_provider' && order.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (req.user.role === 'customer' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status transition from ${order.status} to ${status}` 
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: req.body.notes || ''
    });

    await order.save();
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
      { path: 'service', select: 'name price description' }
    ]);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

// Update order details (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
      { path: 'service', select: 'name price description' }
    ]);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

// Delete order (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete order' });
  }
});

// Get order statistics
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

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order statistics' });
  }
});

module.exports = router; 
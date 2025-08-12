const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, admin, serviceProvider, customer } = require('../middleware/auth');

// Get all orders (with filtering)
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role, userId, include_available } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (role === 'customer') {
      query.customer = req.user.id;
    } else if (role === 'service_provider') {
      if (include_available === 'true') {
        // Include both assigned orders and available orders for self-assignment
        query.$or = [
          { serviceProvider: req.user.id },
          { 
            serviceProvider: null, 
            status: { $in: ['pending', 'confirmed'] } 
          }
        ];
      } else {
        query.serviceProvider = req.user.id;
      }
    }

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
      ],
      sort: { createdAt: -1 },
    };

    const orders = await Order.paginate(query, options);

    res.json({
      success: true,
      data: orders,
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
      .populate('serviceProvider', 'firstName lastName email phoneNumber businessDetails');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (req.user.role !== 'admin' &&
        order.customer.toString() !== req.user.id &&
        order.serviceProvider?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', protect, customer, async (req, res) => {
  try {
    console.log('Received order data:', req.body);

    const { STATIC_SERVICES } = require('../config/staticServices');

    const {
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
      tax,
      deliveryFee,
      totalAmount,
      momoPhone,
      momoNetwork,
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required',
      });
    }

    if (!pickupAddress || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Pickup and delivery addresses are required',
      });
    }

    if (!pickupDate || !deliveryDate) {
      return res.status(400).json({
        success: false,
        error: 'Pickup and delivery dates are required',
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Payment method is required',
      });
    }

    // Validate service IDs exist in static services
    console.log('Available static services:', STATIC_SERVICES.map(s => ({ id: s._id, name: s.name })));

    for (const item of items) {
      console.log(`Checking service: ${item.service}`);
      if (!item.service) {
        console.log('Service ID is missing or null');
        return res.status(400).json({
          success: false,
          error: 'Service is required',
        });
      }

      const service = STATIC_SERVICES.find(s => s._id === item.service);
      if (!service) {
        console.log(`Service ${item.service} not found in static services`);
        console.log('Available service IDs:', STATIC_SERVICES.map(s => s._id));
        return res.status(400).json({
          success: false,
          error: `Service ${item.service} not found`,
        });
      }

      console.log(`Service ${item.service} found:`, service.name);
    }

    // Process items for the order document
    const processedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const service = STATIC_SERVICES.find(s => s._id === item.service);
      const quantity = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || service.price || 0;
      const totalPrice = quantity * unitPrice;

      processedItems.push({
        service: item.service, // Store the static service ID as a string
        serviceName: item.serviceName || service.name,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        specialInstructions: item.specialInstructions || '',
      });

      calculatedSubtotal += totalPrice;
    }

    // Calculate totals
    const finalSubtotal = parseFloat(subtotal) || calculatedSubtotal;
    const finalTax = parseFloat(tax) || finalSubtotal * 0.1;
    const finalDeliveryFee = parseFloat(deliveryFee) || (isUrgent ? 10 : 5);
    const finalTotal = parseFloat(totalAmount) || finalSubtotal + finalTax + finalDeliveryFee;

    // Create order data
    const orderData = {
      customer: req.user.id,
      serviceProvider: null,
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
        instructions: pickupAddress.instructions || '',
      },
      deliveryAddress: {
        type: deliveryAddress.type || 'home',
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.zipCode,
        instructions: deliveryAddress.instructions || '',
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
        admin: '',
      },
      ...(paymentMethod === 'momo' && {
        momoPhone,
        momoNetwork,
      }),
    };

    console.log('Final order data:', JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData);
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    res.status(201).json({
      success: true,
      data: order,
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

    if (req.user.role === 'service_provider' && order.serviceProvider && order.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (req.user.role === 'customer' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['assigned', 'in_progress', 'cancelled'],
      assigned: ['confirmed', 'in_progress', 'cancelled'],
      in_progress: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from ${order.status} to ${status}`,
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: req.body.notes || '',
    });

    await order.save();
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    res.json({
      success: true,
      data: order,
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
    ]);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

// Self-assign order (service providers only)
router.put('/:id/assign-self', protect, serviceProvider, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if order is available for assignment
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Order is not available for assignment' 
      });
    }

    // Check if order already has a service provider assigned
    if (order.serviceProvider) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order is already assigned to a service provider' 
      });
    }

    // Assign the order to the current service provider
    order.serviceProvider = req.user.id;
    order.status = 'assigned';
    
    // Add to status history
    order.statusHistory.push({
      status: 'assigned',
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: 'Service provider self-assigned to order',
    });

    await order.save();
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    res.json({
      success: true,
      data: order,
      message: 'Successfully assigned to order',
    });
  } catch (error) {
    console.error('Self-assign order error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign order' });
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
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete order' });
  }
});

// Get order statistics
router.get('/stats-overview', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

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
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const totalOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order statistics' });
  }
});

module.exports = router;
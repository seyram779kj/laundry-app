const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, admin, serviceProvider, customer } = require('../middleware/auth');
const Payment = require('../models/Payment'); // Import Payment model
const OrderTracking = require('../models/OrderTracking'); // Import OrderTracking model

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
        { path: 'payment' }, // Populate the payment details
 { path: 'payment' } // Populate the payment details
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
 .populate('payment') // Populate the payment details
 .populate('payment') // Populate the payment details
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
      specialInstructions,
      subtotal,
      tax,
      deliveryFee,
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

    const finalSubtotal = parseFloat(subtotal) || calculatedSubtotal;
    const finalTax = parseFloat(tax) || finalSubtotal * 0.1; // Example tax calculation
    const finalDeliveryFee = parseFloat(deliveryFee) || 5; // Example delivery fee
    const finalTotal = parseFloat(totalAmount) || finalSubtotal + finalTax + finalDeliveryFee;

    // Create order data
    const orderData = {
      customer: req.user.id,
      serviceProvider: null,
      items: processedItems,
      status: 'pending',
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

    // Create a new payment document for the order
    const paymentData = {
      order: order._id,
      customer: req.user.id,
      serviceProvider: order.serviceProvider, // Can be null initially
      amount: order.totalAmount,
      paymentMethod: orderData.paymentMethod,
      paymentDetails: orderData.paymentMethod === 'momo' ? { phoneNumber: momoPhone, momoNetwork } : {},
      status: 'pending', // Initial payment status
      statusHistory: [{
        status: 'pending',
        changedBy: req.user.id,
        changedAt: new Date(),
        notes: 'Payment initiated with order creation'
      }]
    };

    const payment = await Payment.create(paymentData);

    // Link the payment to the order
 order.payment = payment._id;
 await order.save();

    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
 { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
 { path: 'payment' } // Populate the payment details after linking
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
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'assigned', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status: ${status}` 
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check permissions
    if (req.user.role === 'service_provider') {
      // Service providers can only update orders assigned to them
      if (!order.serviceProvider || order.serviceProvider.toString() !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          error: 'You can only update orders assigned to you' 
        });
      }
    } else if (req.user.role === 'customer') {
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
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
        error: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    // Update the order
    order.status = status;
    
    // Initialize statusHistory if it doesn't exist
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: req.body.notes || '',
    });

    await order.save();
    
    // Find or create OrderTracking document and update location/status
    let tracking = await OrderTracking.findOne({ order: order._id });
    if (!tracking) tracking = new OrderTracking({ order: order._id });
    await tracking.updateLocation(status, req.body.notes, req.user.id);
    // Populate the order with user details
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    // Add formatted total for frontend
    const orderWithFormatted = {
      ...order.toObject(),
      formattedTotal: `$${order.totalAmount.toFixed(2)}`
    };

    console.log(`Order ${order._id} status updated from ${order.status} to ${status} by user ${req.user.id}`);

    res.json({
      success: true,
      data: orderWithFormatted,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update order status' 
    });
  }
});


// Update order details (admin and service providers can update notes)
router.put('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check permissions
    if (req.user.role === 'service_provider') {
      // Service providers can only update orders assigned to them and only notes
      if (order.serviceProvider && order.serviceProvider.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      // Only allow notes updates for service providers
      if (req.body.notes) {
        order.notes = { ...order.notes, ...req.body.notes };
      }
    } else if (req.user.role === 'admin') {
      // Admins can update everything
      Object.assign(order, req.body);
    } else {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

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
    console.error('Update order error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

// Self-assign order (service providers only) - PATCH method
router.put('/:id/assign-self', protect, serviceProvider, async (req, res) => {
  try {
    console.log(`Service provider ${req.user.id} attempting to assign order ${req.params.id}`);
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log(`Order ${req.params.id} not found`);
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    console.log(`Order status: ${order.status}, serviceProvider: ${order.serviceProvider}`);

    // Check if order is available for assignment
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ 
        success: false, 
        error: `Order is not available for assignment. Current status: ${order.status}` 
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

    // Initialize statusHistory if it doesn't exist
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: 'assigned',
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: 'Self-assigned by service provider',
    });

    await order.save();
    
    // Populate the order with user details
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    // Add formatted total for frontend
    const orderWithFormatted = {
      ...order.toObject(),
      formattedTotal: `$${order.totalAmount.toFixed(2)}`
    };

    console.log(`Order ${order._id} successfully assigned to service provider ${req.user.id}`);

    res.json({
      success: true,
      data: orderWithFormatted,
      message: 'Successfully assigned order to yourself',
    });
  } catch (error) {
    console.error('Self-assign order error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to assign order' 
    });
  }
});


// Self-assign order (service providers only) - PUT method
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

// GET /api/orders/provider/assigned - Get orders assigned to the service provider and available orders
router.get('/provider/assigned', protect, serviceProvider, async (req, res) => {
  try {
    console.log('Provider ID:', req.user.id);
    console.log('User role:', req.user.role);
    
    // Get both assigned orders and available orders for self-assignment
    const query = {
      $or: [
        { serviceProvider: req.user.id }, // Orders assigned to this provider
        { 
          serviceProvider: null, 
          status: { $in: ['pending', 'confirmed'] } 
        } // Available orders for self-assignment
      ]
    };

    console.log('Query:', JSON.stringify(query, null, 2));

    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName email phoneNumber')
      .populate('serviceProvider', 'firstName lastName email phoneNumber businessDetails')
      .sort({ createdAt: -1 });

    console.log('Found orders count:', orders.length);

    // Format orders with consistent structure
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      return {
        ...orderObj,
        formattedTotal: `$${order.totalAmount.toFixed(2)}`,
        orderNumber: orderObj.orderNumber || `ORD-${orderObj._id.toString().slice(-6).toUpperCase()}`,
        notes: orderObj.notes || { customer: '', serviceProvider: '', admin: '' }
      };
    });

    console.log('Formatted orders sample:', formattedOrders.length > 0 ? {
      id: formattedOrders[0]._id,
      status: formattedOrders[0].status,
      serviceProvider: formattedOrders[0].serviceProvider ? 'assigned' : 'unassigned',
      customer: formattedOrders[0].customer?.firstName,
      total: formattedOrders[0].formattedTotal
    } : 'No orders found');

    res.json({
      success: true,
      data: formattedOrders,
      count: formattedOrders.length
    });
  } catch (error) {
    console.error('Get assigned orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch assigned orders'
    });
  }
});

module.exports = router;
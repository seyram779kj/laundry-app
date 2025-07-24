const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect, admin, serviceProvider } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for service images
const uploadDir = path.join(__dirname, '../uploads/services');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + Date.now() + ext;
    cb(null, name);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};
const upload = multer({ storage, fileFilter });

// Get all services (with filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      providerId, 
      minPrice, 
      maxPrice,
      available 
    } = req.query;
    
    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by provider
    if (providerId) {
      query.provider = providerId;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by availability
    if (available === 'true') {
      query.isAvailable = true;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'provider', select: 'firstName lastName businessDetails location' }
      ],
      sort: { createdAt: -1 }
    };

    const services = await Service.paginate(query, options);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch services' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'firstName lastName businessDetails location');

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch service' });
  }
});

// Create new service (admin only)
router.post('/', protect, admin, upload.single('picture'), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      estimatedTime,
      requirements,
      isActive
    } = req.body;

    if (!name || !description || !category || !basePrice || !estimatedTime) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, category, basePrice, and estimatedTime are required'
      });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/services/${req.file.filename}`;
    }

    const serviceData = {
      name,
      description,
      category,
      basePrice: parseFloat(basePrice),
      estimatedTime,
      requirements,
      isActive: isActive === 'false' ? false : true,
      imageUrl,
      provider: req.user.id
    };

    const service = await Service.create(serviceData);
    await service.populate('provider', 'firstName lastName businessDetails location');

    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, error: 'Failed to create service' });
  }
});

// Update service (provider or admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && service.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('provider', 'firstName lastName businessDetails location');

    res.json({
      success: true,
      data: updatedService
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, error: 'Failed to update service' });
  }
});

// Delete service (provider or admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && service.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete service' });
  }
});

// Toggle service availability
router.put('/:id/availability', protect, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && service.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    service.isAvailable = isAvailable;
    await service.save();
    await service.populate('provider', 'firstName lastName businessDetails location');

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Toggle service availability error:', error);
    res.status(500).json({ success: false, error: 'Failed to update service availability' });
  }
});

// Get service categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// Get services by provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'provider', select: 'firstName lastName businessDetails location' }
      ],
      sort: { createdAt: -1 }
    };

    const services = await Service.paginate(
      { provider: req.params.providerId },
      options
    );

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Get provider services error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch provider services' });
  }
});

// Get service statistics
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

    // Filter by provider if not admin
    if (req.user.role === 'service_provider') {
      query.provider = req.user.id;
    }

    const stats = await Service.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    const totalServices = await Service.countDocuments(query);
    const availableServices = await Service.countDocuments({ ...query, isAvailable: true });

    res.json({
      success: true,
      data: {
        categoryBreakdown: stats,
        totalServices,
        availableServices,
        unavailableServices: totalServices - availableServices
      }
    });
  } catch (error) {
    console.error('Get service stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch service statistics' });
  }
});

module.exports = router; 
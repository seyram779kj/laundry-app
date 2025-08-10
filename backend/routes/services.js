const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const User = require('../models/User'); // Add this import
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

// Get all services (with filtering and manual pagination)
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
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }

    // Filter by availability
    if (available === 'true') {
      query.isAvailable = true;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination info
    const totalDocs = await Service.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Get services with pagination
    const services = await Service.find(query)
      .populate('provider', 'firstName lastName businessDetails location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Format response to match mongoose-paginate-v2 structure
    const result = {
      docs: services,
      totalDocs,
      limit: limitNum,
      totalPages,
      page: pageNum,
      pagingCounter: skip + 1,
      hasPrevPage,
      hasNextPage,
      prevPage: hasPrevPage ? pageNum - 1 : null,
      nextPage: hasNextPage ? pageNum + 1 : null
    };

    res.json({
      success: true,
      data: result
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

// Create new service - FIXED VERSION
router.post('/', protect, upload.single('picture'), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      estimatedTime,
      requirements,
      isActive,
      providerId // Add this field for admin to specify provider
    } = req.body;

    if (!name || !description || !category || !basePrice || !estimatedTime) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, category, basePrice, and estimatedTime are required'
      });
    }

    let actualProviderId;

    // Determine provider based on user role
    if (req.user.role === 'admin') {
      // Admin must specify which provider this service belongs to
      if (!providerId) {
        return res.status(400).json({
          success: false,
          error: 'Admin must specify providerId when creating services'
        });
      }

      // Verify the provider exists and is a service provider
      const provider = await User.findById(providerId);
      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider not found'
        });
      }

      if (provider.role !== 'service_provider') {
        return res.status(400).json({
          success: false,
          error: 'Specified user is not a service provider'
        });
      }

      actualProviderId = providerId;

    } else if (req.user.role === 'service_provider') {
      // Service providers can only create services for themselves
      actualProviderId = req.user.id;

    } else {
      return res.status(403).json({
        success: false,
        error: 'Only admins and service providers can create services'
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
      provider: actualProviderId // Use the validated provider ID
    };

    const service = await Service.create(serviceData);
    await service.populate('provider', 'firstName lastName businessDetails location');

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, error: 'Failed to create service' });
  }
});

// Get all service providers (for admin dropdown)
router.get('/providers/list', protect, admin, async (req, res) => {
  try {
    const providers = await User.find(
      { role: 'service_provider' },
      'firstName lastName businessDetails location email'
    ).sort({ firstName: 1 });

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch providers' });
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

// Get services by provider (with manual pagination)
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = { provider: req.params.providerId };

    // Get total count for pagination info
    const totalDocs = await Service.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Get services with pagination
    const services = await Service.find(query)
      .populate('provider', 'firstName lastName businessDetails location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Format response to match mongoose-paginate-v2 structure
    const result = {
      docs: services,
      totalDocs,
      limit: limitNum,
      totalPages,
      page: pageNum,
      pagingCounter: skip + 1,
      hasPrevPage,
      hasNextPage,
      prevPage: hasPrevPage ? pageNum - 1 : null,
      nextPage: hasNextPage ? pageNum + 1 : null
    };

    res.json({
      success: true,
      data: result
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
          totalRevenue: { $sum: '$basePrice' },
          avgPrice: { $avg: '$basePrice' }
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

// Clean up corrupted services (run once to fix existing data)
router.post('/admin/cleanup', protect, admin, async (req, res) => {
  try {
    console.log('Starting service cleanup...');
    
    // Find all admin user IDs
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIds = adminUsers.map(user => user._id.toString());
    
    // Find services that have admin users as providers
    const corruptedServices = await Service.find({ 
      provider: { $in: adminIds } 
    });
    
    console.log(`Found ${corruptedServices.length} corrupted services`);
    
    // Delete corrupted services
    const deleteResult = await Service.deleteMany({ 
      provider: { $in: adminIds } 
    });
    
    res.json({
      success: true,
      message: `Cleaned up ${deleteResult.deletedCount} corrupted services`,
      data: {
        corruptedServicesFound: corruptedServices.length,
        servicesDeleted: deleteResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ success: false, error: 'Failed to cleanup services' });
  }
});

module.exports = router;
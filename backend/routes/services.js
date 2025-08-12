const express = require('express');
const router = express.Router();
const { STATIC_SERVICES } = require('../config/staticServices');
const { protect, admin } = require('../middleware/auth');

// Get all services (static)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      minPrice, 
      maxPrice,
      available 
    } = req.query;

    let services = [...STATIC_SERVICES];

    // Filter by category
    if (category) {
      services = services.filter(service => service.category === category);
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      services = services.filter(service => {
        if (minPrice && service.basePrice < parseFloat(minPrice)) return false;
        if (maxPrice && service.basePrice > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // Filter by availability
    if (available === 'true') {
      services = services.filter(service => service.isAvailable);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Manual pagination
    const totalDocs = services.length;
    const totalPages = Math.ceil(totalDocs / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    const paginatedServices = services.slice(skip, skip + limitNum);

    // Format response to match previous structure
    const result = {
      docs: paginatedServices,
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
    const service = STATIC_SERVICES.find(s => s._id === req.params.id);

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

// Get service categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [...new Set(STATIC_SERVICES.map(service => service.category))];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// Get service statistics
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const stats = STATIC_SERVICES.reduce((acc, service) => {
      const category = service.category;
      if (!acc[category]) {
        acc[category] = {
          _id: category,
          count: 0,
          totalRevenue: 0,
          avgPrice: 0
        };
      }
      acc[category].count += 1;
      acc[category].totalRevenue += service.basePrice;
      return acc;
    }, {});

    // Calculate average prices
    Object.values(stats).forEach(stat => {
      stat.avgPrice = stat.totalRevenue / stat.count;
    });

    const totalServices = STATIC_SERVICES.length;
    const availableServices = STATIC_SERVICES.filter(s => s.isAvailable).length;

    res.json({
      success: true,
      data: {
        categoryBreakdown: Object.values(stats),
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
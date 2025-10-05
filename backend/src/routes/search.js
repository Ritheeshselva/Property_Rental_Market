const express = require('express');
const Property = require('../models/Property');
const PropertySearch = require('../models/PropertySearch');

const router = express.Router();

// Enhanced property search - this route is used by the frontend's SearchAPI.searchProperties()
router.get('/properties', async (req, res) => {
  try {
    const {
      location,
      minPrice,
      maxPrice,
      propertyType,
      rooms,
      amenities,
      facing,
      hasSubscription,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = { status: 'approved' };
    
    if (location) {
      filter.$or = [
        { address: { $regex: location, $options: 'i' } },
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.area': { $regex: location, $options: 'i' } },
        { area: { $regex: location, $options: 'i' } } // Added area field for direct matching
      ];
    }

    if (minPrice || maxPrice) {
      filter.pricePerMonth = {};
      if (minPrice) filter.pricePerMonth.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerMonth.$lte = Number(maxPrice);
    }

    if (propertyType) {
      filter.propertyType = propertyType;
    }

    if (rooms) {
      filter.rooms = { $gte: Number(rooms) };
    }

    if (amenities && amenities.length > 0) {
      const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
      filter.amenities = { $all: amenityArray };
    }

    if (facing) {
      filter.facing = facing;
    }

    if (hasSubscription !== undefined) {
      filter.hasSubscription = hasSubscription === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute search
    const properties = await Property.find(filter)
      .populate('owner', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await Property.countDocuments(filter);

    // Log search for analytics
    if (req.user) {
      try {
        await PropertySearch.create({
          user: req.user.id,
          searchQuery: {
            location,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            propertyType,
            rooms: rooms ? Number(rooms) : undefined,
            amenities: amenities ? (Array.isArray(amenities) ? amenities : [amenities]) : undefined,
            facing
          },
          resultsCount: properties.length,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (e) {
        // Don't fail the search if logging fails
        console.error('Failed to log search:', e.message);
      }
    }

    res.json({
      properties,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        hasNext: skip + properties.length < totalCount,
        hasPrev: Number(page) > 1
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Get location suggestions
    const locations = await Property.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: {
            city: '$location.city',
            state: '$location.state'
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          $or: [
            { '_id.city': { $regex: q, $options: 'i' } },
            { '_id.state': { $regex: q, $options: 'i' } }
          ]
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const suggestions = locations.map(loc => ({
      type: 'location',
      value: `${loc._id.city}, ${loc._id.state}`,
      count: loc.count
    }));

    res.json({ suggestions });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get popular searches
router.get('/popular', async (req, res) => {
  try {
    const popularSearches = await PropertySearch.aggregate([
      {
        $group: {
          _id: {
            location: '$searchQuery.location',
            propertyType: '$searchQuery.propertyType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({ popularSearches });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get search filters
router.get('/filters', async (req, res) => {
  try {
    const filters = await Property.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          propertyTypes: { $addToSet: '$propertyType' },
          facings: { $addToSet: '$facing' },
          amenities: { $addToSet: '$amenities' },
          minPrice: { $min: '$pricePerMonth' },
          maxPrice: { $max: '$pricePerMonth' },
          minRooms: { $min: '$rooms' },
          maxRooms: { $max: '$rooms' }
        }
      }
    ]);

    const result = filters[0] || {};
    
    // Flatten amenities array
    const allAmenities = [];
    if (result.amenities) {
      result.amenities.forEach(amenityArray => {
        if (Array.isArray(amenityArray)) {
          allAmenities.push(...amenityArray);
        }
      });
    }

    res.json({
      propertyTypes: result.propertyTypes || [],
      facings: result.facings || [],
      amenities: [...new Set(allAmenities)],
      priceRange: {
        min: result.minPrice || 0,
        max: result.maxPrice || 0
      },
      roomRange: {
        min: result.minRooms || 1,
        max: result.maxRooms || 1
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get nearby properties
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10, limit = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const properties = await Property.find({
      status: 'approved',
      'location.coordinates.lat': {
        $gte: Number(lat) - (Number(radius) / 111), // Rough conversion: 1 degree ≈ 111 km
        $lte: Number(lat) + (Number(radius) / 111)
      },
      'location.coordinates.lng': {
        $gte: Number(lng) - (Number(radius) / 111),
        $lte: Number(lng) + (Number(radius) / 111)
      }
    })
    .populate('owner', 'name email phone')
    .limit(Number(limit));

    res.json(properties);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

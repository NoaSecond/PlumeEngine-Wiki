const express = require('express');
const { requireAuth, requireAdmin, optionalAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get all activities (user-specific or public for guests)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const db = req.db;
    const userId = req.user ? req.user.userId : null;

    let activities;
    if (userId) {
      activities = await db.activities.getActivitiesByUser(userId, parseInt(limit), offset);
    } else {
      // Public activities for guests
      activities = (await db.activities.getAllActivities(parseInt(limit), offset)).filter(a => a.type !== 'admin');
    }

    // Parse JSON metadata
    const parsedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json({
      success: true,
      activities: parsedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: activities.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error retrieving activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get today's activities
router.get('/today', requireAuth, async (req, res) => {
  try {
    const db = req.db;
    const activities = await db.activities.getTodayActivitiesByUser(req.user.userId);

    // Parse JSON metadata
    const parsedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json({
      success: true,
      activities: parsedActivities
    });

  } catch (error) {
    console.error('Error retrieving today\'s activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search activities
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q: searchTerm, limit = 50 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term required'
      });
    }

    const db = req.db;
    const activities = await db.activities.searchActivities(req.user.userId, searchTerm, parseInt(limit));

    // Parse JSON metadata
    const parsedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json({
      success: true,
      activities: parsedActivities,
      searchTerm
    });

  } catch (error) {
    console.error('Error searching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create a new activity
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, title, description, icon, metadata } = req.body;

    // Data validation
    if (!type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Type and title required'
      });
    }

    const db = req.db;

    const activityId = await db.activities.createActivity({
      userId: req.user.userId,
      type,
      title,
      description: description || '',
      icon: icon || 'star',
      metadata: metadata || {}
    });

    // Retrieve the created activity to return it
    const newActivity = await db.activities.getActivitiesByUser(req.user.userId, 1, 0);
    const activity = newActivity[0];

    // Parse JSON metadata
    const parsedActivity = {
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    };

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity: parsedActivity
    });

  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin route: get all activities from all users
router.get('/admin/all', requireAuth, requirePermission('view_activity_admin'), async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const db = req.db;
    const activities = await db.activities.getAllActivities(parseInt(limit), offset);

    // Parse JSON metadata
    const parsedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json({
      success: true,
      activities: parsedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: activities.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error retrieving activities (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

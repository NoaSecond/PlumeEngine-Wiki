const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, requirePermission } = require('../middleware/auth');

const SYSTEM_TAGS = ['Administrateur', 'Contributeur', 'Visiteur', 'Utilisateur non connecté', 'Unauthenticated User'];

// Public route: list all tags (accessible to all authenticated users)
router.get('/public', requireAuth, async (req, res) => {
  try {
    const tags = await req.db.tags.getAllTags();

    res.json({
      success: true,
      tags: tags
    });

  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin route: list all tags
router.get('/', requireAuth, requirePermission('tag_management'), async (req, res) => {
  try {
    const tags = await req.db.tags.getAllTags();

    res.json({
      success: true,
      tags: tags
    });

  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin route: create a new tag
router.post('/', requireAuth, requirePermission('tag_management'), async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({
        success: false,
        message: 'Tag name and color are required'
      });
    }

    const tagId = await req.db.tags.createTag(name, color);

    // Log the activity
    await req.db.activities.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'Tag created',
      description: `Tag "${name}" created by ${req.user.username}`,
      icon: 'tag'
    });

    res.json({
      success: true,
      message: 'Tag created successfully',
      tagId: tagId
    });

  } catch (error) {
    console.error('Error creating tag:', error);

    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'A tag with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin route: update a tag
router.put('/:id', requireAuth, requirePermission('tag_management'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({
        success: false,
        message: 'Tag name and color are required'
      });
    }

    // Check that the tag exists
    const existingTag = await req.db.tags.getTagById(parseInt(id));
    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Prevent modification of system tags
    if (SYSTEM_TAGS.includes(existingTag.name)) {
      if (existingTag.name !== name) {
        return res.status(403).json({
          success: false,
          message: `The "${existingTag.name}" tag is a system tag and cannot be renamed`
        });
      }
    }

    const updatedTag = await req.db.tags.updateTag(parseInt(id), name, color);

    // Log the activity
    await req.db.activities.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'Tag modified',
      description: `Tag "${name}" modified by ${req.user.username}`,
      icon: 'tag'
    });

    res.json({
      success: true,
      message: 'Tag updated successfully',
      tag: updatedTag
    });

  } catch (error) {
    console.error('Error modifying tag:', error);

    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'A tag with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin route: delete a tag
router.delete('/:id', requireAuth, requirePermission('tag_management'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check that the tag exists
    const existingTag = await req.db.tags.getTagById(parseInt(id));
    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Prevent deletion of system tags
    if (SYSTEM_TAGS.includes(existingTag.name)) {
      return res.status(403).json({
        success: false,
        message: `The "${existingTag.name}" tag is a system tag and cannot be deleted`
      });
    }

    await req.db.tags.deleteTag(parseInt(id));

    // Log the activity
    await req.db.activities.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'Tag deleted',
      description: `Tag "${existingTag.name}" deleted by ${req.user.username}`,
      icon: 'tag'
    });

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

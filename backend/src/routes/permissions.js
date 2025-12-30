const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, requirePermission } = require('../middleware/auth');

// Get all permissions
router.get('/', requireAuth, async (req, res) => {
  try {
    const permissions = await req.db.permissions.getAllPermissions();
    res.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get permissions by category
router.get('/by-category', requireAuth, async (req, res) => {
  try {
    // We can fetch all and group them here or use a specific repo method.
    // Let's use getAllPermissions and group in JS to keep repo simple.
    const permissions = await req.db.permissions.getAllPermissions();

    // Group by category
    const permissionsByCategory = {};
    permissions.forEach(permission => {
      if (!permissionsByCategory[permission.category]) {
        permissionsByCategory[permission.category] = [];
      }
      permissionsByCategory[permission.category].push(permission);
    });

    res.json({ permissionsByCategory });
  } catch (error) {
    console.error('Error fetching permissions by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tag permissions (which permissions each tag has)
router.get('/tags', requireAuth, async (req, res) => {
  try {
    const tagPermissions = await req.db.tags.getAllTagsWithPermissions();
    res.json({ tagPermissions });
  } catch (error) {
    console.error('Error fetching tag permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tag permissions
router.put('/tags/:tagId', requireAuth, requirePermission('permission_management'), async (req, res) => {
  try {
    const { tagId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: 'permissionIds must be an array' });
    }

    // Verify tag exists
    const tag = await req.db.tags.getTagById(tagId);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Update permissions
    await req.db.tags.updateTagPermissions(tagId, permissionIds);

    res.json({
      message: 'Tag permissions updated successfully',
      tagId: parseInt(tagId),
      permissionIds
    });
  } catch (error) {
    console.error('Error updating tag permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new permission
router.post('/', requireAuth, requirePermission('permission_management'), async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Check if permission already exists
    const existing = await req.db.permissions.getPermissionByName(name);
    if (existing) {
      return res.status(400).json({ error: 'Permission with this name already exists' });
    }

    const id = await req.db.permissions.createPermission(name, description, category);
    const newPermission = await req.db.permissions.getPermissionById(id);

    res.status(201).json({
      message: 'Permission created successfully',
      permission: newPermission
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update permission
router.put('/:id', requireAuth, requirePermission('permission_management'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Check if permission exists
    const existing = await req.db.permissions.getPermissionById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Check if name is taken by another permission
    const nameCheck = await req.db.permissions.getPermissionByNameExcludingId(name, id);
    if (nameCheck) {
      return res.status(400).json({ error: 'Permission with this name already exists' });
    }

    const updatedPermission = await req.db.permissions.updatePermission(id, name, description, category);

    res.json({
      message: 'Permission updated successfully',
      permission: updatedPermission
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete permission
router.delete('/:id', requireAuth, requirePermission('permission_management'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permission exists
    const existing = await req.db.permissions.getPermissionById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    await req.db.permissions.deletePermission(id);

    res.json({
      message: 'Permission deleted successfully',
      deletedPermission: existing
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

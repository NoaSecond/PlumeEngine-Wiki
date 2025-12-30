const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { requireAuth, requireAdmin, requirePermission, JWT_SECRET } = require('../middleware/auth');

// Get guest permissions (for unauthenticated users)
router.get('/guest-permissions', async (req, res) => {
  try {
    const permissions = await req.db.tags.getGuestPermissions();
    const permissionNames = permissions.map(p => p.name);

    res.json({
      success: true,
      permissions: permissionNames
    });
  } catch (error) {
    console.error('Error fetching guest permissions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth API works!' });
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }

    // Find user in database
    const user = await req.db.users.findUserByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await req.db.users.updateLastLogin(user.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        isAdmin: user.is_admin
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get user permissions
    const permissions = await req.db.tags.getUserPermissions(user.id);
    const permissionNames = permissions.map(p => p.name);

    // Prepare user data (without password hash)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      avatar: user.avatar,
      lastLogin: new Date().toISOString(),
      tags: user.is_admin ? ['Administrator'] : ['Contributor'],
      permissions: permissionNames
    };

    // Log login activity
    await req.db.activities.createActivity({
      userId: user.id,
      type: 'auth',
      title: 'Successful login',
      description: `Login by ${user.username}`,
      icon: 'shield'
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Registration route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await req.db.users.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken'
      });
    }

    const existingEmail = await req.db.users.findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'This email is already in use'
      });
    }

    // Create new user
    const userId = await req.db.users.createUser({
      username,
      email,
      password,
      isAdmin: false,
      avatar: 'avatar-openbookwiki.svg',
      tags: 'Contributeur'
    });

    // Get created user
    const newUser = await req.db.users.findUserById(userId);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        username: newUser.username,
        isAdmin: newUser.is_admin
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user data
    const userData = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.is_admin,
      avatar: newUser.avatar,
      lastLogin: new Date().toISOString(),
      tags: newUser.is_admin ? ['Administrator'] : ['Contributor']
    };

    // Log registration activity
    await req.db.activities.createActivity({
      userId: newUser.id,
      type: 'auth',
      title: 'Registration successful',
      description: `New user: ${newUser.username}`,
      icon: 'user'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Token verification route (current user)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await req.db.users.findUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Parse tags from database (stored as comma-separated string)
    let userTags = [];
    try {
      if (user.tags) {
        // If it's a string, split by commas
        if (typeof user.tags === 'string') {
          userTags = user.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else {
          // If it's already an array (shouldn't happen)
          userTags = Array.isArray(user.tags) ? user.tags : [];
        }
      } else {
        // Default tags based on role
        userTags = user.is_admin ? ['Administrator'] : ['Contributor'];
      }
    } catch (error) {
      console.error('Error parsing tags:', error);
      userTags = user.is_admin ? ['Administrator'] : ['Contributor'];
    }

    // Get user permissions
    const permissions = await req.db.tags.getUserPermissions(user.id);
    const permissionNames = permissions.map(p => p.name);

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      avatar: user.avatar,
      bio: user.bio,
      lastLogin: user.last_login,
      tags: userTags,
      permissions: permissionNames,
      contributions: user.contributions || 0,
      joinDate: user.created_at
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Token verification route (alias for /me)
router.get('/verify', requireAuth, async (req, res) => {
  try {
    const user = await req.db.users.findUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Parse tags from database (stored as comma-separated string)
    let userTags = [];
    try {
      if (user.tags) {
        // If it's a string, split by commas
        if (typeof user.tags === 'string') {
          userTags = user.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(user.tags)) {
          userTags = user.tags;
        }
      }
    } catch (tagError) {
      console.warn('Error parsing tags:', tagError);
      userTags = [];
    }

    // Get user permissions
    const permissions = await req.db.tags.getUserPermissions(user.id);
    const permissionNames = permissions.map(p => p.name);

    // Create user object with all properties
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: !!user.is_admin, // Convert to boolean
      avatar: user.avatar || 'avatar-openbookwiki.svg',
      lastLogin: user.last_login,
      tags: userTags,
      permissions: permissionNames,
      bio: user.bio || '',
      contributions: user.contributions || 0,
      joinDate: user.created_at
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User profile update route
router.put('/profile', requireAuth, requirePermission('edit_own_profile'), async (req, res) => {
  try {
    const { avatar, username, email } = req.body;

    // Data validation
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;

    // Check for change_avatar permission if avatar is being updated
    if (avatar) {
      const permissions = await req.db.tags.getUserPermissions(req.user.userId);
      const hasAvatarPermission = permissions.some(p => p.name === 'change_avatar');

      if (!req.user.isAdmin && !hasAvatarPermission) {
        return res.status(403).json({
          success: false,
          message: "Permission 'change_avatar' required"
        });
      }
      updates.avatar = avatar;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data to update'
      });
    }

    // Update profile
    const updatedUser = await req.db.users.updateUserProfile(req.user.userId, updates);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user permissions
    const permissions = await req.db.tags.getUserPermissions(updatedUser.id);
    const permissionNames = permissions.map(p => p.name);

    // Prepare user data (without password hash)
    const userData = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.is_admin,
      avatar: updatedUser.avatar,
      lastLogin: updatedUser.last_login,
      tags: updatedUser.tags ? updatedUser.tags.split(',').filter(tag => tag.trim()) : [],
      permissions: permissionNames,
      bio: updatedUser.bio || '',
      contributions: updatedUser.contributions || 0,
      joinDate: updatedUser.created_at
    };

    // Log update activity
    await req.db.activities.createActivity({
      userId: updatedUser.id,
      type: 'auth',
      title: 'Profile updated',
      description: `Profile update for ${updatedUser.username}`,
      icon: 'user'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout route
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Log logout activity
    await req.db.activities.createActivity({
      userId: req.user.userId,
      type: 'auth',
      title: 'Logout',
      description: `Logout by ${req.user.username}`,
      icon: 'shield'
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin route: list all users
router.get('/users', requireAuth, requirePermission('user_management'), async (req, res) => {
  try {
    const users = await req.db.users.getAllUsers();

    const userData = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      avatar: user.avatar,
      bio: user.bio,
      tags: user.tags ? user.tags.split(',').filter(tag => tag.trim()) : [],
      contributions: 0, // TODO: calculate real contributions
      lastLogin: user.last_login,
      created_at: user.created_at
    }));

    res.json({
      success: true,
      users: userData
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin route: create a new user
router.post('/users', requireAuth, requirePermission('user_management'), async (req, res) => {
  try {
    const { username, email, password, isAdmin, tags, bio, avatar } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await req.db.users.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken'
      });
    }

    const existingEmail = await req.db.users.findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'This email is already in use'
      });
    }

    const userId = await req.db.users.createUser({
      username,
      email,
      password,
      isAdmin: !!isAdmin,
      avatar: avatar || 'avatar-openbookwiki.svg',
      bio: bio || '',
      tags: Array.isArray(tags) ? tags.join(',') : (tags || '')
    });

    const newUser = await req.db.users.findUserById(userId);

    // Log activity
    await req.db.activities.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'User created',
      description: `User ${username} created by ${req.user.username}`,
      icon: 'user-plus'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.is_admin,
        avatar: newUser.avatar,
        tags: newUser.tags ? newUser.tags.split(',') : []
      }
    });

  } catch (error) {
    console.error('Error creating user by admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin route: update specific user
router.put('/users/:id', requireAuth, requirePermission('user_management'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, bio, tags, avatar } = req.body;

    // Data validation
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;
    if (tags) updates.tags = Array.isArray(tags) ? tags.join(',') : tags;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data to update'
      });
    }

    // Check if user exists
    const existingUser = await req.db.users.getUserById(parseInt(id));
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile
    const updatedUser = await req.db.users.updateUserProfile(parseInt(id), updates);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Error updating'
      });
    }

    // Prepare user data
    const userData = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.is_admin,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      tags: updatedUser.tags ? updatedUser.tags.split(',') : [],
      lastLogin: updatedUser.last_login,
      created_at: updatedUser.created_at
    };

    // Log update activity
    await req.db.activities.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'User profile modified',
      description: `User profile ${updatedUser.username} modified by ${req.user.username}`,
      icon: 'user'
    });

    res.json({
      success: true,
      message: 'User profile updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// Admin route: delete user
router.delete('/users/:id', requireAuth, requirePermission('user_management'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await req.db.users.getUserById(parseInt(id));
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting self
    if (existingUser.id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Delete user
    await req.db.users.deleteUser(parseInt(id));

    // Log activity
    await req.db.activities.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'User deleted',
      description: `User ${existingUser.username} deleted by ${req.user.username}`,
      icon: 'trash'
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

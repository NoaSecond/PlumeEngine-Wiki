const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null; // Invalid token but continue as guest
    } else {
      req.user = user;
    }
    next();
  });
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Administrator access required'
    });
  }
  next();
};

const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      // If admin, they have all permissions
      if (req.user.isAdmin) {
        return next();
      }

      const permissions = await req.db.tags.getUserPermissions(req.user.userId);
      const hasPermission = permissions.some(p => p.name === permissionName);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission '${permissionName}' required`
        });
      }

      next();
    } catch (error) {
      console.error('Error checking permission:', error);
      res.status(500).json({ success: false, message: 'Internal server error while checking permissions' });
    }
  };
};

module.exports = {
  requireAuth,
  optionalAuth,
  generateToken,
  requireAdmin,
  requirePermission,
  JWT_SECRET
};

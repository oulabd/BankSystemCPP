/**
 * This middleware checks if a user has one of the allowed roles.
 * Admin is always allowed.
 */

function roleMiddleware(requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRole = req.user.role;

    // Admin always allowed to access anything
    if (userRole === 'admin') {
      return next();
    }

    // If multiple roles allowed
    if (Array.isArray(requiredRoles)) {
      if (requiredRoles.includes(userRole)) {
        return next();
      }
    }
    // If only one role allowed
    else {
      if (userRole === requiredRoles) {
        return next();
      }
    }

    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  };
}

/**
 * More compact helper:
 * permit('doctor', 'patient')
 */
function permit(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (allowedRoles.includes(req.user.role) || req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  };
}

module.exports = { roleMiddleware, permit };

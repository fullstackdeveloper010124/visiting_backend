import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route. Please login first.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretprintflowtoken');

    // Find the user associated with this token
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: 'The user belonging to this token no longer exists.',
      });
    }

    if (currentUser.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `Your account is currently ${currentUser.status}. Please contact an administrator.`,
      });
    }

    // Grant access to the protected route and assign user to req
    req.user = currentUser;
    next();
  } catch (error) {
    console.error(`Auth Middleware Error: ${error.message}`);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Invalid token.',
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

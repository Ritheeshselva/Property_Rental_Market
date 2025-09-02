const jwt = require('jsonwebtoken');

module.exports = function authenticate(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    console.log('🔐 Auth middleware - Headers:', req.headers);
    console.log('🔐 Auth middleware - Authorization header:', authHeader);
    
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    console.log('🔐 Auth middleware - Extracted token:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      console.log('❌ Auth middleware - No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretchangeme');
      console.log('✅ Auth middleware - Token verified:', decoded);
      req.user = decoded;
      if (requiredRole && decoded.role !== requiredRole) {
        console.log('❌ Auth middleware - Role mismatch. Required:', requiredRole, 'User role:', decoded.role);
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    } catch (err) {
      console.log('❌ Auth middleware - Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
};



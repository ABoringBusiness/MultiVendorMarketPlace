// src/middlewares/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Expect the token in the Authorization header in the format "Bearer <token>"
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // attach the decoded token (which includes user id and role) to the request
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register user and set token as HTTP-only cookie
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({ name, email, password });
  if (user) {
    res.status(201)
      .cookie('token', generateToken(user._id), { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })
      .json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// Authenticate user and set token as HTTP-only cookie
//http://localhost:5000/api/users/login
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    let token=generateToken(user._id)
    res.cookie('token', token, { 
        // httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })
      .json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token:token
      });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// Logout user by clearing the cookie
const logoutUser = (req, res) => {
  res.cookie('token', '', { 
    httpOnly: true, 
    expires: new Date(0),
  }).json({ message: 'Logged out successfully' });
};
// In userController.js

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password'); // Exclude password from the response
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
  });
};

module.exports = { registerUser, authUser, logoutUser, getProfile }; // Ensure getProfile is exported

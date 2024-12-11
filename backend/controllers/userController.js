const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

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
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data including the profile image
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage, // This should be the filename
      createdAt: user.createdAt,
      eventsCreated: user.eventsCreated || [],
      eventsAttended: user.eventsAttended || []
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Error getting user profile' });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Save the file path to the user's profile
    user.profileImage = req.file.filename;  // Save just the filename
    await user.save();

    res.json({ 
      message: 'Profile image uploaded successfully',
      imageUrl: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Error uploading profile image' });
  }
};

module.exports = { registerUser, authUser, logoutUser, getProfile, uploadProfileImage }; // Ensure getProfile is exported

const jwt = require("jsonwebtoken");
const { User } = require("../models");
require("dotenv").config();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc Register user
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({ name, email, password, role });

    res.status(201).json({ message: "User registered successfully", token: generateToken(user) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ message: "Login successful", token: generateToken(user) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc Logout user (invalidate token client-side)
// @route POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    // There's no real way to invalidate a JWT without a token blacklist mechanism
    res.json({ message: "Logout successful, remove token on client-side" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc Get user profile
// @route GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ["password"] } });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc Update user profile
// @route PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

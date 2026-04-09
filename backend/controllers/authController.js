const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ADMIN_EMAIL, getRankForRole, isAdmin, isUserOnline } = require("../utils/access");

const buildAuthUserPayload = (user) => {
  const payload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    founderTitle: user.founderTitle,
    jobTitle: user.jobTitle,
    availabilityStatus: user.availabilityStatus,
    statusMessage: user.statusMessage,
    isOnline: isUserOnline(user),
    permissions: user.permissions,
    groups: user.groups || [],
    profileImageUrl: user.profileImageUrl,
  };

  if (isAdmin(user)) {
    payload.rank = 1;
  }

  return payload;
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, profileImageUrl, role: requestedRole, founderTitle, jobTitle } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail?.endsWith("@octasence.com")) {
      return res.status(400).json({ message: "Only @octasence.com email addresses are allowed" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let role = "employee";
    if (normalizedEmail === ADMIN_EMAIL) {
      role = "admin";
    } else if (requestedRole === "founder") {
      role = "founder";
    }

    if (role === "founder" && !founderTitle?.trim()) {
      return res.status(400).json({ message: "Founder title is required for founder accounts" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      profileImageUrl,
      role,
      rank: normalizedEmail === ADMIN_EMAIL ? 1 : getRankForRole(role),
      founderTitle: role === "founder" ? founderTitle.trim() : null,
      jobTitle: jobTitle?.trim() || null,
      availabilityStatus: "available",
      statusMessage: "",
    });

    // Return user data with JWT
    res.status(201).json({
      ...buildAuthUserPayload(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail?.endsWith("@octasence.com")) {
      return res.status(400).json({ message: "Only @octasence.com email addresses are allowed" });
    }

    const user = await User.findOne({ email: normalizedEmail }).populate("groups", "name description");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      ...buildAuthUserPayload(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Request admin password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (user) {
      user.passwordResetRequest = {
        status: "pending",
        requestedAt: new Date(),
        completedAt: null,
        completedBy: null,
      };
      await user.save();
    }

    res.status(200).json({
      message: "If this email exists, your reset request has been sent to the admin console.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("groups", "name description");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const profile = user.toObject();
    if (!isAdmin(user)) {
      delete profile.rank;
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updatePresenceHeartbeat = async (req, res) => {
  try {
    req.user.lastSeenAt = new Date();
    await req.user.save();
    res.status(200).json({ success: true, lastSeenAt: req.user.lastSeenAt });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateAvailabilityStatus = async (req, res) => {
  try {
    const { availabilityStatus, statusMessage } = req.body;
    const allowedStatuses = ["available", "away", "on_leave"];
    if (!allowedStatuses.includes(availabilityStatus)) {
      return res.status(400).json({ message: "Invalid availability status" });
    }

    req.user.availabilityStatus = availabilityStatus;
    req.user.statusMessage = (statusMessage || "").trim().slice(0, 120);
    req.user.lastSeenAt = new Date();
    const updatedUser = await req.user.save();

    res.status(200).json({
      availabilityStatus: updatedUser.availabilityStatus,
      statusMessage: updatedUser.statusMessage,
      lastSeenAt: updatedUser.lastSeenAt,
      isOnline: isUserOnline(updatedUser),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.profileImageUrl = req.body.profileImageUrl || user.profileImageUrl;
    if (req.body.availabilityStatus) {
      user.availabilityStatus = req.body.availabilityStatus;
    }
    if (req.body.statusMessage !== undefined) {
      user.statusMessage = req.body.statusMessage;
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      ...buildAuthUserPayload(updatedUser),
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  getUserProfile,
  updatePresenceHeartbeat,
  updateAvailabilityStatus,
  updateUserProfile,
};

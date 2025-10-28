// authRoutes.js

const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware"); // if you have a file upload middleware

const router = express.Router();

// =======================
// 🔐 Auth Routes
// =======================

// Register a new user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get user profile (requires authentication)
router.get("/profile", protect, getUserProfile);

// Update user profile (requires authentication)
router.put("/profile", protect, updateUserProfile);

// =======================
// 🖼️ Upload image route
// =======================
router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

module.exports = router;

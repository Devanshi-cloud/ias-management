const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { getUsers, getUserById, updateUser } = require("../controllers/userController");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// User Management Routes
// Get all users (Admin only)
router.get("/", protect, adminOnly, getUsers);

// Get a specific user
router.get("/:id", protect, getUserById);

// Update a user's profile
router.put("/:id", protect, upload.single("profileImage"), updateUser);

module.exports = router;

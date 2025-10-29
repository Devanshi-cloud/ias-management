const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { getUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// User Management Routes
// Get all users (Admin only)
router.get("/", protect, adminOnly, getUsers);

// Get a specific user
router.get("/:id", protect, getUserById);

// Update a user's profile
router.put("/:id", protect, upload.single("profileImage"), updateUser);


// Delete a user
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;

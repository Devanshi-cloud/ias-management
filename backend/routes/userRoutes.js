const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { getUsers, getUserById } = require("../controllers/userController");

const router = express.Router();

// User Management Routes
// Get all users (Admin only)
router.get("/", protect, adminOnly, getUsers);

// Get a specific user
router.get("/:id", protect, getUserById);

module.exports = router;

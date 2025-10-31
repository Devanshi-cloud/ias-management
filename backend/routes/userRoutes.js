const express = require("express");
const { protect, adminOnly, authorize } = require("../middlewares/authMiddleware");
const { getUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// User Management Routes
// Get all users (Admin, VP, Head)
router.get("/", protect, authorize(['admin', 'vp', 'head']), getUsers);

// Get a specific user
router.get("/:id", protect, getUserById);

// Update a user's profile
router.put("/:id", protect, authorize(['admin', 'vp', 'head', 'member']), upload.single("profileImage"), updateUser);


// Delete a user
router.delete("/:id", protect, authorize(['admin', 'vp', 'head']), deleteUser);

module.exports = router;

const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getUsers,
  getUserById,
  updateUser,
  adminResetUserPassword,
  deleteUser,
} = require("../controllers/userController");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// User Management Routes
router.get("/", protect, getUsers);

// Get a specific user
router.get("/:id", protect, getUserById);

router.put("/:id", protect, upload.single("profileImage"), updateUser);

router.put("/:id/reset-password", protect, adminResetUserPassword);

router.delete("/:id", protect, deleteUser);

module.exports = router;

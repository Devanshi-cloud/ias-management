const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getDashboardData,
  getUserDashboardData,
  getDepartmentDashboardData,
  getAssignableUsers,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
} = require("../controllers/taskController");

const router = express.Router();

// Task Management Routes
router.get("/dashboard-data", protect, getDashboardData);
router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/department-dashboard-data", protect, getDepartmentDashboardData);
router.get("/assignable-users", protect, getAssignableUsers);

router.get("/", protect, getTasks); // Get all tasks (Admin: all, User: assigned)
router.get("/:id", protect, getTaskById); // Get task by ID

router.post("/", protect, createTask);
router.put("/:id", protect, updateTask); // Update task details
router.delete("/:id", protect, deleteTask);

router.put("/:id/status", protect, updateTaskStatus); // Update task status
router.put("/:id/todo", protect, updateTaskChecklist); // Update task checklist

module.exports = router;

const Message = require("../models/Message");
const Task = require("../models/Task");

// @desc    Get all messages for a task
// @route   GET /api/messages/task/:taskId
// @access  Private (admin + assigned members)
const getTaskMessages = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const userId = req.user._id.toString();
    const userRole = req.user.role;

    const isAssigned = task.assignedTo.map((id) => id.toString()).includes(userId);

    if (userRole !== "admin" && !isAssigned) {
      // VP/Head can access messages for tasks assigned to their department members
      if (userRole === "vp" || userRole === "head") {
        const User = require("../models/User");
        const departmentMembers = await User.find({ department: req.user.department }).select("_id");
        const memberIds = departmentMembers.map((m) => m._id.toString());
        const isDepartmentTask = task.assignedTo.some((id) => memberIds.includes(id.toString()));
        if (!isDepartmentTask) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const messages = await Message.find({ taskId })
      .populate("sender", "name profileImageUrl role")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Send a message on a task
// @route   POST /api/messages/task/:taskId
// @access  Private (admin + assigned members)
const sendMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const userId = req.user._id.toString();
    const userRole = req.user.role;

    const isAssigned = task.assignedTo.map((id) => id.toString()).includes(userId);

    if (userRole !== "admin" && !isAssigned) {
      if (userRole === "vp" || userRole === "head") {
        const User = require("../models/User");
        const departmentMembers = await User.find({ department: req.user.department }).select("_id");
        const memberIds = departmentMembers.map((m) => m._id.toString());
        const isDepartmentTask = task.assignedTo.some((id) => memberIds.includes(id.toString()));
        if (!isDepartmentTask) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const message = await Message.create({
      taskId,
      sender: req.user._id,
      text: text.trim(),
    });

    const populated = await message.populate("sender", "name profileImageUrl role");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getTaskMessages, sendMessage };

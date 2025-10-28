const Task = require("../models/Task");

// @desc    Get all tasks (Admin: all, User: only assigned tasks)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
      const { status } = req.query;
      let filter = {};
  
      if (status) {
        filter.status = status;
      }
  
      let tasks;
      if (req.user.role === "admin") {
        // Admin: get all tasks
        tasks = await Task.find(filter).populate("assignedTo", "name email profileImageUrl");
      } else {
        // User: get only assigned tasks
        tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate(
          "assignedTo",
          "name email profileImageUrl"
        );
      }
  
      // Add completed checklist count to each task
      tasks = await Promise.all(
        tasks.map(async (task) => {
          const completedCount = task.todoChecklist.filter((item) => item.completed).length;
          return { ...task._doc, completedTodoCount: completedCount };
        })
      );
  
      // --- Status summary counts ---
      const baseFilter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
  
      const allTasks = await Task.countDocuments(baseFilter);
  
      const pendingTasks = await Task.countDocuments({
        ...baseFilter,
        status: "Pending",
      });
  
      const inProgressTasks = await Task.countDocuments({
        ...baseFilter,
        status: "In Progress",
      });
  
      const completedTasks = await Task.countDocuments({
        ...baseFilter,
        status: "Completed",
      });
  
      res.json({
        tasks,
        statusSummary: {
          all: allTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
    try {
      const task = await Task.findById(req.params.id).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
  
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

// @desc    Create a new task (Admin only)
// @route   POST /api/tasks
// @access  Private (Admin)
const createTask = async (req, res) => {
    try {
      const {
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        attachments,
        todoChecklist,
      } = req.body;
  
      // Validate assignedTo is an array
      if (!Array.isArray(assignedTo)) {
        return res
          .status(400)
          .json({ message: "assignedTo must be an array of user IDs" });
      }
  
      // Create the new task
      const task = await Task.create({
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        createdBy: req.user._id,
        todoChecklist,
        attachments,
      });
  
      res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
  
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      // Update basic fields
      task.title = req.body.title || task.title;
      task.description = req.body.description || task.description;
      task.priority = req.body.priority || task.priority;
      task.dueDate = req.body.dueDate || task.dueDate;
      task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
      task.attachments = req.body.attachments || task.attachments;
  
      // Update assignedTo if provided
      if (req.body.assignedTo) {
        if (!Array.isArray(req.body.assignedTo)) {
          return res
            .status(400)
            .json({ message: "assignedTo must be an array of user IDs" });
        }
        task.assignedTo = req.body.assignedTo;
      }
  
      const updatedTask = await task.save();
      res.json({ message: "Task updated successfully", updatedTask });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

// @desc    Delete a task (Admin only)
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
  
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      // Normalize assignedTo into an array
      const assignedArray = Array.isArray(task.assignedTo)
        ? task.assignedTo
        : [task.assignedTo];
  
      const isAssigned = assignedArray.some(
        (userId) => userId.toString() === req.user._id.toString()
      );
  
      if (!isAssigned && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
  
      task.status = req.body.status || task.status;
  
      if (task.status === "Completed") {
        task.todoChecklist.forEach((item) => (item.completed = true));
        task.progress = 100;
      }
  
      const updatedTask = await task.save();
  
      res.json({
        message: "Task status updated successfully",
        task: updatedTask,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  

// @desc    Update task checklist
// @route   PUT /api/tasks/:id/todo
// @access  Private
const updateTaskChecklist = async (req, res) => {
    try {
      const { todoChecklist } = req.body;
      const task = await Task.findById(req.params.id);
  
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      // Normalize assignedTo into an array (to avoid `.includes` errors)
      const assignedArray = Array.isArray(task.assignedTo)
        ? task.assignedTo
        : [task.assignedTo];
  
      // Check permission — only assigned users or admins can update
      const isAssigned = assignedArray.some(
        (userId) => userId.toString() === req.user._id.toString()
      );
  
      if (!isAssigned && req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Not authorized to update checklist" });
      }
  
      // Replace the checklist with the updated one
      task.todoChecklist = todoChecklist;
  
      // Auto-update progress based on checklist completion
      const completedCount = task.todoChecklist.filter(
        (item) => item.completed
      ).length;
      const totalItems = task.todoChecklist.length;
  
      // ⚠️ You forgot to assign this earlier — fix here:
      task.progress =
        totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  
      // Auto-mark status based on progress
      if (task.progress === 100) {
        task.status = "Completed";
      } else if (task.progress > 0) {
        task.status = "In Progress";
      } else {
        task.status = "Pending";
      }
  
      await task.save();
  
      // Fetch again with populated fields
      const updatedTask = await Task.findById(req.params.id).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
  
      res.json({ message: "Task checklist updated", task: updatedTask });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  };
  

// @desc    Dashboard Data (Admin only)
// @route   GET /api/tasks/dashboard-data
// @access  Private (Admin)
const getDashboardData = async (req, res) => {
    try {
      // 🔹 Fetch main counts
      const pendingTasks = await Task.countDocuments({ status: "Pending" });
      const completedTasks = await Task.countDocuments({ status: "Completed" });
      const totalTasks = await Task.countDocuments();
  
      // 🔹 Overdue tasks (not completed & past due date)
      const overdueTasks = await Task.countDocuments({
        status: { $ne: "Completed" }, //not equal to Completed
        dueDate: { $lt: new Date() }, // due date less than today //greater than or equal to(gte)
      });
  
      // ===============================
      // 🔹 TASK DISTRIBUTION BY STATUS
      // ===============================
      const taskStatuses = ["Pending", "In Progress", "Completed"];
      const taskDistributionRaw = await Task.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]); // Aggregation to group by status
  
      const taskDistribution = taskStatuses.reduce((acc, status) => {
        const formattedKey = status.replace(/\s+/g, ""); // Remove spaces g-lobal 
        acc[formattedKey] =
          taskDistributionRaw.find((item) => item._id === status)?.count || 0;
        return acc;
      }, {});
  
      taskDistribution["All"] = totalTasks; // Add total count
  
      // ===============================
      // 🔹 TASK DISTRIBUTION BY PRIORITY
      // ===============================
      const taskPriorities = ["Low", "Medium", "High"];
      const taskPriorityLevelsRaw = await Task.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]);
  
      const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
        acc[priority] =
          taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
        return acc;
      }, {});
  
      // ===============================
      // 🔹 RECENT TASKS (last 10)
      // ===============================
      const recentTasks = await Task.find()
        .sort({ createdAt: -1 }) // Most recent first
        .limit(10)
        .select("title status priority dueDate createdAt");
  
      // ===============================
      // 🔹 COMBINED RESPONSE
      // ===============================
      res.status(200).json({
        statistics: {
          totalTasks,
          pendingTasks,
          completedTasks,
          overdueTasks,
        },
        charts: {
          taskDistribution,
          taskPriorityLevels,
        },
        recentTasks,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  };
  

// @desc    Dashboard Data (User-specific)
// @route   GET /api/tasks/user-dashboard-data
// @access  Private
// Controller: Get User Dashboard Data
const getUserDashboardData = async (req, res) => {
    try {
      const userId = req.user._id; // Logged-in user's ID
  
      // === Basic Task Statistics ===
      const totalTasks = await Task.countDocuments({ assignedTo: userId });
      const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: "Pending" });
      const completedTasks = await Task.countDocuments({ assignedTo: userId, status: "Completed" });
      const overdueTasks = await Task.countDocuments({
        assignedTo: userId,
        status: { $ne: "Completed" },
        dueDate: { $lt: new Date() },
      });
  
      // === Task Distribution by Status ===
      const taskStatuses = ["Pending", "In Progress", "Completed"];
      const taskDistributionRaw = await Task.aggregate([
        { $match: { assignedTo: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
  
      const taskDistribution = taskStatuses.reduce((acc, status) => {
        const formattedKey = status.replace(/\s+/g, "");
        acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0;
        return acc;
      }, {});
      taskDistribution["All"] = totalTasks;
  
      // === Task Distribution by Priority ===
      const taskPriorities = ["Low", "Medium", "High"];
      const taskPriorityLevelsRaw = await Task.aggregate([
        { $match: { assignedTo: userId } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]);
  
      const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
        acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
        return acc;
      }, {});
  
      // === Recent Tasks ===
      const recentTasks = await Task.find({ assignedTo: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate createdAt");
  
      // === Final Response ===
      res.status(200).json({
        statistics: {
          totalTasks,
          pendingTasks,
          completedTasks,
          overdueTasks,
        },
        charts: {
          taskDistribution,
          taskPriorityLevels,
        },
        recentTasks,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
};
 
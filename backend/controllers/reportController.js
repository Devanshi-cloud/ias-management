const Task = require("../models/Task");
const User = require("../models/User");
const excelJS = require("exceljs");

// =======================================================
// @desc   Export all tasks as an Excel file
// @route  GET /api/reports/export/tasks
// @access Private (Admin)
// =======================================================
const exportTasksReport = async (req, res) => {
    try {
      const tasks = await Task.find().populate("assignedTo", "name email");
  
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Tasks Report");
  
      worksheet.columns = [
        { header: "Task ID", key: "_id", width: 25 },
        { header: "Title", key: "title", width: 30 },
        { header: "Description", key: "description", width: 50 },
        { header: "Priority", key: "priority", width: 15 },
        { header: "Status", key: "status", width: 20 },
        { header: "Due Date", key: "dueDate", width: 20 },
        { header: "Assigned To", key: "assignedTo", width: 35 },
      ];
  
      tasks.forEach((task) => {
        const assignedTo =
          Array.isArray(task.assignedTo) && task.assignedTo.length > 0
            ? task.assignedTo.map((user) => `${user.name} (${user.email})`).join(", ")
            : "Unassigned";
  
        worksheet.addRow({
          _id: task._id.toString(),
          title: task.title,
          description: task.description || "-",
          priority: task.priority || "-",
          status: task.status || "-",
          dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : "-",
          assignedTo,
        });
      });
  
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="tasks_report.xlsx"'
      );
  
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting tasks:", error);
      res.status(500).json({
        message: "Error exporting tasks",
        error: error.message,
      });
    }
  };
  
  

// =======================================================
// @desc   Export user-task report as an Excel file
// @route  GET /api/reports/export/users
// @access Private (Admin)
// =======================================================
// @access Private (Admin)
const exportUsersReport = async (req, res) => {
    try {
      // Fetch all users and their tasks
      const users = await User.find().select("name email _id").lean();
      const userTasks = await Task.find().populate("assignedTo", "name email _id");
  
      // Initialize a map to hold user task stats
      const userTaskMap = {};
  
      users.forEach((user) => {
        userTaskMap[user._id] = {
          name: user.name,
          email: user.email,
          taskCount: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          completedTasks: 0,
        };
      });
  
      // Count tasks for each user
      userTasks.forEach((task) => {
        if (task.assignedTo && Array.isArray(task.assignedTo)) {
          task.assignedTo.forEach((assignedUser) => {
            const userData = userTaskMap[assignedUser._id];
            if (userData) {
              userData.taskCount += 1;
  
              if (task.status === "Pending") {
                userData.pendingTasks += 1;
              } else if (task.status === "In Progress") {
                userData.inProgressTasks += 1;
              } else if (task.status === "Completed") {
                userData.completedTasks += 1;
              }
            }
          });
        }
      });
  
      // Create Excel workbook
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Users Report");
  
      worksheet.columns = [
        { header: "User Name", key: "name", width: 30 },
        { header: "Email", key: "email", width: 40 },
        { header: "Total Assigned Tasks", key: "taskCount", width: 20 },
        { header: "Pending Tasks", key: "pendingTasks", width: 20 },
        { header: "In Progress Tasks", key: "inProgressTasks", width: 20 },
        { header: "Completed Tasks", key: "completedTasks", width: 20 },
      ];
  
      // Add data rows
      Object.values(userTaskMap).forEach((user) => {
        worksheet.addRow(user);
      });
  
      // Set headers for download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="users_report.xlsx"'
      );
  
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting user report:", error);
      res.status(500).json({
        message: "Error exporting user report",
        error: error.message,
      });
    }
  };  

module.exports = {
  exportTasksReport,
  exportUsersReport,
};

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
const exportUsersReport = async (req, res) => {
  try {
    // Fetch users with their tasks
    const users = await User.find().select("name email").populate("tasks");

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("User-Task Report");

    worksheet.columns = [
      { header: "User Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Total Tasks", key: "totalTasks", width: 15 },
    ];

    users.forEach((user) => {
      worksheet.addRow({
        name: user.name,
        email: user.email,
        totalTasks: user.tasks?.length || 0,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=users-report.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting users:", error);
    res.status(500).json({ message: "Error exporting user report", error: error.message });
  }
};

module.exports = {
  exportTasksReport,
  exportUsersReport,
};

const Task = require("../models/Task");
const User = require("../models/User");
const Group = require("../models/Group");
const {
  getUserRank,
  canCreateAssignedTasks,
  canCreatePersonalTasks,
  canAssignFromTo,
  getVisibleUsersQuery,
  isAdmin,
} = require("../utils/access");

const getManagedGroupIds = async (user) => {
  if (!user?._id) return [];
  const groups = await Group.find({ admins: user._id }).select("_id");
  return groups.map((group) => group._id.toString());
};

const getCreatableGroupIds = async (user) => {
  if (isAdmin(user)) {
    const groups = await Group.find().select("_id");
    return groups.map((group) => group._id.toString());
  }
  return getManagedGroupIds(user);
};

const canAssignAsGroupAdmin = async (user, target) => {
  const managedGroupIds = await getManagedGroupIds(user);
  if (!managedGroupIds.length) return false;

  const targetGroupIds = Array.isArray(target?.groups)
    ? target.groups.map((group) => normalizeId(group)).filter(Boolean)
    : [];

  return targetGroupIds.some((groupId) => managedGroupIds.includes(groupId));
};

const canCreateAssignableTasksForUser = async (user) => {
  if (canCreateAssignedTasks(user)) return true;
  const managedGroupIds = await getManagedGroupIds(user);
  return managedGroupIds.length > 0;
};

const canCreateGroupTasksForUser = async (user) => {
  const creatableGroupIds = await getCreatableGroupIds(user);
  return creatableGroupIds.length > 0;
};

const getVisibleUsers = async (user) => {
  const rankUsers = await User.find(getVisibleUsersQuery(user))
    .select("name email role rank founderTitle jobTitle profileImageUrl")
    .sort({ rank: 1, name: 1 });
  const managedGroupIds = await getManagedGroupIds(user);
  if (!managedGroupIds.length) {
    return rankUsers;
  }

  const groupUsers = await User.find({ groups: { $in: managedGroupIds } })
    .select("name email role rank founderTitle jobTitle profileImageUrl groups")
    .sort({ rank: 1, name: 1 });

  const usersById = new Map();
  [...rankUsers, ...groupUsers].forEach((person) => {
    usersById.set(person._id.toString(), person);
  });

  return Array.from(usersById.values()).sort((a, b) => getUserRank(a) - getUserRank(b) || a.name.localeCompare(b.name));
};

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id?.toString) return value._id.toString();
  if (value.toString) return value.toString();
  return "";
};

const getVisibleUserIds = async (user) => {
  const users = await getVisibleUsers(user);
  return users.map((visibleUser) => visibleUser._id.toString());
};

const buildTaskVisibilityFilter = async (user, extraFilter = {}) => {
  const visibleUserIds = await getVisibleUserIds(user);
  const userGroupIds = Array.isArray(user?.groups) ? user.groups.map((group) => normalizeId(group)).filter(Boolean) : [];
  const managedGroupIds = await getManagedGroupIds(user);
  const accessibleGroupIds = [...new Set([...userGroupIds, ...managedGroupIds])];
  return {
    ...extraFilter,
    $or: [
      { createdBy: user._id },
      { assignedTo: user._id },
      { group: { $in: accessibleGroupIds } },
      {
        assignedTo: { $in: visibleUserIds },
      },
    ],
  };
};

const canAccessTask = async (user, task) => {
  const userId = normalizeId(user?._id || user?.id || user);
  const createdById = normalizeId(task?.createdBy);
  if (createdById === userId) return true;

  const assignedIds = (task.assignedTo || []).map((assignee) => normalizeId(assignee)).filter(Boolean);
  if (assignedIds.includes(userId)) return true;

  const taskGroupId = normalizeId(task?.group);
  const userGroupIds = Array.isArray(user?.groups) ? user.groups.map((group) => normalizeId(group)).filter(Boolean) : [];
  const managedGroupIds = await getManagedGroupIds(user);
  if (taskGroupId && [...userGroupIds, ...managedGroupIds].includes(taskGroupId)) return true;

  const visibleUserIds = await getVisibleUserIds(user);
  return assignedIds.some((assignedId) => visibleUserIds.includes(assignedId));
};

const buildTeamProgress = (tasks, users) => {
  const progressMap = new Map();

  users.forEach((person) => {
    progressMap.set(person._id.toString(), {
      _id: person._id,
      name: person.name,
      email: person.email,
      role: person.role,
      rank: getUserRank(person),
      profileImageUrl: person.profileImageUrl || null,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      averageProgress: 0,
    });
  });

  tasks.forEach((task) => {
    const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [];
    assignees.forEach((person) => {
      const personId = person?._id?.toString?.() || person?.toString?.();
      if (!personId || !progressMap.has(personId)) return;

      const summary = progressMap.get(personId);
      summary.totalTasks += 1;
      summary.averageProgress += Number(task.progress || 0);

      if (task.status === "Completed") summary.completedTasks += 1;
      else if (task.status === "In Progress") summary.inProgressTasks += 1;
      else summary.pendingTasks += 1;
    });
  });

  return Array.from(progressMap.values())
    .map((summary) => ({
      ...summary,
      averageProgress: summary.totalTasks ? Math.round(summary.averageProgress / summary.totalTasks) : 0,
    }))
    .filter((summary) => summary.totalTasks > 0)
    .sort((a, b) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name));
};

const buildChecklistInsights = async (scope) => {
  const tasksForChecklist = await Task.find(scope).select("todoChecklist progress assignedTo title status");

  let totalChecklistItems = 0;
  let completedChecklistItems = 0;

  const progressBands = [
    { name: "0-25%", value: 0 },
    { name: "26-50%", value: 0 },
    { name: "51-75%", value: 0 },
    { name: "76-100%", value: 0 },
  ];

  tasksForChecklist.forEach((task) => {
    const checklist = Array.isArray(task.todoChecklist) ? task.todoChecklist : [];
    totalChecklistItems += checklist.length;
    completedChecklistItems += checklist.filter((item) => item.completed).length;

    const progress = Number(task.progress || 0);
    if (progress <= 25) progressBands[0].value += 1;
    else if (progress <= 50) progressBands[1].value += 1;
    else if (progress <= 75) progressBands[2].value += 1;
    else progressBands[3].value += 1;
  });

  const checklistCompletionRate = totalChecklistItems
    ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
    : 0;

  return {
    checklistTotals: {
      totalChecklistItems,
      completedChecklistItems,
      remainingChecklistItems: Math.max(totalChecklistItems - completedChecklistItems, 0),
      checklistCompletionRate,
    },
    progressBands,
  };
};

const validateAssignableUsers = async (user, assignedTo, taskType = "assigned", groupId = "") => {
  if (taskType === "personal") {
    if (!canCreatePersonalTasks(user)) {
      return { error: "Not authorized to create personal tasks" };
    }

    return { normalizedAssignedTo: [user._id.toString()], normalizedGroupId: null };
  }

  if (taskType === "group") {
    const creatableGroupIds = await getCreatableGroupIds(user);
    if (!creatableGroupIds.length) {
      return { error: "You are not authorized to create group tasks" };
    }

    const normalizedGroupId = normalizeId(groupId);
    if (!normalizedGroupId) {
      return { error: "A group must be selected for a group task" };
    }

    if (!creatableGroupIds.includes(normalizedGroupId)) {
      return { error: "You can create group tasks only for groups you manage" };
    }

    const members = await User.find({ groups: normalizedGroupId }).select("_id");
    if (!members.length) {
      return { error: "Selected group has no members yet" };
    }

    return {
      normalizedAssignedTo: members.map((member) => member._id.toString()),
      normalizedGroupId,
    };
  }

  if (!(await canCreateAssignableTasksForUser(user))) {
    return { error: "Your rank can only create personal tasks" };
  }

  if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
    return { error: "assignedTo must be a non-empty array of user IDs" };
  }

  const targets = await User.find({ _id: { $in: assignedTo } });
  if (targets.length !== assignedTo.length) {
    return { error: "One or more assignees were not found" };
  }

  const invalidTargetChecks = await Promise.all(
    targets.map(async (target) => ({
      target,
      allowed:
        target._id.toString() !== user._id.toString() &&
        (canAssignFromTo(user, target) || (await canAssignAsGroupAdmin(user, target))),
    })),
  );
  const invalidTarget = invalidTargetChecks.find((item) => !item.allowed)?.target;
  if (invalidTarget) {
    return { error: "You can assign tasks only to teammates in your allowed level or managed groups" };
  }

  return { normalizedAssignedTo: targets.map((target) => target._id.toString()), normalizedGroupId: null };
};

const getAssignableUsers = async (req, res) => {
  try {
    const visibleUsers = await getVisibleUsers(req.user);
    const creatableGroupIds = await getCreatableGroupIds(req.user);
    const manageableGroups = creatableGroupIds.length
      ? await Group.find({ _id: { $in: creatableGroupIds } }).select("name description").sort({ name: 1 })
      : [];
    const assignableUsers = visibleUsers
      .map((person) => {
        const serializedPerson = { ...person._doc };
        if (isAdmin(req.user)) {
          serializedPerson.rank = getUserRank(person);
        }
        return serializedPerson;
      })
      .filter((person) => person._id.toString() !== req.user._id.toString());

    const currentUser = {
      _id: req.user._id,
      role: req.user.role,
    };

    if (isAdmin(req.user)) {
      currentUser.rank = getUserRank(req.user);
    }

    res.json({
      currentUser,
      canCreateAssignedTasks: await canCreateAssignableTasksForUser(req.user),
      canCreateGroupTasks: manageableGroups.length > 0,
      manageableGroups,
      assignableUsers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const scopedFilter = await buildTaskVisibilityFilter(req.user, filter);
    let tasks = await Task.find(scopedFilter)
      .populate("assignedTo", "name email profileImageUrl role founderTitle jobTitle group")
      .populate("group", "name description")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    tasks = tasks.map((task) => {
      const completedCount = task.todoChecklist.filter((item) => item.completed).length;
      return { ...task._doc, completedTodoCount: completedCount };
    });

    const baseFilter = await buildTaskVisibilityFilter(req.user);
    const allTasks = await Task.countDocuments(baseFilter);
    const pendingTasks = await Task.countDocuments({ ...baseFilter, status: "Pending" });
    const inProgressTasks = await Task.countDocuments({ ...baseFilter, status: "In Progress" });
    const completedTasks = await Task.countDocuments({ ...baseFilter, status: "Completed" });

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

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email profileImageUrl role founderTitle jobTitle group")
      .populate("group", "name description")
      .populate("createdBy", "name email role");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!(await canAccessTask(req.user, task))) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo, attachments, todoChecklist, taskType = "assigned", group: groupId } = req.body;
    const { error, normalizedAssignedTo, normalizedGroupId } = await validateAssignableUsers(req.user, assignedTo, taskType, groupId);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo: normalizedAssignedTo,
      group: normalizedGroupId,
      assignedAt: new Date(),
      createdBy: req.user._id,
      taskType,
      todoChecklist,
      attachments,
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!(await canAccessTask(req.user, task))) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    if (req.body.assignedTo || req.body.taskType) {
      const { error, normalizedAssignedTo } = await validateAssignableUsers(
        req.user,
        req.body.assignedTo || task.assignedTo.map((id) => id.toString()),
        req.body.taskType || task.taskType,
        req.body.group || task.group
      );
      if (error) {
        return res.status(400).json({ message: error });
      }
      task.assignedTo = normalizedAssignedTo;
      task.taskType = req.body.taskType || task.taskType;
      task.group = normalizedGroupId;
      task.assignedAt = new Date();
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
    task.attachments = req.body.attachments || task.attachments;

    const updatedTask = await task.save();
    res.json({ message: "Task updated successfully", updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.taskType !== "personal" && !(await canCreateAssignableTasksForUser(req.user)) && task.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete tasks" });
    }

    if (!(await canAccessTask(req.user, task))) {
      return res.status(403).json({ message: "Not authorized to delete this task" });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!(await canAccessTask(req.user, task))) {
      return res.status(403).json({ message: "Not authorized to update this task status" });
    }

    task.status = req.body.status || task.status;
    if (task.status === "Completed") {
      task.todoChecklist.forEach((item) => {
        item.completed = true;
      });
      task.progress = 100;
    }

    const updatedTask = await task.save();
    res.json({ message: "Task status updated successfully", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTaskChecklist = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!(await canAccessTask(req.user, task))) {
      return res.status(403).json({ message: "Not authorized to update checklist" });
    }

    task.todoChecklist = req.body.todoChecklist || [];

    const completedCount = task.todoChecklist.filter((item) => item.completed).length;
    const totalItems = task.todoChecklist.length;
    task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }

    await task.save();

    const updatedTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl role founderTitle jobTitle group"
    );

    res.json({ message: "Task checklist updated", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const scope = await buildTaskVisibilityFilter(req.user);
    const pendingTasks = await Task.countDocuments({ ...scope, status: "Pending" });
    const completedTasks = await Task.countDocuments({ ...scope, status: "Completed" });
    const totalTasks = await Task.countDocuments(scope);
    const overdueTasks = await Task.countDocuments({
      ...scope,
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      { $match: scope },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution.All = totalTasks;

    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityLevelsRaw = await Task.aggregate([
      { $match: scope },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);
    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});
    const checklistInsights = await buildChecklistInsights(scope);

    const recentTasks = await Task.find(scope)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("assignedTo", "name")
      .populate("group", "name")
      .select("title status priority dueDate createdAt assignedAt assignedTo taskType progress todoChecklist group");

    const visibleUsers = await getVisibleUsers(req.user);

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
        ...(isAdmin(req.user) ? { myRank: getUserRank(req.user) } : {}),
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
        progressBands: checklistInsights.progressBands,
        checklistTotals: checklistInsights.checklistTotals,
      },
      recentTasks,
      hierarchyUsers: visibleUsers.map((visibleUser) => {
        const serializedUser = { ...visibleUser._doc };
        if (isAdmin(req.user)) {
          serializedUser.rank = getUserRank(visibleUser);
        }
        return serializedUser;
      }),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDepartmentDashboardData = async (req, res) => getDashboardData(req, res);

const getUserDashboardData = async (req, res) => {
  try {
    const leaderView = await canCreateAssignableTasksForUser(req.user);
    const scope = leaderView ? await buildTaskVisibilityFilter(req.user) : { assignedTo: req.user._id };

    const totalTasks = await Task.countDocuments(scope);
    const pendingTasks = await Task.countDocuments({ ...scope, status: "Pending" });
    const completedTasks = await Task.countDocuments({ ...scope, status: "Completed" });
    const overdueTasks = await Task.countDocuments({
      ...scope,
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      { $match: scope },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    const checklistInsights = await buildChecklistInsights(scope);

    const teamTasks = leaderView
      ? await Task.find(scope).populate("assignedTo", "name email profileImageUrl role rank")
          .populate("group", "name")
      : [];

    const recentTasks = await Task.find(scope)
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("assignedTo", "name email profileImageUrl")
      .populate("createdBy", "name role")
      .populate("group", "name")
      .select("title status priority dueDate createdAt assignedAt assignedTo createdBy progress todoChecklist description group taskType");

    const visibleUsers = await getVisibleUsers(req.user);
    const hierarchyUsers = visibleUsers
      .filter((visibleUser) => visibleUser._id.toString() !== req.user._id.toString())
      .map((visibleUser) => {
        const serializedUser = { ...visibleUser._doc };
        if (isAdmin(req.user)) {
          serializedUser.rank = getUserRank(visibleUser);
        }
        return serializedUser;
      });

    const teamProgress = leaderView
      ? buildTeamProgress(teamTasks, visibleUsers.filter((user) => user._id.toString() !== req.user._id.toString()))
      : [];

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
        ...(isAdmin(req.user) ? { myRank: getUserRank(req.user) } : {}),
        leaderView,
      },
      charts: {
        taskDistribution,
        progressBands: checklistInsights.progressBands,
        checklistTotals: checklistInsights.checklistTotals,
      },
      recentTasks,
      hierarchyUsers,
      teamProgress,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
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
};

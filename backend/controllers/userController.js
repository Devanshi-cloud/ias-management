const Task = require("../models/Task");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {
  ADMIN_EMAIL,
  isAdmin,
  canManageUsers,
  canManageGroups,
  getManagedUsersQuery,
  getRankForRole,
  isUserOnline,
  getUserGroupIds,
} = require("../utils/access");

const populateUser = (query) =>
  query.populate("groups", "name description").select("-password");

const canViewOrEditUser = (actor, targetUser) => {
  if (isAdmin(actor)) return true;
  if (actor._id.toString() === targetUser._id.toString()) return true;
  const actorGroupIds = getUserGroupIds(actor);
  const targetGroupIds = getUserGroupIds(targetUser);
  if (canManageUsers(actor) && actorGroupIds.some((groupId) => targetGroupIds.includes(groupId))) {
    return true;
  }
  return false;
};

const getUsers = async (req, res) => {
  try {
    if (!isAdmin(req.user) && !canManageUsers(req.user) && !canManageGroups(req.user)) {
      return res.status(403).json({ message: "Not authorized to view users" });
    }

    const users = await populateUser(User.find(getManagedUsersQuery(req.user)));

    const usersWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const pendingTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "Pending",
        });
        const inProgressTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "In Progress",
        });
        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "Completed",
        });

        const serializedUser = {
          ...user._doc,
          isOnline: isUserOnline(user),
          pendingTasks,
          inProgressTasks,
          completedTasks,
        };

        if (isAdmin(req.user)) {
          serializedUser.rank = typeof user.rank === "number" ? user.rank : getRankForRole(user.role);
        } else {
          delete serializedUser.rank;
        }

        return serializedUser;
      })
    );

    res.json(usersWithTaskCounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await populateUser(User.findById(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canViewOrEditUser(req.user, user)) {
      return res.status(403).json({ message: "Not authorized to view this user" });
    }

    const serializedUser = user.toObject();
    if (!isAdmin(req.user)) {
      delete serializedUser.rank;
    }

    res.json(serializedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canViewOrEditUser(req.user, user)) {
      return res.status(403).json({ message: "Not authorized to update this user" });
    }

    const {
      name,
      email,
      password,
      currentPassword,
      birthday,
      jobTitle,
      founderTitle,
      availabilityStatus,
      statusMessage,
      role,
      rank,
      groups,
      permissions,
    } = req.body;

    const normalizedEmail = email?.trim()?.toLowerCase();
    if (normalizedEmail) {
      if (!normalizedEmail.endsWith("@octasence.com")) {
        return res.status(400).json({ message: "Only @octasence.com email addresses are allowed" });
      }

      if (normalizedEmail === ADMIN_EMAIL) {
        user.role = "admin";
      } else if (user.role === "admin" && normalizedEmail !== ADMIN_EMAIL) {
        return res.status(400).json({ message: "The admin account must use admin@octasence.com" });
      }

      user.email = normalizedEmail;
    }

    user.name = name || user.name;
    if (birthday !== undefined) user.birthday = birthday || null;
    if (jobTitle !== undefined) user.jobTitle = jobTitle || null;
    if (availabilityStatus !== undefined) user.availabilityStatus = availabilityStatus || "available";
    if (statusMessage !== undefined) user.statusMessage = statusMessage || "";

    if (req.file) {
      user.profileImageUrl = `/uploads/${req.file.filename}`;
    }

    if (password) {
      if (!isAdmin(req.user) && req.user._id.toString() === user._id.toString()) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required" });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      } else if (!isAdmin(req.user) && !canManageUsers(req.user)) {
        return res.status(403).json({ message: "Not authorized to reset this password" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      if (user.passwordResetRequest?.status === "pending") {
        user.passwordResetRequest = {
          status: "completed",
          requestedAt: user.passwordResetRequest.requestedAt || null,
          completedAt: new Date(),
          completedBy: req.user._id,
        };
      }
    }

    if (isAdmin(req.user)) {
      if (role) {
        if (user.email === ADMIN_EMAIL) {
          user.role = "admin";
        } else if (["founder", "team_lead", "employee"].includes(role)) {
          user.role = role;
          if (rank === undefined) {
            user.rank = getRankForRole(role);
          }
        }
      }

      if (rank !== undefined) {
        if (user.email === ADMIN_EMAIL) {
          user.rank = 1;
        } else {
          const normalizedRank = Number(rank);
          if (Number.isNaN(normalizedRank) || normalizedRank < 1 || normalizedRank > 10) {
            return res.status(400).json({ message: "Rank must be a number between 1 and 10" });
          }
          user.rank = normalizedRank;
        }
      }

      if (founderTitle !== undefined) {
        user.founderTitle = user.role === "founder" ? founderTitle || null : null;
      }

      if (groups !== undefined || group !== undefined) {
        const nextGroups = Array.isArray(groups) ? groups : [];
        user.groups = [...new Set(nextGroups.filter(Boolean))];
      }

      if (permissions) {
        user.permissions = {
          manageUsers: permissions.manageUsers === true || permissions.manageUsers === "true",
          manageTasks: permissions.manageTasks === true || permissions.manageTasks === "true",
          manageGroups: permissions.manageGroups === true || permissions.manageGroups === "true",
        };
      }
    }

    const updatedUser = await user.save();
    const populatedUser = await populateUser(User.findById(updatedUser._id));

    const responsePayload = {
      _id: populatedUser._id,
      name: populatedUser.name,
      email: populatedUser.email,
      role: populatedUser.role,
      founderTitle: populatedUser.founderTitle,
      jobTitle: populatedUser.jobTitle,
      permissions: populatedUser.permissions,
      availabilityStatus: populatedUser.availabilityStatus,
      statusMessage: populatedUser.statusMessage,
      isOnline: isUserOnline(populatedUser),
      groups: populatedUser.groups || [],
      group: populatedUser.groups?.[0] || populatedUser.group || null,
      profileImageUrl: populatedUser.profileImageUrl,
      birthday: populatedUser.birthday,
      token: req.headers.authorization.split(" ")[1],
    };

    if (isAdmin(req.user)) {
      responsePayload.rank = populatedUser.rank;
    }

    res.json(responsePayload);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const adminResetUserPassword = async (req, res) => {
  try {
    if (!isAdmin(req.user) && !canManageUsers(req.user)) {
      return res.status(403).json({ message: "Not authorized to reset passwords" });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const actorGroupIds = getUserGroupIds(req.user);
    const targetGroupIds = getUserGroupIds(user);
    if (!isAdmin(req.user) && !actorGroupIds.some((groupId) => targetGroupIds.includes(groupId))) {
      return res.status(403).json({ message: "Not authorized to reset this user's password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetRequest = {
      status: "completed",
      requestedAt: user.passwordResetRequest?.requestedAt || null,
      completedAt: new Date(),
      completedBy: req.user._id,
    };

    await user.save();

    res.json({
      message: `Password updated for ${user.email}`,
      userId: user._id,
      passwordResetRequest: user.passwordResetRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.email === ADMIN_EMAIL) {
      return res.status(400).json({ message: "The primary admin account cannot be deleted" });
    }

    const actorGroupIds = getUserGroupIds(req.user);
    const targetGroupIds = getUserGroupIds(user);
    if (!isAdmin(req.user) && (!canManageUsers(req.user) || !actorGroupIds.some((groupId) => targetGroupIds.includes(groupId)))) {
      return res.status(403).json({ message: "Not authorized to delete this user" });
    }

    await user.deleteOne();

    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getUsers, getUserById, updateUser, adminResetUserPassword, deleteUser };

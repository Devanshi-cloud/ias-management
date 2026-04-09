const Group = require("../models/Group");
const Task = require("../models/Task");
const Message = require("../models/Message");
const User = require("../models/User");
const { isAdmin, isMemberOfGroup } = require("../utils/access");

const populateGroup = (query) => query.populate("admins", "name email role founderTitle jobTitle");

const isGroupAdmin = (group, userId) =>
  (group.admins || []).some((admin) => admin._id?.toString?.() === userId.toString() || admin.toString() === userId.toString());

const canViewGroup = (group, user) => {
  if (isAdmin(user)) return true;
  if (isMemberOfGroup(user, group._id)) return true;
  if (isGroupAdmin(group, user?._id)) return true;
  return false;
};

const canAddMembersToGroup = (group, user) => {
  return isAdmin(user) || isGroupAdmin(group, user?._id);
};

const listGroups = async (req, res) => {
  try {
    if (isAdmin(req.user)) {
      const groups = await populateGroup(Group.find()).sort({ name: 1 });
      return res.json(groups);
    }

    const userGroupIds = Array.isArray(req.user?.groups)
      ? req.user.groups.map((group) => group?._id?.toString?.() || group?.toString?.() || String(group)).filter(Boolean)
      : [];

    const groups = await populateGroup(
      Group.find({
        $or: [
          { _id: { $in: userGroupIds } },
          { admins: req.user._id },
        ],
      }),
    ).sort({ name: 1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only the admin can create groups" });
    }

    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: "Group already exists" });
    }

    const group = await Group.create({
      name,
      description: req.body.description?.trim() || "",
      admins: [],
      memberAddPolicy: "admin_only",
      createdBy: req.user._id,
    });

    const populatedGroup = await populateGroup(Group.findById(group._id));
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getGroupDetail = async (req, res) => {
  try {
    const group = await populateGroup(Group.findById(req.params.id));
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!canViewGroup(group, req.user)) {
      return res.status(403).json({ message: "Not authorized to view this group" });
    }

    const members = await User.find({ groups: group._id })
      .select("-password")
      .sort({ name: 1 });

    const memberIds = members.map((member) => member._id);
    const tasks = await Task.find({
      $or: [
        { group: group._id },
        { assignedTo: { $in: memberIds } },
      ],
    })
      .populate("assignedTo", "name email profileImageUrl role founderTitle jobTitle")
      .populate("group", "name description")
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 });

    const taskIds = tasks.map((task) => task._id);
    const messages = await Message.find({ taskId: { $in: taskIds } })
      .populate("sender", "name email profileImageUrl role founderTitle jobTitle")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(100);

    const canAddMembers = canAddMembersToGroup(group, req.user);
    const availableUsers = canAddMembers
      ? await User.find({
          _id: { $nin: memberIds },
          email: { $ne: null },
          groups: { $ne: group._id },
        })
          .select("-password")
          .sort({ name: 1 })
      : [];

    res.json({
      group,
      members,
      tasks,
      messages,
      availableUsers,
      canAddMembers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only the admin can update group settings" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (req.body.name?.trim()) {
      group.name = req.body.name.trim();
    }
    if (req.body.description !== undefined) {
      group.description = req.body.description?.trim() || "";
    }
    if (req.body.memberAddPolicy) {
      group.memberAddPolicy = req.body.memberAddPolicy;
    }
    if (Array.isArray(req.body.admins)) {
      group.admins = req.body.admins;
    }

    await group.save();
    const populatedGroup = await populateGroup(Group.findById(group._id));
    res.json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addMembersToGroup = async (req, res) => {
  try {
    const group = await populateGroup(Group.findById(req.params.id));
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!canAddMembersToGroup(group, req.user)) {
      return res.status(403).json({ message: "Not authorized to add members to this group" });
    }

    const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
    if (memberIds.length === 0) {
      return res.status(400).json({ message: "memberIds is required" });
    }

    await User.updateMany({ _id: { $in: memberIds } }, { $addToSet: { groups: group._id } });

    const members = await User.find({ groups: group._id }).select("-password").sort({ name: 1 });
    res.json({ message: "Members added to group", members });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { listGroups, createGroup, getGroupDetail, updateGroup, addMembersToGroup };

const Message = require("../models/Message");
const Task = require("../models/Task");
const Conversation = require("../models/Conversation");
const ChatMessage = require("../models/ChatMessage");
const Group = require("../models/Group");
const User = require("../models/User");
const { isAdmin, canManageTasks, getManagedUserIds, isUserOnline, isMemberOfGroup, getUserGroupIds } = require("../utils/access");

const userSummarySelect = "name email profileImageUrl role founderTitle jobTitle availabilityStatus statusMessage lastSeenAt";

const mapUserPresence = (user) => ({
  ...user._doc,
  isOnline: isUserOnline(user),
});

const getDeletedEntryForUser = (conversation, userId) =>
  (conversation.deletedFor || []).find((entry) => entry.user?.toString?.() === userId.toString());

const hasMessagesAfterClearPoint = async (conversationId, clearedAt) => {
  const nextMessage = await ChatMessage.findOne({
    conversationId,
    createdAt: { $gt: clearedAt },
  }).select("_id");
  return Boolean(nextMessage);
};

const canAccessTaskMessage = async (req, task) => {
  const userId = req.user._id.toString();
  const isAssigned = task.assignedTo.map((id) => id.toString()).includes(userId);
  if (isAssigned || isAdmin(req.user)) return true;

  if (canManageTasks(req.user)) {
    const managedUserIds = await getManagedUserIds(req.user);
    return task.assignedTo.some((id) => managedUserIds.includes(id.toString()));
  }

  return false;
};

const getTaskMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const canAccess = await canAccessTaskMessage(req, task);
    if (!canAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ taskId })
      .populate("sender", userSummarySelect)
      .sort({ createdAt: 1 });

    res.json(messages.map((msg) => ({ ...msg._doc, sender: mapUserPresence(msg.sender) })));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const canAccess = await canAccessTaskMessage(req, task);
    if (!canAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await Message.create({
      taskId,
      sender: req.user._id,
      text: text.trim(),
    });

    const populated = await message.populate("sender", userSummarySelect);
    res.status(201).json({ ...populated._doc, sender: mapUserPresence(populated.sender) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const ensureGroupConversation = async (groupId, creatorId) => {
  let conversation = await Conversation.findOne({ type: "group", group: groupId });
  if (!conversation) {
    const group = await Group.findById(groupId);
    conversation = await Conversation.create({
      type: "group",
      title: group?.name || "Group Chat",
      group: groupId,
      participants: [],
      createdBy: creatorId,
    });
  }
  return conversation;
};

const canAccessConversation = async (user, conversation) => {
  if (conversation.type === "direct") {
    return conversation.participants.some((participant) => participant.toString() === user._id.toString());
  }

  if (isAdmin(user)) return true;
  if (!conversation.group) return false;
  return isMemberOfGroup(user, conversation.group);
};

const serializeConversation = async (conversation, currentUserId) => {
  if (conversation.type === "group" && conversation.group) {
    const group = await Group.findById(conversation.group).populate("admins", userSummarySelect);
    const members = await User.find({ groups: conversation.group }).select(userSummarySelect);
    return {
      ...conversation._doc,
      group: group
        ? {
            ...group._doc,
            admins: (group.admins || []).map(mapUserPresence),
          }
        : null,
      participants: members.map(mapUserPresence),
      counterpart: null,
    };
  }

  const participants = await User.find({ _id: { $in: conversation.participants } }).select(userSummarySelect);
  const counterpart = participants.find((participant) => participant._id.toString() !== currentUserId.toString()) || null;
  return {
    ...conversation._doc,
    participants: participants.map(mapUserPresence),
    counterpart: counterpart ? mapUserPresence(counterpart) : null,
  };
};

const getInbox = async (req, res) => {
  try {
    const directConversations = await Conversation.find({
      type: "direct",
      participants: req.user._id,
    }).sort({ lastMessageAt: -1 });

    let groupConversations = [];
    if (isAdmin(req.user)) {
      const groups = await Group.find().select("_id");
      groupConversations = await Promise.all(groups.map((group) => ensureGroupConversation(group._id, req.user._id)));
    } else if (getUserGroupIds(req.user).length) {
      groupConversations = await Promise.all(getUserGroupIds(req.user).map((groupId) => ensureGroupConversation(groupId, req.user._id)));
    }

    const visibleConversations = [];
    for (const conversation of [...directConversations, ...groupConversations].sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
    )) {
      const deletedEntry = getDeletedEntryForUser(conversation, req.user._id);
      if (!deletedEntry) {
        visibleConversations.push(conversation);
        continue;
      }

      if (await hasMessagesAfterClearPoint(conversation._id, deletedEntry.clearedAt)) {
        visibleConversations.push(conversation);
      }
    }

    const conversations = await Promise.all(
      visibleConversations.map((conversation) => serializeConversation(conversation, req.user._id))
    );

    const directoryUsers = await User.find({ _id: { $ne: req.user._id } }).select(userSummarySelect);

    res.json({
      conversations,
      directoryUsers: directoryUsers.map(mapUserPresence),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const startDirectConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ message: "participantId is required" });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingConversations = await Conversation.find({
      type: "direct",
      participants: { $all: [req.user._id, participantId] },
    });
    let conversation = existingConversations.find((item) => item.participants.length === 2);

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        title: "",
        participants: [req.user._id, participantId],
        createdBy: req.user._id,
      });
    }

    res.status(201).json(await serializeConversation(conversation, req.user._id));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const openGroupConversation = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isAdmin(req.user) && !isMemberOfGroup(req.user, group._id)) {
      return res.status(403).json({ message: "Not authorized to access this group chat" });
    }

    const conversation = await ensureGroupConversation(group._id, req.user._id);
    res.json(await serializeConversation(conversation, req.user._id));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const allowed = await canAccessConversation(req.user, conversation);
    if (!allowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    const deletedEntry = getDeletedEntryForUser(conversation, req.user._id);
    const messageFilter = { conversationId: conversation._id };
    if (deletedEntry?.clearedAt) {
      messageFilter.createdAt = { $gt: deletedEntry.clearedAt };
    }

    const messages = await ChatMessage.find(messageFilter)
      .populate("sender", userSummarySelect)
      .sort({ createdAt: 1 });

    res.json(messages.map((message) => ({ ...message._doc, sender: mapUserPresence(message.sender) })));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const sendConversationMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const allowed = await canAccessConversation(req.user, conversation);
    if (!allowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await ChatMessage.create({
      conversationId: conversation._id,
      sender: req.user._id,
      text: text.trim(),
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await message.populate("sender", userSummarySelect);
    res.status(201).json({ ...populated._doc, sender: mapUserPresence(populated.sender) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteConversationForSelf = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const allowed = await canAccessConversation(req.user, conversation);
    if (!allowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    const deletedFor = conversation.deletedFor || [];
    const existingEntry = deletedFor.find((entry) => entry.user?.toString?.() === req.user._id.toString());
    if (existingEntry) {
      existingEntry.clearedAt = new Date();
    } else {
      deletedFor.push({ user: req.user._id, clearedAt: new Date() });
    }
    conversation.deletedFor = deletedFor;
    await conversation.save();

    res.json({ message: "Chat cleared for your account" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTaskMessages,
  sendMessage,
  getInbox,
  startDirectConversation,
  openGroupConversation,
  getConversationMessages,
  sendConversationMessage,
  deleteConversationForSelf,
};

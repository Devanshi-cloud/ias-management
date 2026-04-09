const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  getTaskMessages,
  sendMessage,
  getInbox,
  startDirectConversation,
  openGroupConversation,
  getConversationMessages,
  sendConversationMessage,
  deleteConversationForSelf,
} = require("../controllers/messageController");

router.get("/inbox", protect, getInbox);
router.post("/direct", protect, startDirectConversation);
router.get("/group/:groupId", protect, openGroupConversation);
router.get("/conversations/:conversationId/messages", protect, getConversationMessages);
router.post("/conversations/:conversationId/messages", protect, sendConversationMessage);
router.delete("/conversations/:conversationId", protect, deleteConversationForSelf);
router.get("/task/:taskId", protect, getTaskMessages);
router.post("/task/:taskId", protect, sendMessage);

module.exports = router;

const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getTaskMessages, sendMessage } = require("../controllers/messageController");

router.get("/task/:taskId", protect, getTaskMessages);
router.post("/task/:taskId", protect, sendMessage);

module.exports = router;

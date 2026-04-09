const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  listGroups,
  createGroup,
  getGroupDetail,
  updateGroup,
  addMembersToGroup,
} = require("../controllers/groupController");

const router = express.Router();

router.get("/", protect, listGroups);
router.post("/", protect, createGroup);
router.get("/:id", protect, getGroupDetail);
router.put("/:id", protect, updateGroup);
router.post("/:id/members", protect, addMembersToGroup);

module.exports = router;

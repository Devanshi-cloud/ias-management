const mongoose = require("mongoose");

const ADMIN_EMAIL = "admin@octasence.com";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImageUrl: { type: String, default: null },

    birthday: { type: Date, default: null },
    jobTitle: { type: String, default: null },
    founderTitle: { type: String, default: null },
    availabilityStatus: {
      type: String,
      enum: ["available", "away", "on_leave"],
      default: "available",
    },
    statusMessage: { type: String, default: "" },
    lastSeenAt: { type: Date, default: Date.now },
    role: {
      type: String,
      enum: ["admin", "founder", "team_lead", "employee"],
      default: "employee",
    },
    rank: {
      type: Number,
      min: 1,
      max: 10,
      default: 4,
    },

    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    permissions: {
      manageUsers: { type: Boolean, default: false },
      manageTasks: { type: Boolean, default: false },
      manageGroups: { type: Boolean, default: false },
    },

    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    teamMembers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    lastBirthdayReminderYear: { type: Number, default: null },

    passwordResetRequest: {
      status: {
        type: String,
        enum: ["none", "pending", "completed"],
        default: "none",
      },
      requestedAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
UserSchema.index({ role: 1, groups: 1 });
UserSchema.index({ supervisor: 1 });
UserSchema.index({ birthday: 1 });

UserSchema.pre("save", function enforcePrimaryAdminRank(next) {
  if (this.group && !this.groups.some((groupId) => groupId.toString() === this.group.toString())) {
    this.groups.push(this.group);
  }

  if (!this.group && this.groups.length) {
    this.group = this.groups[0];
  }

  if (this.email?.toLowerCase?.() === ADMIN_EMAIL) {
    this.role = "admin";
    this.rank = 1;
  }

  next();
});

module.exports = mongoose.model("User", UserSchema);

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    profileImageUrl: { type: String, default: null },

    role: {
      type: String,
      enum: ["admin", "member"], // Only allow these roles
      default: "member",
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("User", UserSchema);

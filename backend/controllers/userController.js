const Task = require("../models/Task");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// @desc    Get all users (Admin only)
// @route   GET /api/users/
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
      const users = await User.find({ role: "member" }).select("-password");

      // Add task counts to each user
      const usersWithTaskCounts = await Promise.all(
        users.map(async (user) => {
          const pendingTasks = await Task.countDocuments({
            assignedTo: user._id,
            status: "Pending"
          });
          const inProgressTasks = await Task.countDocuments({
            assignedTo: user._id,
            status: "In Progress"
          });
          const completedTasks = await Task.countDocuments({
            assignedTo: user._id,
            status: "Completed"
          });
          return {
            ...user._doc,
            pendingTasks,
            inProgressTasks,
            completedTasks
          };
        })
      );
      res.json(usersWithTaskCounts);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is authorized to update this profile
    if (user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { name, email, password, birthday, iasPosition } = req.body;

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.birthday = birthday || user.birthday;
    user.iasPosition = iasPosition || user.iasPosition;

    if (req.file) {
      user.profileImageUrl = `/uploads/${req.file.filename}`;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImageUrl: updatedUser.profileImageUrl,
      birthday: updatedUser.birthday,
      iasPosition: updatedUser.iasPosition,
      token: req.headers.authorization.split(" ")[1] // Keep the token the same
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

        await user.deleteOne();

        res.json({ message: "User removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };


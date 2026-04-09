const User = require("../models/User");

const ADMIN_EMAIL = "admin@octasence.com";
const ROLE_RANKS = {
  admin: 1,
  founder: 2,
  team_lead: 3,
  employee: 4,
};

const isAdmin = (user) => user?.role === "admin" && user?.email === ADMIN_EMAIL;
const isFounder = (user) => user?.role === "founder";
const isTeamLead = (user) => user?.role === "team_lead";
const getRankForRole = (role) => ROLE_RANKS[role] || 99;
const getUserRank = (user) => {
  if (isAdmin(user)) return 1;
  if (typeof user?.rank === "number") return user.rank;
  return getRankForRole(user?.role);
};
const canCreateAssignedTasks = (user) => getUserRank(user) < getRankForRole("employee");
const canCreatePersonalTasks = (user) => Boolean(user);
const isUserOnline = (user) => {
  if (!user?.lastSeenAt) return false;
  return Date.now() - new Date(user.lastSeenAt).getTime() < 2 * 60 * 1000;
};
const canAssignFromTo = (actor, target) => {
  if (!actor || !target) return false;
  if (actor._id?.toString?.() === target._id?.toString?.()) return true;
  return getUserRank(actor) <= getUserRank(target);
};

const hasPermission = (user, permission) => {
  if (isAdmin(user)) return true;
  if (!isFounder(user)) return false;
  return Boolean(user?.permissions?.[permission]);
};

const canManageUsers = (user) => hasPermission(user, "manageUsers");
const canManageTasks = (user) => hasPermission(user, "manageTasks");
const canManageGroups = (user) => hasPermission(user, "manageGroups");
const getUserGroupIds = (user) => {
  if (!user) return [];
  const groups = Array.isArray(user.groups) ? user.groups : [];
  return groups
    .map((group) => {
      if (!group) return "";
      if (typeof group === "string") return group;
      if (group._id?.toString) return group._id.toString();
      if (group.toString) return group.toString();
      return "";
    })
    .filter(Boolean);
};
const isMemberOfGroup = (user, groupId) => getUserGroupIds(user).includes(groupId?.toString?.() || String(groupId));

const getManagedUsersQuery = (user) => {
  if (isAdmin(user)) return {};
  const groupIds = getUserGroupIds(user);
  if ((canManageUsers(user) || canManageTasks(user) || canManageGroups(user)) && groupIds.length) {
    return { groups: { $in: groupIds } };
  }
  return { _id: user?._id };
};

const getManagedUserIds = async (user) => {
  const managedUsers = await User.find(getManagedUsersQuery(user)).select("_id");
  return managedUsers.map((managedUser) => managedUser._id.toString());
};

const getVisibleUsersQuery = (user) => {
  const userRank = getUserRank(user);
  return {
    $or: [
      { _id: user?._id },
      { rank: { $gte: userRank } },
      {
        rank: { $exists: false },
        role: { $in: Object.keys(ROLE_RANKS).filter((role) => getRankForRole(role) >= userRank) },
      },
    ],
  };
};

module.exports = {
  ADMIN_EMAIL,
  ROLE_RANKS,
  isAdmin,
  isFounder,
  isTeamLead,
  getRankForRole,
  getUserRank,
  canCreateAssignedTasks,
  canCreatePersonalTasks,
  isUserOnline,
  canAssignFromTo,
  hasPermission,
  canManageUsers,
  canManageTasks,
  canManageGroups,
  getUserGroupIds,
  isMemberOfGroup,
  getManagedUsersQuery,
  getManagedUserIds,
  getVisibleUsersQuery,
};

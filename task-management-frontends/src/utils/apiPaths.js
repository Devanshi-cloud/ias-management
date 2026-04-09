const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const API_PATHS = {
  // Auth
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  PROFILE: `${API_BASE_URL}/auth/profile`,
  PRESENCE_HEARTBEAT: `${API_BASE_URL}/auth/presence`,
  UPDATE_STATUS: `${API_BASE_URL}/auth/status`,
  UPDATE_PROFILE: (id) => `${API_BASE_URL}/users/${id}`,
  UPLOAD_IMAGE: `${API_BASE_URL}/auth/upload-image`,

  // Users
  GET_USERS: `${API_BASE_URL}/users`,
  GET_USER_BY_ID: (id) => `${API_BASE_URL}/users/${id}`,
  ADMIN_RESET_PASSWORD: (id) => `${API_BASE_URL}/users/${id}/reset-password`,
  DELETE_USER: `${API_BASE_URL}/users`,
  GET_GROUPS: `${API_BASE_URL}/groups`,
  CREATE_GROUP: `${API_BASE_URL}/groups`,
  GET_GROUP_DETAIL: (id) => `${API_BASE_URL}/groups/${id}`,
  UPDATE_GROUP: (id) => `${API_BASE_URL}/groups/${id}`,
  ADD_GROUP_MEMBERS: (id) => `${API_BASE_URL}/groups/${id}/members`,

  // Tasks
  GET_TASKS: `${API_BASE_URL}/tasks`,
  GET_TASK_BY_ID: (id) => `${API_BASE_URL}/tasks/${id}`,
  CREATE_TASK: `${API_BASE_URL}/tasks`,
  UPDATE_TASK: (id) => `${API_BASE_URL}/tasks/${id}`,
  DELETE_TASK: (id) => `${API_BASE_URL}/tasks/${id}`,
  UPDATE_TASK_STATUS: (id) => `${API_BASE_URL}/tasks/${id}/status`,
  UPDATE_TASK_CHECKLIST: (id) => `${API_BASE_URL}/tasks/${id}/todo`,
  DASHBOARD_DATA: `${API_BASE_URL}/tasks/dashboard-data`,
  USER_DASHBOARD_DATA: `${API_BASE_URL}/tasks/user-dashboard-data`,
  DEPARTMENT_DASHBOARD_DATA: `${API_BASE_URL}/tasks/department-dashboard-data`,
  GET_ASSIGNABLE_USERS: `${API_BASE_URL}/tasks/assignable-users`,

  // Reports
  EXPORT_TASKS: `${API_BASE_URL}/reports/export/tasks`,
  EXPORT_USERS: `${API_BASE_URL}/reports/export/users`,

  // Messages
  CHAT_INBOX: `${API_BASE_URL}/messages/inbox`,
  START_DIRECT_CHAT: `${API_BASE_URL}/messages/direct`,
  OPEN_GROUP_CHAT: (groupId) => `${API_BASE_URL}/messages/group/${groupId}`,
  GET_CONVERSATION_MESSAGES: (conversationId) => `${API_BASE_URL}/messages/conversations/${conversationId}/messages`,
  SEND_CONVERSATION_MESSAGE: (conversationId) => `${API_BASE_URL}/messages/conversations/${conversationId}/messages`,
  DELETE_CONVERSATION_FOR_SELF: (conversationId) => `${API_BASE_URL}/messages/conversations/${conversationId}`,
  GET_TASK_MESSAGES: (taskId) => `${API_BASE_URL}/messages/task/${taskId}`,
  SEND_TASK_MESSAGE: (taskId) => `${API_BASE_URL}/messages/task/${taskId}`,
};

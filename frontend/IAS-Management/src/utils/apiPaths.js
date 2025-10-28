// Base URL for API
const BASE_URL = "http://localhost:8000/api";

// Auth endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: `${BASE_URL}/auth/register`,
  LOGIN: `${BASE_URL}/auth/login`,
  PROFILE: `${BASE_URL}/auth/profile`,
  UPDATE_PROFILE: `${BASE_URL}/auth/profile`,
  UPLOAD_IMAGE: `${BASE_URL}/auth/upload-image`,
};

// Task endpoints
export const TASK_ENDPOINTS = {
  GET_ALL_TASKS: `${BASE_URL}/tasks`,
  GET_TASK_BY_ID: (id) => `${BASE_URL}/tasks/${id}`,
  CREATE_TASK: `${BASE_URL}/tasks`,
  UPDATE_TASK: (id) => `${BASE_URL}/tasks/${id}`,
  DELETE_TASK: (id) => `${BASE_URL}/tasks/${id}`,
  UPDATE_TASK_STATUS: (id) => `${BASE_URL}/tasks/${id}/status`,
  UPDATE_TASK_CHECKLIST: (id) => `${BASE_URL}/tasks/${id}/todo`,
  DASHBOARD_DATA: `${BASE_URL}/tasks/dashboard-data`,
  USER_DASHBOARD_DATA: `${BASE_URL}/tasks/user-dashboard-data`,
};

// User endpoints
export const USER_ENDPOINTS = {
  GET_ALL_USERS: `${BASE_URL}/users`,
  GET_USER_BY_ID: (id) => `${BASE_URL}/users/${id}`,
};

// Report endpoints
export const REPORT_ENDPOINTS = {
  EXPORT_TASKS: `${BASE_URL}/reports/export/tasks`,
  EXPORT_USERS: `${BASE_URL}/reports/export/users`,
};
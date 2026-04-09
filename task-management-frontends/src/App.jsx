import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import PrivateRoute from "./routes/PrivateRoute"

// Auth Pages
import Login from "./pages/Auth/Login"
import SignUp from "./pages/Auth/SignUp"

// Admin Pages
import AdminDashboard from "./pages/Admin/Dashboard"
import CreateTask from "./pages/Admin/CreateTask"
import ManageTasks from "./pages/Admin/ManageTasks"
import ManageUsers from "./pages/Admin/ManageUsers"
import EditTask from "./pages/Admin/EditTask"
import GroupWorkspace from "./pages/Admin/GroupWorkspace"
import Chats from "./pages/Chats/Chats"

// User Pages
import UserDashboard from "./pages/User/UserDashboard"
import MyTasks from "./pages/User/MyTasks"
import ViewTaskDetail from "./pages/User/ViewTaskDetail"
import UserProfile from "./pages/User/UserProfile"

import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute permission="manageTasks">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/create-task"
            element={
              <PrivateRoute>
                <CreateTask />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/create"
            element={
              <PrivateRoute>
                <CreateTask />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/manage-tasks"
            element={
              <PrivateRoute permission="manageTasks">
                <ManageTasks />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/manage-users"
            element={
              <PrivateRoute permission={["manageUsers", "manageGroups"]}>
                <ManageUsers />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/groups/:id"
            element={
              <PrivateRoute>
                <GroupWorkspace />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/edit-task/:id"
            element={
              <PrivateRoute permission="manageTasks">
                <EditTask />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/task/:id"
            element={
              <PrivateRoute permission="manageTasks">
                <ViewTaskDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <PrivateRoute role="admin">
                <UserProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/chats"
            element={
              <PrivateRoute>
                <Chats />
              </PrivateRoute>
            }
          />

          {/* User Routes */}
          <Route
            path="/user/dashboard"
            element={
              <PrivateRoute role="member">
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/my-tasks"
            element={
              <PrivateRoute role="member">
                <MyTasks />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/task/:id"
            element={
              <PrivateRoute role="member">
                <ViewTaskDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <PrivateRoute role="member">
                <UserProfile />
              </PrivateRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

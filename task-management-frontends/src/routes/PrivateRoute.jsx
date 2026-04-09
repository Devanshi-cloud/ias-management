"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/auth-context"

const PrivateRoute = ({ children, role, permission }) => {
  const { user, loading, canManageTasks, canManageUsers, canManageGroups } = useAuth()

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role === "admin" && user.role !== "admin") {
    return <Navigate to="/user/dashboard" replace />
  }

  if (role === "member" && user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (permission) {
    const requiredPermissions = Array.isArray(permission) ? permission : [permission]
    const permissionMap = {
      manageTasks: canManageTasks,
      manageUsers: canManageUsers,
      manageGroups: canManageGroups,
    }
    const hasPermission = user.role === "admin" || requiredPermissions.some((item) => permissionMap[item])
    if (!hasPermission) {
      return <Navigate to="/user/dashboard" replace />
    }
  }

  return children
}

export default PrivateRoute

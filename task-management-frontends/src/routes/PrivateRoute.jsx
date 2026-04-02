"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth()

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

  return children
}

export default PrivateRoute

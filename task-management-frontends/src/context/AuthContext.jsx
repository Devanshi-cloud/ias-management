"use client"

import { useState, useEffect } from "react"
import axiosInstance from "../utils/axiosInstance"
import { API_PATHS } from "../utils/apiPaths"
import { AuthContext } from "./auth-context"

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user?.token) return undefined

    const heartbeat = () => {
      axiosInstance.post(API_PATHS.PRESENCE_HEARTBEAT).catch(() => {})
    }

    heartbeat()
    const intervalId = window.setInterval(heartbeat, 60000)
    return () => window.clearInterval(intervalId)
  }, [user?.token])

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post(API_PATHS.LOGIN, { email, password })
      const userData = response.data
      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
      return userData
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await axiosInstance.post(API_PATHS.REGISTER, userData)
      const newUser = response.data
      localStorage.setItem("user", JSON.stringify(newUser))
      setUser(newUser)
      return newUser
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
    window.location.href = "/login"
  }

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isFounder: user?.role === "founder",
    isTeamLead: user?.role === "team_lead",
    canManageUsers: user?.role === "admin" || !!user?.permissions?.manageUsers,
    canManageTasks: user?.role === "admin" || user?.role === "founder" || user?.role === "team_lead" || !!user?.permissions?.manageTasks,
    canManageGroups: user?.role === "admin" || !!user?.permissions?.manageGroups,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/app/providers/AuthProvider"

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  console.log("Navbar user (from useAuth):", user)

  const handleLogout = () => {
    logout()
  }

  return (
    <nav style={{ background: "var(--primary)", color: "white", padding: "1rem 2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Task Manager</h1>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {user?.role === "admin" ? (
            <>
              <Link href="/admin/dashboard" style={{ color: "white", textDecoration: "none" }}>
                Dashboard
              </Link>
              <Link href="/admin/create-task" style={{ color: "white", textDecoration: "none" }}>
                Create Task
              </Link>
              <Link href="/admin/manage-tasks" style={{ color: "white", textDecoration: "none" }}>
                Manage Tasks
              </Link>
              <Link href="/admin/manage-users" style={{ color: "white", textDecoration: "none" }}>
                Manage Users
              </Link>
            </>
          ) : user?.role === "vp" || user?.role === "head" ? (
            <>
              <Link href="/admin/department-dashboard" style={{ color: "white", textDecoration: "none" }}>
                Department Dashboard
              </Link>
              <Link href="/admin/create-task" style={{ color: "white", textDecoration: "none" }}>
                Create Task
              </Link>
              <Link href="/admin/manage-tasks" style={{ color: "white", textDecoration: "none" }}>
                Manage Department Tasks
              </Link>
              <Link href="/admin/manage-users" style={{ color: "white", textDecoration: "none" }}>
                Manage Department Users
              </Link>
            </>
          ) : (
            <>
              <Link href="/user/dashboard" style={{ color: "white", textDecoration: "none" }}>
                Dashboard
              </Link>
              <Link href="/user/my-tasks" style={{ color: "white", textDecoration: "none" }}>
                My Tasks
              </Link>
            </>
          )}
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

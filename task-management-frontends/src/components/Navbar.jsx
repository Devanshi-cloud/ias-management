"use client"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/auth-context"
import { LogOut, User, LayoutDashboard, ListTodo, Users, PlusCircle, UserCircle, Layers3, MessageSquare } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const Navbar = () => {
  const { user, logout, isAdmin, canManageTasks, canManageUsers, canManageGroups } = useAuth()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const menuRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const showManagerArea = canManageTasks || canManageUsers || canManageGroups

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link
          to={showManagerArea ? "/admin/dashboard" : "/user/dashboard"}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          Octasence Tasks
        </Link>
      </div>

      <div className="navbar-menu">
        {showManagerArea ? (
          <>
            {canManageTasks && (
              <>
                <Link to="/admin/dashboard" className="navbar-link">
                  <LayoutDashboard size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
                  Dashboard
                </Link>
                <Link to="/tasks/create" className="navbar-link">
                  <PlusCircle size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
                  Create Task
                </Link>
                <Link to="/admin/manage-tasks" className="navbar-link">
                  <ListTodo size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
                  Task Board
                </Link>
                <Link to="/chats" className="navbar-link">
                  <MessageSquare size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
                  Chats
                </Link>
                {user?.groups?.[0]?._id && (
                  <Link to={`/admin/groups/${user.groups[0]._id}`} className="navbar-link">
                    <Layers3 size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
                    My Groups
                  </Link>
                )}
              </>
            )}
            {(canManageUsers || canManageGroups) && (
              <Link to="/admin/manage-users" className="navbar-link">
                <Users size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
                People & Groups
              </Link>
            )}
          </>
        ) : (
          <>
            <Link to="/user/dashboard" className="navbar-link">
              <LayoutDashboard size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
              Dashboard
            </Link>
            <Link to="/user/my-tasks" className="navbar-link">
              <ListTodo size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
              My Tasks
            </Link>
            <Link to="/tasks/create" className="navbar-link">
              <PlusCircle size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
              Add Task
            </Link>
            <Link to="/chats" className="navbar-link">
              <MessageSquare size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
              Chats
            </Link>
            {user?.groups?.[0]?._id && (
              <Link to={`/admin/groups/${user.groups[0]._id}`} className="navbar-link">
                <Layers3 size={18} style={{ display: "inline", marginRight: "0.25rem" }} />
                My Groups
              </Link>
            )}
          </>
        )}

        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "0.375rem",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.name}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--primary)"
                }}
              />
            ) : (
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.875rem",
                  fontWeight: "600"
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ color: "var(--text)", fontSize: "0.875rem", fontWeight: "500" }}>
              {user?.name}
            </span>
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "0.5rem",
                backgroundColor: "white",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                minWidth: "200px",
                zIndex: 1000,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text)" }}>
                  {user?.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                  {user?.email}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
                  {user?.role === "founder" ? user?.founderTitle || "Founder" : user?.jobTitle || user?.role}
                </p>
              </div>

              <Link
                to={isAdmin ? "/admin/profile" : "/user/profile"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  textDecoration: "none",
                  color: "var(--text)",
                  transition: "background-color 0.2s",
                }}
                onClick={() => setShowProfileMenu(false)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--background)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <UserCircle size={16} />
                <span style={{ fontSize: "0.875rem" }}>My Profile</span>
              </Link>

              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  handleLogout()
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--danger)",
                  fontSize: "0.875rem",
                  transition: "background-color 0.2s",
                  borderTop: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--background)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

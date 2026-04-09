"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../../components/Navbar"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { useAuth } from "../../context/auth-context"
import { Users, Layers3 } from "lucide-react"

const emptyGroupForm = { name: "", description: "" }

const ManageUsers = () => {
  const { user, isAdmin, canManageUsers } = useAuth()
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupForm, setGroupForm] = useState(emptyGroupForm)
  const [passwordInputs, setPasswordInputs] = useState({})
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [savingUserId, setSavingUserId] = useState("")
  const [resettingUserId, setResettingUserId] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersResponse, groupsResponse] = await Promise.all([
        axiosInstance.get(API_PATHS.GET_USERS),
        axiosInstance.get(API_PATHS.GET_GROUPS),
      ])
      setUsers(usersResponse.data)
      setGroups(groupsResponse.data)
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Failed to load people and groups")
    } finally {
      setLoading(false)
    }
  }

  const handleGroupSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    setError("")

    try {
      const response = await axiosInstance.post(API_PATHS.CREATE_GROUP, groupForm)
      setGroups((prev) => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)))
      setGroupForm(emptyGroupForm)
      setMessage("Group created successfully.")
    } catch (groupError) {
      setError(groupError.response?.data?.message || "Failed to create group")
    }
  }

  const updateLocalUserField = (userId, field, value) => {
    setUsers((prevUsers) =>
      prevUsers.map((item) => {
        if (item._id !== userId) return item
        return { ...item, [field]: value }
      }),
    )
  }

  const updateLocalPermission = (userId, key, value) => {
    setUsers((prevUsers) =>
      prevUsers.map((item) => {
        if (item._id !== userId) return item
        return {
          ...item,
          permissions: {
            ...item.permissions,
            [key]: value,
          },
        }
      }),
    )
  }

  const handleSaveUser = async (targetUser) => {
    setMessage("")
    setError("")

    try {
      setSavingUserId(targetUser._id)
      const payload = {
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        rank: targetUser.rank,
        founderTitle: targetUser.founderTitle || "",
        jobTitle: targetUser.jobTitle || "",
        groups: (targetUser.groups || []).map((group) => group._id || group).filter(Boolean),
        permissions: targetUser.permissions || {},
      }

      const response = await axiosInstance.put(API_PATHS.UPDATE_PROFILE(targetUser._id), payload)
      setUsers((prevUsers) =>
        prevUsers.map((item) => (item._id === targetUser._id ? { ...item, ...response.data } : item)),
      )
      setMessage(`Saved ${targetUser.name}`)
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save user")
    } finally {
      setSavingUserId("")
    }
  }

  const handleAdminPasswordReset = async (userId) => {
    const newPassword = passwordInputs[userId]?.trim()
    setMessage("")
    setError("")

    if (!newPassword || newPassword.length < 6) {
      setError("Enter a password with at least 6 characters.")
      return
    }

    try {
      setResettingUserId(userId)
      const response = await axiosInstance.put(API_PATHS.ADMIN_RESET_PASSWORD(userId), { newPassword })
      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item._id === userId ? { ...item, passwordResetRequest: response.data.passwordResetRequest } : item,
        ),
      )
      setPasswordInputs((prev) => ({ ...prev, [userId]: "" }))
      setMessage(response.data.message || "Password updated")
    } catch (resetError) {
      setError(resetError.response?.data?.message || "Failed to reset password")
    } finally {
      setResettingUserId("")
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) {
      return
    }

    try {
      await axiosInstance.delete(`${API_PATHS.DELETE_USER}/${userId}`)
      setUsers((prevUsers) => prevUsers.filter((item) => item._id !== userId))
      setMessage("User deleted")
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete user")
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p>Loading people workspace...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ display: "grid", gap: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "minmax(280px, 360px) 1fr",
            alignItems: "start",
          }}
        >
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <Layers3 size={20} />
              <div>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Groups</h1>
                <p style={{ color: "var(--text-light)", marginTop: "0.25rem" }}>
                  Create company groups and assign founders or employees into them.
                </p>
              </div>
            </div>

            {isAdmin && (
              <form onSubmit={handleGroupSubmit} style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
                <input
                  className="input"
                  placeholder="Group name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <textarea
                  className="input"
                  placeholder="Short description"
                  rows="3"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                <button className="btn btn-primary" type="submit">
                  Add Group
                </button>
              </form>
            )}

            {!isAdmin && (
              <p style={{ color: "var(--text-light)", marginBottom: "1rem" }}>
                Only `admin@octasence.com` can create groups.
              </p>
            )}

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {groups.map((group) => (
                <Link
                  key={group._id}
                  to={`/admin/groups/${group._id}`}
                  style={{
                    display: "block",
                    padding: "0.85rem 1rem",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                    background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.04))",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div style={{ fontWeight: 700 }}>{group.name}</div>
                    <span className="badge badge-progress">
                      {group.memberAddPolicy === "all_members"
                        ? "All members"
                        : group.memberAddPolicy === "group_admins"
                          ? "Group admins"
                          : "Admin only"}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-light)", fontSize: "0.9rem", marginTop: "0.3rem" }}>
                    {group.description || "No description yet"}
                  </div>
                </Link>
              ))}
              {groups.length === 0 && <p style={{ color: "var(--text-light)" }}>No groups created yet.</p>}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <Users size={20} />
              <div>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>People & Permissions</h1>
                <p style={{ color: "var(--text-light)", marginTop: "0.25rem" }}>
                  Admin controls founder permissions. Founders can be placed in groups and titled during signup.
                </p>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <div style={{ display: "grid", gap: "1rem" }}>
              {users.map((person) => {
                const selectedGroupIds = (person.groups || []).map((group) => group._id || group)
                const isPrimaryAdmin = person.email === "admin@octasence.com"

                return (
                  <div
                    key={person._id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "18px",
                      padding: "1rem",
                      background: "white",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gap: "1rem",
                        gridTemplateColumns: "1.4fr 1fr 1fr",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{person.name}</div>
                        <div style={{ color: "var(--text-light)", marginTop: "0.25rem" }}>{person.email}</div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                          <span className="badge badge-progress">{person.role}</span>
                          <span className="badge badge-secondary">Rank {person.rank}</span>
                          <span className={`badge ${person.isOnline ? "badge-completed" : "badge-pending"}`}>
                            {person.isOnline ? "Online" : "Offline"}
                          </span>
                          <span className="badge badge-secondary">
                            {person.availabilityStatus || "available"}
                          </span>
                          {person.passwordResetRequest?.status === "pending" && (
                            <span className="badge badge-pending">Reset requested</span>
                          )}
                          {(person.groups || []).map((group) => (
                            <span key={group._id || group} className="badge badge-completed">{group.name || "Group"}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: "0.75rem" }}>
                        <div>
                          <label>Role</label>
                          <select
                            className="input"
                            value={person.role}
                            disabled={!isAdmin || isPrimaryAdmin}
                            onChange={(e) => updateLocalUserField(person._id, "role", e.target.value)}
                          >
                            <option value="admin">Admin</option>
                            <option value="founder">Founder</option>
                            <option value="team_lead">Team Lead</option>
                            <option value="employee">Employee</option>
                          </select>
                        </div>

                        <div>
                          <label>Rank</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            className="input"
                            value={person.rank ?? ""}
                            disabled={!isAdmin || isPrimaryAdmin}
                            onChange={(e) => updateLocalUserField(person._id, "rank", Number(e.target.value))}
                          />
                        </div>

                        <div>
                          <label>{person.role === "founder" ? "Founder title" : "Job title"}</label>
                          <input
                            className="input"
                            value={person.role === "founder" ? person.founderTitle || "" : person.jobTitle || ""}
                            onChange={(e) =>
                              updateLocalUserField(
                                person._id,
                                person.role === "founder" ? "founderTitle" : "jobTitle",
                                e.target.value,
                              )
                            }
                            disabled={!isAdmin && user?._id !== person._id}
                            placeholder={person.role === "founder" ? "CEO, CTO, COO..." : "Job title"}
                          />
                        </div>

                        <div>
                          <label>Groups</label>
                          <select
                            className="input"
                            multiple
                            value={selectedGroupIds}
                            disabled={!isAdmin}
                            onChange={(e) =>
                              updateLocalUserField(
                                person._id,
                                "groups",
                                Array.from(e.target.selectedOptions)
                                  .map((option) => groups.find((group) => group._id === option.value))
                                  .filter(Boolean),
                              )
                            }
                            style={{ minHeight: "130px" }}
                          >
                            {groups.map((group) => (
                              <option key={group._id} value={group._id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: "0.85rem" }}>
                        <div
                          style={{
                            padding: "0.85rem",
                            borderRadius: "14px",
                            background: "rgba(15,23,42,0.03)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Founder powers</div>
                          {["manageUsers", "manageTasks", "manageGroups"].map((permissionKey) => (
                            <label
                              key={permissionKey}
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.45rem" }}
                            >
                              <input
                                type="checkbox"
                                checked={!!person.permissions?.[permissionKey]}
                                disabled={!isAdmin || person.role !== "founder"}
                                onChange={(e) => updateLocalPermission(person._id, permissionKey, e.target.checked)}
                              />
                              <span style={{ textTransform: "capitalize" }}>
                                {permissionKey.replace("manage", "Manage ")}
                              </span>
                            </label>
                          ))}
                        </div>

                        <input
                          type="password"
                          className="input"
                          placeholder="Set new password"
                          value={passwordInputs[person._id] || ""}
                          onChange={(e) => setPasswordInputs((prev) => ({ ...prev, [person._id]: e.target.value }))}
                          disabled={!canManageUsers}
                        />

                        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                          {(isAdmin || user?._id === person._id) && (
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => handleSaveUser(person)}
                              disabled={savingUserId === person._id}
                            >
                              {savingUserId === person._id ? "Saving..." : "Save"}
                            </button>
                          )}

                          {canManageUsers && (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => handleAdminPasswordReset(person._id)}
                              disabled={resettingUserId === person._id}
                            >
                              {resettingUserId === person._id ? "Updating..." : "Reset Password"}
                            </button>
                          )}

                          {isAdmin && !isPrimaryAdmin && (
                            <button className="btn btn-danger" type="button" onClick={() => handleDelete(person._id)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ManageUsers

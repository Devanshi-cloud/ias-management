"use client"

import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import Navbar from "../../components/Navbar"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { useAuth } from "../../context/auth-context"

const policyLabels = {
  admin_only: "Only admin can add members",
  group_admins: "Group admins can add members",
  all_members: "Any group member can add members",
}

const GroupWorkspace = () => {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [messages, setMessages] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [canAddMembers, setCanAddMembers] = useState(false)
  const [newMemberIds, setNewMemberIds] = useState([])
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGroupWorkspace()
  }, [id])

  const fetchGroupWorkspace = async () => {
    try {
      setLoading(true)
      const groupResponse = await axiosInstance.get(API_PATHS.GET_GROUP_DETAIL(id))

      setGroup(groupResponse.data.group)
      setMembers(groupResponse.data.members)
      setTasks(groupResponse.data.tasks)
      setMessages(groupResponse.data.messages)
      setAvailableUsers(groupResponse.data.availableUsers || [])
      setCanAddMembers(!!groupResponse.data.canAddMembers)
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Failed to load group workspace")
    } finally {
      setLoading(false)
    }
  }

  const handleGroupSettingChange = (field, value) => {
    setGroup((prev) => ({ ...prev, [field]: value }))
  }

  const toggleGroupAdmin = (userId) => {
    setGroup((prev) => {
      const admins = prev.admins || []
      const exists = admins.some((admin) => admin._id === userId)
      return {
        ...prev,
        admins: exists
          ? admins.filter((admin) => admin._id !== userId)
          : [...admins, members.find((member) => member._id === userId)].filter(Boolean),
      }
    })
  }

  const saveGroupSettings = async () => {
    try {
      setSaving(true)
      setMessage("")
      setError("")
      const response = await axiosInstance.put(API_PATHS.UPDATE_GROUP(id), {
        name: group.name,
        description: group.description,
        memberAddPolicy: group.memberAddPolicy,
        admins: (group.admins || []).map((admin) => admin._id),
      })
      setGroup(response.data)
      setMessage("Group settings saved.")
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save group settings")
    } finally {
      setSaving(false)
    }
  }

  const addMembers = async () => {
    try {
      setSaving(true)
      setMessage("")
      setError("")
      const response = await axiosInstance.post(API_PATHS.ADD_GROUP_MEMBERS(id), {
        memberIds: newMemberIds,
      })
      setMembers(response.data.members)
      setNewMemberIds([])
      setMessage("Members added to group.")
      fetchGroupWorkspace()
    } catch (addError) {
      setError(addError.response?.data?.message || "Failed to add members")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p>Loading group workspace...</p>
        </div>
      </>
    )
  }

  if (!group) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p>Group not found.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ display: "grid", gap: "1.5rem" }}>
        <div className="card">
          <Link to="/admin/manage-users" style={{ color: "var(--primary)", textDecoration: "none" }}>
            ← Back to People & Groups
          </Link>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>{group.name}</h1>
              <p style={{ color: "var(--text-light)", marginTop: "0.4rem" }}>{group.description || "No description"}</p>
            </div>
            <div style={{ display: "grid", gap: "0.35rem", minWidth: "220px" }}>
              <div><strong>Members:</strong> {members.length}</div>
              <div><strong>Tasks:</strong> {tasks.length}</div>
              <div><strong>Messages shown:</strong> {messages.length}</div>
            </div>
          </div>
        </div>

        {(message || error) && (
          <div>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 360px) 1fr", gap: "1.5rem", alignItems: "start" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Group Settings</h2>
            <div style={{ display: "grid", gap: "0.85rem" }}>
              <div>
                <label>Name</label>
                <input
                  className="input"
                  value={group.name || ""}
                  disabled={!isAdmin}
                  onChange={(e) => handleGroupSettingChange("name", e.target.value)}
                />
              </div>

              <div>
                <label>Description</label>
                <textarea
                  className="input"
                  rows="3"
                  value={group.description || ""}
                  disabled={!isAdmin}
                  onChange={(e) => handleGroupSettingChange("description", e.target.value)}
                />
              </div>

              <div>
                <label>Who can add members?</label>
                <select
                  className="input"
                  value={group.memberAddPolicy}
                  disabled={!isAdmin}
                  onChange={(e) => handleGroupSettingChange("memberAddPolicy", e.target.value)}
                >
                  {Object.entries(policyLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Group admins</label>
                <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {members.map((member) => {
                    const checked = (group.admins || []).some((admin) => admin._id === member._id)
                    return (
                      <label key={member._id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!isAdmin}
                          onChange={() => toggleGroupAdmin(member._id)}
                        />
                        <span>{member.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {isAdmin && (
                <button className="btn btn-primary" type="button" onClick={saveGroupSettings} disabled={saving}>
                  {saving ? "Saving..." : "Save Group Settings"}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            <div className="card">
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Members</h2>
              {canAddMembers && (
                <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
                  <label>Add members to this group</label>
                  <select
                    className="input"
                    multiple
                    value={newMemberIds}
                    onChange={(e) => setNewMemberIds(Array.from(e.target.selectedOptions).map((option) => option.value))}
                    style={{ minHeight: "140px" }}
                  >
                  {availableUsers.map((person) => (
                      <option key={person._id} value={person._id}>
                        {person.name} · {person.email}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-secondary" type="button" onClick={addMembers} disabled={saving || newMemberIds.length === 0}>
                    {saving ? "Adding..." : "Add Selected Members"}
                  </button>
                </div>
              )}

              <div style={{ display: "grid", gap: "0.75rem" }}>
                {members.map((member) => (
                  <div
                    key={member._id}
                    style={{
                      padding: "0.9rem 1rem",
                      borderRadius: "14px",
                      border: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{member.name}</div>
                      <div style={{ color: "var(--text-light)", marginTop: "0.25rem" }}>{member.email}</div>
                      <div style={{ color: "var(--text-light)", marginTop: "0.25rem", fontSize: "0.85rem" }}>
                        {member.isOnline ? "Online" : "Offline"} · {member.availabilityStatus || "available"}
                        {member.statusMessage ? ` · ${member.statusMessage}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignContent: "start" }}>
                      <span className="badge badge-progress">{member.role}</span>
                      {member.jobTitle && <span className="badge badge-completed">{member.jobTitle}</span>}
                      {member.founderTitle && <span className="badge badge-completed">{member.founderTitle}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Group Tasks</h2>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {tasks.map((task) => (
                  <Link
                    key={task._id}
                    to={`/admin/task/${task._id}`}
                    style={{
                      padding: "0.95rem 1rem",
                      borderRadius: "14px",
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                      color: "inherit",
                      display: "grid",
                      gap: "0.35rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                      <strong>{task.title}</strong>
                      <span className="badge badge-progress">{task.status}</span>
                    </div>
                    <div style={{ color: "var(--text-light)" }}>
                      Assigned: {task.assignedTo?.map((person) => person.name).join(", ") || "Unassigned"}
                    </div>
                  </Link>
                ))}
                {tasks.length === 0 && <p style={{ color: "var(--text-light)" }}>No tasks for this group yet.</p>}
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Recent Group Chats</h2>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {messages.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      padding: "0.95rem 1rem",
                      borderRadius: "14px",
                      border: "1px solid var(--border)",
                      backgroundColor: "white",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                      <strong>{item.sender?.name || "Unknown user"}</strong>
                      <span style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-light)", marginTop: "0.2rem" }}>
                      Task: {item.taskId?.title || "Unknown task"}
                    </div>
                    <div style={{ marginTop: "0.55rem" }}>{item.text}</div>
                  </div>
                ))}
                {messages.length === 0 && <p style={{ color: "var(--text-light)" }}>No task chats in this group yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GroupWorkspace

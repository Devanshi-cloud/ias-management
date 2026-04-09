"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Navbar from "../../components/Navbar"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { useAuth } from "../../context/auth-context"
import { PlusCircle, Trash2, X } from "lucide-react"
import { priorityOptions } from "../../utils/data"

const CreateTask = () => {
  const { user, isAdmin, canManageTasks } = useAuth()
  const [users, setUsers] = useState([])
  const [canCreateAssignedTasks, setCanCreateAssignedTasks] = useState(false)
  const [canCreateGroupTasks, setCanCreateGroupTasks] = useState(false)
  const [manageableGroups, setManageableGroups] = useState([])
  const [formData, setFormData] = useState({
    taskType: "personal",
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    assignedTo: [],
    group: "",
    attachments: "",
    todoChecklist: [],
  })
  const [selectedUsers, setSelectedUsers] = useState([])
  const [newTodo, setNewTodo] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchAssignableUsers()
  }, [])

  const fetchAssignableUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.GET_ASSIGNABLE_USERS)
      setUsers(response.data.assignableUsers || [])
      setCanCreateAssignedTasks(!!response.data.canCreateAssignedTasks)
      setCanCreateGroupTasks(!!response.data.canCreateGroupTasks)
      setManageableGroups(response.data.manageableGroups || [])
      const preferredTaskType = searchParams.get("taskType")
      const preferredGroupId = searchParams.get("groupId")
      setFormData((prev) => ({
        ...prev,
        taskType:
          preferredTaskType === "group" && response.data.canCreateGroupTasks
            ? "group"
            : response.data.canCreateAssignedTasks
              ? prev.taskType || "assigned"
              : prev.taskType,
        group:
          preferredTaskType === "group" && preferredGroupId
            ? preferredGroupId
            : prev.group,
      }))
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name === "taskType" && value === "personal") {
        setSelectedUsers([])
        return { ...prev, taskType: value, assignedTo: [], group: "" }
      }
      if (name === "taskType" && value === "group") {
        setSelectedUsers([])
        return { ...prev, taskType: value, assignedTo: [], group: prev.group || "" }
      }
      if (name === "taskType" && value === "assigned") {
        return { ...prev, taskType: value, group: "" }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleUserToggle = (userId) => {
    const isSelected = selectedUsers.some(u => u._id === userId)
    let newSelectedUsers

    if (isSelected) {
      newSelectedUsers = selectedUsers.filter(u => u._id !== userId)
    } else {
      const user = users.find(u => u._id === userId)
      newSelectedUsers = [...selectedUsers, user]
    }

    setSelectedUsers(newSelectedUsers)
    setFormData({ ...formData, assignedTo: newSelectedUsers.map(u => u._id) })
  }

  const removeUser = (userId) => {
    const newSelectedUsers = selectedUsers.filter(u => u._id !== userId)
    setSelectedUsers(newSelectedUsers)
    setFormData({ ...formData, assignedTo: newSelectedUsers.map(u => u._id) })
  }

  const addTodoItem = () => {
    if (newTodo.trim()) {
      setFormData({
        ...formData,
        todoChecklist: [...formData.todoChecklist, { text: newTodo, completed: false }],
      })
      setNewTodo("")
    }
  }

  const removeTodoItem = (index) => {
    const updatedChecklist = formData.todoChecklist.filter((_, i) => i !== index)
    setFormData({ ...formData, todoChecklist: updatedChecklist })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (formData.taskType === "assigned" && formData.assignedTo.length === 0) {
      setError("Please assign the task to at least one user")
      return
    }

    if (formData.taskType === "group" && !formData.group) {
      setError("Please select a group for this task")
      return
    }

    setLoading(true)

    try {
      await axiosInstance.post(API_PATHS.CREATE_TASK, formData)
      setSuccess("Task created successfully!")
      setTimeout(() => {
        if (formData.taskType === "group" && formData.group) {
          navigate(`/admin/groups/${formData.group}`)
          return
        }
        navigate(canManageTasks ? "/admin/manage-tasks" : "/user/my-tasks")
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem", color: "var(--text)" }}>
          Create Task
        </h1>

        <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="taskType">Task Type</label>
              <select
                id="taskType"
                name="taskType"
                className="input"
                value={formData.taskType}
                onChange={handleChange}
              >
                <option value="personal">Personal Task</option>
                {canCreateAssignedTasks && <option value="assigned">Assigned Task</option>}
                {canCreateGroupTasks && <option value="group">Group Task</option>}
              </select>
              <small style={{ color: "var(--text-light)", fontSize: "0.75rem" }}>
                Personal tasks stay with you. Assigned tasks go to selected teammates. Group tasks go to every member of a selected group.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="title">Task Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                className="input"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter task title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="input"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Enter task description"
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label htmlFor="priority">Priority *</label>
                <select
                  id="priority"
                  name="priority"
                  className="input"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Due Date *</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  className="input"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {formData.taskType === "group" && (
            <div className="form-group">
              <label htmlFor="group">Select Group *</label>
              <select
                id="group"
                name="group"
                className="input"
                value={formData.group}
                onChange={handleChange}
              >
                <option value="">Choose a group</option>
                {manageableGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <small style={{ color: "var(--text-light)", fontSize: "0.75rem", marginTop: "0.5rem", display: "block" }}>
                This task will be visible to the whole group and assigned to its current members.
              </small>
            </div>
            )}

            {formData.taskType === "assigned" && (
            <div className="form-group">
              <label>Assign To *</label>
              
              {/* Selected Users Display */}
              {selectedUsers.length > 0 && (
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: "0.5rem", 
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  backgroundColor: "var(--background)",
                  borderRadius: "0.375rem"
                }}>
                  {selectedUsers.map((user) => (
                    <div
                      key={user._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.375rem 0.75rem",
                        backgroundColor: "var(--primary)",
                        color: "white",
                        borderRadius: "9999px",
                        fontSize: "0.875rem"
                      }}
                    >
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() => removeUser(user._id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          padding: "0",
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* User Selection List */}
              <div style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid var(--border)",
                borderRadius: "0.375rem",
                padding: "0.5rem"
              }}>
                {users.map((assignableUser) => {
                  const isSelected = selectedUsers.some(u => u._id === assignableUser._id)
                  return (
                    <label
                      key={assignableUser._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem",
                        cursor: "pointer",
                        borderRadius: "0.375rem",
                        backgroundColor: isSelected ? "var(--background)" : "transparent",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "var(--background)"
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleUserToggle(assignableUser._id)}
                        style={{ cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                        {assignableUser.profileImageUrl ? (
                          <img
                            src={assignableUser.profileImageUrl}
                            alt={assignableUser.name}
                            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
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
                              {assignableUser.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: "500" }}>{assignableUser.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                            {assignableUser.email}
                            {isAdmin && assignableUser.rank ? ` · Rank ${assignableUser.rank}` : ""}
                          </div>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
              <small style={{ color: "var(--text-light)", fontSize: "0.75rem", marginTop: "0.5rem", display: "block" }}>
                Select one or more teammates for this task
              </small>
            </div>
            )}

            <div className="form-group">
              <label htmlFor="attachments">Attachments URL</label>
              <input
                type="text"
                id="attachments"
                name="attachments"
                className="input"
                value={formData.attachments}
                onChange={handleChange}
                placeholder="Enter attachment URL"
              />
            </div>

            <div className="form-group">
              <label>Todo Checklist</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="text"
                  className="input"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Add a todo item"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTodoItem())}
                />
                <button
                  type="button"
                  onClick={addTodoItem}
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <PlusCircle size={16} />
                  Add
                </button>
              </div>

              {formData.todoChecklist.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  {formData.todoChecklist.map((todo, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem",
                        backgroundColor: "var(--background)",
                        borderRadius: "0.25rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span>{todo.text}</span>
                      <button
                        type="button"
                        onClick={() => removeTodoItem(index)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
              </button>
              <button type="button" onClick={() => navigate("/admin/manage-tasks")} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default CreateTask

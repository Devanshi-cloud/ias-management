"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "../../components/Navbar"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { PlusCircle, Trash2 } from "lucide-react"
import { priorityOptions, statusOptions } from "../../utils/data"

const EditTask = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Pending",
    dueDate: "",
    assignedTo: [],
    attachments: "",
    todoChecklist: [],
  })
  const [newTodo, setNewTodo] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingTask, setFetchingTask] = useState(true)

  useEffect(() => {
    fetchUsers()
    fetchTaskDetails()
  }, [id])

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.GET_USERS)
      setUsers(response.data)
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchTaskDetails = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.GET_TASK_BY_ID(id))
      const task = response.data
      
      // Format the date for the input field (YYYY-MM-DD)
      const formattedDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""
      
      // Extract user IDs from assignedTo array
      const assignedUserIds = Array.isArray(task.assignedTo) 
        ? task.assignedTo.map(user => user._id || user)
        : [task.assignedTo?._id || task.assignedTo]
      
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "Medium",
        status: task.status || "Pending",
        dueDate: formattedDate,
        assignedTo: assignedUserIds.filter(Boolean),
        attachments: task.attachments || "",
        todoChecklist: task.todoChecklist || [],
      })
    } catch (error) {
      console.error("Error fetching task details:", error)
      setError("Failed to load task details")
    } finally {
      setFetchingTask(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleUserSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
    setFormData({ ...formData, assignedTo: selectedOptions })
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

  const toggleTodoItem = (index) => {
    const updatedChecklist = formData.todoChecklist.map((item, i) =>
      i === index ? { ...item, completed: !item.completed } : item
    )
    setFormData({ ...formData, todoChecklist: updatedChecklist })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (formData.assignedTo.length === 0) {
      setError("Please assign the task to at least one user")
      return
    }

    setLoading(true)

    try {
      await axiosInstance.put(API_PATHS.UPDATE_TASK(id), formData)
      setSuccess("Task updated successfully!")
      setTimeout(() => {
        navigate("/admin/manage-tasks")
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      try {
        await axiosInstance.delete(API_PATHS.DELETE_TASK(id))
        navigate("/admin/manage-tasks")
      } catch (error) {
        console.error("Error deleting task:", error)
        setError("Failed to delete task")
      }
    }
  }

  if (fetchingTask) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p>Loading task details...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem", color: "var(--text)" }}>
          Edit Task
        </h1>

        <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <form onSubmit={handleSubmit}>
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
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  className="input"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
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

            <div className="form-group">
              <label htmlFor="assignedTo">Assign To *</label>
              <select
                id="assignedTo"
                name="assignedTo"
                className="input"
                multiple
                value={formData.assignedTo}
                onChange={handleUserSelect}
                required
                style={{ minHeight: "120px" }}
              >
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <small style={{ color: "var(--text-light)", fontSize: "0.75rem" }}>
                Hold Ctrl/Cmd to select multiple users
              </small>
            </div>

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
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodoItem(index)}
                          style={{ cursor: "pointer" }}
                        />
                        <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
                          {todo.text}
                        </span>
                      </div>
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
                {loading ? "Updating..." : "Update Task"}
              </button>
              <button 
                type="button" 
                onClick={handleDelete} 
                className="btn" 
                style={{ backgroundColor: "var(--danger)", color: "white" }}
              >
                Delete Task
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

export default EditTask
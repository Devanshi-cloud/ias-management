"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/Navbar"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { Edit, Trash2, Eye, PlusCircle } from "lucide-react"
import { formatDate, formatDateTime, getPriorityColor, getStatusColor } from "../../utils/helper"

const columns = ["Pending", "In Progress", "Completed"]

const ManageTasks = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [selectedAssignee, setSelectedAssignee] = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.GET_TASKS)
      setTasks(response.data.tasks || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) {
      return
    }

    try {
      await axiosInstance.delete(API_PATHS.DELETE_TASK(taskId))
      fetchTasks()
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("Failed to delete task")
    }
  }

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const byQuery = !normalizedQuery
      ? tasks
      : tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description || "").toLowerCase().includes(normalizedQuery),
    )

    if (selectedAssignee === "all") return byQuery
    return byQuery.filter((task) => (task.assignedTo || []).some((person) => person._id === selectedAssignee))
  }, [tasks, query, selectedAssignee])

  const assigneeProgress = useMemo(() => {
    const map = new Map()

    tasks.forEach((task) => {
      ;(task.assignedTo || []).forEach((person) => {
        if (!person?._id) return
        if (!map.has(person._id)) {
          map.set(person._id, {
            _id: person._id,
            name: person.name,
            totalTasks: 0,
            completedTasks: 0,
            averageProgress: 0,
          })
        }

        const current = map.get(person._id)
        current.totalTasks += 1
        current.averageProgress += Number(task.progress || 0)
        if (task.status === "Completed") current.completedTasks += 1
      })
    })

    return Array.from(map.values())
      .map((person) => ({
        ...person,
        averageProgress: person.totalTasks ? Math.round(person.averageProgress / person.totalTasks) : 0,
      }))
      .sort((a, b) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name))
  }, [tasks])

  const groupedTasks = useMemo(
    () =>
      columns.map((status) => ({
        status,
        tasks: filteredTasks.filter((task) => task.status === status),
      })),
    [filteredTasks],
  )

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p>Loading tasks...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ display: "grid", gap: "1.5rem" }}>
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(30,64,175,0.08), rgba(14,165,233,0.04))",
            border: "1px solid rgba(148,163,184,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text)" }}>Task Board</h1>
              <p style={{ color: "var(--text-light)", marginTop: "0.5rem" }}>
                Track every task by stage and jump into details without leaving the board.
              </p>
            </div>
            <button onClick={() => navigate("/admin/create-task")} className="btn btn-primary">
              <PlusCircle size={16} style={{ marginRight: "0.4rem" }} />
              Create Task
            </button>
          </div>

          <div
            style={{
              marginTop: "1rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.85rem",
            }}
          >
            {columns.map((status) => {
              const count = tasks.filter((task) => task.status === status).length
              return (
                <div
                  key={status}
                  style={{
                    padding: "1rem",
                    borderRadius: "16px",
                    backgroundColor: "white",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>{status}</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "0.25rem" }}>{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 260px", gap: "1rem" }}>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks by title or description"
            />
            <select className="input" value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)}>
              <option value="all">All assignees</option>
              {assigneeProgress.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {assigneeProgress.map((person) => (
            <button
              key={person._id}
              type="button"
              onClick={() => setSelectedAssignee(person._id)}
              className="card"
              style={{
                textAlign: "left",
                border: selectedAssignee === person._id ? "1px solid rgba(59,130,246,0.45)" : "1px solid var(--border)",
                background: selectedAssignee === person._id ? "rgba(59,130,246,0.05)" : "white",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700 }}>{person.name}</div>
              <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.3rem", fontSize: "0.9rem" }}>
                <div><strong>Total tasks:</strong> {person.totalTasks}</div>
                <div><strong>Completed:</strong> {person.completedTasks}</div>
                <div><strong>Average progress:</strong> {person.averageProgress}%</div>
              </div>
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
            alignItems: "start",
          }}
        >
          {groupedTasks.map((column) => (
            <div
              key={column.status}
              style={{
                display: "grid",
                gap: "0.85rem",
                alignContent: "start",
                minHeight: "420px",
                padding: "1rem",
                borderRadius: "18px",
                background: "linear-gradient(180deg, rgba(248,250,252,1), rgba(241,245,249,0.85))",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{column.status}</h2>
                <span className={`badge ${getStatusColor(column.status)}`}>{column.tasks.length}</span>
              </div>

              {column.tasks.map((task) => (
                <div
                  key={task._id}
                  style={{
                    borderRadius: "16px",
                    backgroundColor: "white",
                    border: "1px solid rgba(148,163,184,0.2)",
                    padding: "1rem",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>{task.title}</div>
                      <div style={{ color: "var(--text-light)", marginTop: "0.35rem", fontSize: "0.9rem" }}>
                        {task.description || "No description"}
                      </div>
                    </div>
                    <span className={`badge ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                  </div>

                  <div style={{ marginTop: "1rem", display: "grid", gap: "0.4rem", fontSize: "0.9rem" }}>
                    <div>
                      <strong>Due:</strong> {formatDate(task.dueDate)}
                    </div>
                    <div>
                      <strong>Assigned:</strong> {formatDateTime(task.assignedAt || task.createdAt)}
                    </div>
                    <div>
                      <strong>Assignees:</strong>{" "}
                      {task.assignedTo?.length ? task.assignedTo.map((item) => item.name).join(", ") : "Unassigned"}
                    </div>
                    <div>
                      <strong>Progress:</strong> {task.progress || 0}%
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <button className="btn btn-secondary" type="button" onClick={() => navigate(`/admin/task/${task._id}`)}>
                      <Eye size={16} />
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => navigate(`/admin/edit-task/${task._id}`)}>
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-danger" type="button" onClick={() => handleDelete(task._id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {column.tasks.length === 0 && (
                <div
                  style={{
                    borderRadius: "16px",
                    border: "1px dashed var(--border)",
                    padding: "1.2rem",
                    color: "var(--text-light)",
                    backgroundColor: "rgba(255,255,255,0.6)",
                  }}
                >
                  No tasks in this column.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ManageTasks

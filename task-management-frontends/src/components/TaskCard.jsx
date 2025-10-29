"use client"
import { useNavigate } from "react-router-dom"
import { Calendar, Users, CheckCircle2 } from "lucide-react"
import { formatDate, getPriorityColor, getStatusColor, isOverdue } from "../utils/helper"

const TaskCard = ({ task, onClick }) => {
  const navigate = useNavigate()
  const overdue = isOverdue(task.dueDate, task.status)

  const handleClick = () => {
    if (onClick) {
      onClick(task)
    } else {
      navigate(`/user/task/${task._id}`)
    }
  }

  const renderAssignedUsers = (assignedTo) => {
    if (!assignedTo || (Array.isArray(assignedTo) && assignedTo.length === 0)) {
      return <span style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>Unassigned</span>
    }

    const users = Array.isArray(assignedTo) ? assignedTo : [assignedTo]
    
    if (users.length === 1) {
      const user = users[0]
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Users size={16} />
          <span>{user.name}</span>
        </div>
      )
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Users size={16} />
        <div style={{ display: "flex", marginLeft: "-4px" }}>
          {users.slice(0, 3).map((user, index) => (
            user.profileImageUrl ? (
              <img
                key={user._id}
                src={user.profileImageUrl}
                alt={user.name}
                title={user.name}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginLeft: index > 0 ? "-6px" : "0",
                  border: "2px solid white",
                  position: "relative",
                  zIndex: 3 - index
                }}
              />
            ) : (
              <div
                key={user._id}
                title={user.name}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.625rem",
                  fontWeight: "600",
                  marginLeft: index > 0 ? "-6px" : "0",
                  border: "2px solid white",
                  position: "relative",
                  zIndex: 3 - index
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )
          ))}
        </div>
        <span style={{ fontSize: "0.875rem" }}>
          {users.length > 3 ? `+${users.length - 3} more` : `${users.length} users`}
        </span>
      </div>
    )
  }

  return (
    <div
      className="card"
      style={{ 
        cursor: "pointer", 
        transition: "transform 0.2s, box-shadow 0.2s", 
        border: overdue ? "2px solid var(--danger)" : "none" 
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.1)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 1px 3px 0 rgb(0 0 0 / 0.1)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "var(--text)", flex: 1 }}>{task.title}</h3>
        <span className={`badge ${getPriorityColor(task.priority)}`}>{task.priority}</span>
      </div>

      <p style={{ color: "var(--text-light)", fontSize: "0.875rem", marginBottom: "1rem", lineHeight: "1.5" }}>
        {task.description?.substring(0, 100)}...
      </p>

      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--text-light)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={16} />
          <span>{formatDate(task.dueDate)}</span>
        </div>
        {task.assignedTo && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {renderAssignedUsers(task.assignedTo)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className={`badge ${getStatusColor(task.status)}`}>{task.status}</span>
        {task.todoChecklist && task.todoChecklist.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              color: "var(--text-light)",
            }}
          >
            <CheckCircle2 size={16} />
            <span>
              {task.todoChecklist.filter((item) => item.completed).length}/{task.todoChecklist.length}
            </span>
          </div>
        )}
      </div>

      {overdue && (
        <div style={{ 
          marginTop: "0.75rem", 
          color: "var(--danger)", 
          fontSize: "0.75rem", 
          fontWeight: "600",
          padding: "0.5rem",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderRadius: "0.375rem",
          textAlign: "center"
        }}>
          ⚠️ OVERDUE
        </div>
      )}
    </div>
  )
}

export default TaskCard
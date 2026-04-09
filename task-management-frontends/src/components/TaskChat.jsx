"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import axiosInstance from "../utils/axiosInstance"
import { API_PATHS } from "../utils/apiPaths"
import { useAuth } from "../context/auth-context"

const TaskChat = ({ taskId }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchMessages()
  }, [taskId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.GET_TASK_MESSAGES(taskId))
      setMessages(response.data)
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return

    setSending(true)
    try {
      const response = await axiosInstance.post(API_PATHS.SEND_TASK_MESSAGE(taskId), { text })
      setMessages((prev) => [...prev, response.data])
      setText("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " · " +
      date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const availabilityText = (sender) => {
    const status = sender?.availabilityStatus || "available"
    const label = status === "on_leave" ? "On leave" : status.charAt(0).toUpperCase() + status.slice(1)
    return `${sender?.isOnline ? "Online" : "Offline"} · ${label}${sender?.statusMessage ? ` · ${sender.statusMessage}` : ""}`
  }

  return (
    <div
      style={{
        marginTop: "2rem",
        border: "1px solid var(--border)",
        borderRadius: "1rem",
        overflow: "hidden",
        boxShadow: "0 10px 24px rgb(15 23 42 / 0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "#f0f2f5",
          fontWeight: "600",
          fontSize: "1rem",
        }}
      >
        Task Chat
      </div>

      {/* Messages */}
      <div
        className="chat-thread"
        style={{
          height: "320px",
          overflowY: "auto",
          padding: "1rem 1rem 0.9rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {loading ? (
          <p style={{ color: "var(--text-light)", textAlign: "center", marginTop: "auto" }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: "var(--text-light)", textAlign: "center", marginTop: "auto" }}>
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender._id === user?._id
            return (
              <div
                key={msg._id}
                className={`chat-message-row ${isOwn ? "own" : "other"}`}
              >
                <div className={`chat-bubble ${isOwn ? "outgoing" : "incoming"}`}>
                  {!isOwn && (
                    <div className="chat-bubble-title" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <span>{msg.sender.name}</span>
                      {msg.sender.role === "admin" && (
                        <span
                          style={{
                            fontSize: "0.63rem",
                            backgroundColor: "var(--primary)",
                            color: "white",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "9999px",
                          }}
                        >
                          Admin
                        </span>
                      )}
                    </div>
                  )}
                  {!isOwn && (
                    <div style={{ fontSize: "0.68rem", color: "var(--text-light)", marginBottom: "0.3rem" }}>
                      {availabilityText(msg.sender)}
                    </div>
                  )}
                  <div>{msg.text}</div>
                  <div className="chat-bubble-meta">
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="chat-composer"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="input"
          style={{ flex: 1 }}
          disabled={sending}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!text.trim() || sending}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.8rem 1.1rem", borderRadius: "9999px" }}
        >
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  )
}

export default TaskChat

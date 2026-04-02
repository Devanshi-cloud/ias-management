"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import axiosInstance from "../utils/axiosInstance"
import { API_PATHS } from "../utils/apiPaths"
import { useAuth } from "../context/AuthContext"

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

  return (
    <div
      style={{
        marginTop: "2rem",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--background)",
          fontWeight: "600",
          fontSize: "1rem",
        }}
      >
        Task Chat
      </div>

      {/* Messages */}
      <div
        style={{
          height: "320px",
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          backgroundColor: "white",
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isOwn ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    marginBottom: "0.25rem",
                    flexDirection: isOwn ? "row-reverse" : "row",
                  }}
                >
                  {msg.sender.profileImageUrl ? (
                    <img
                      src={msg.sender.profileImageUrl}
                      alt={msg.sender.name}
                      style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                        flexShrink: 0,
                      }}
                    >
                      {msg.sender.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: "0.75rem", color: "var(--text-light)", fontWeight: "500" }}>
                    {isOwn ? "You" : msg.sender.name}
                    {msg.sender.role === "admin" && (
                      <span
                        style={{
                          marginLeft: "0.3rem",
                          fontSize: "0.65rem",
                          backgroundColor: "var(--primary)",
                          color: "white",
                          padding: "0.1rem 0.3rem",
                          borderRadius: "0.2rem",
                        }}
                      >
                        Admin
                      </span>
                    )}
                  </span>
                </div>
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "0.6rem 0.875rem",
                    borderRadius: isOwn ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                    backgroundColor: isOwn ? "var(--primary)" : "var(--background)",
                    color: isOwn ? "white" : "var(--text)",
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-light)", marginTop: "0.2rem" }}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          borderTop: "1px solid var(--border)",
          backgroundColor: "var(--background)",
        }}
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
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem" }}
        >
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  )
}

export default TaskChat

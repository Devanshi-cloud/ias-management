"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Navbar from "../../components/Navbar"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { useAuth } from "../../context/auth-context"
import { SendHorizontal, Trash2 } from "lucide-react"

const statusLabel = {
  available: "Available",
  away: "Away",
  on_leave: "On leave",
}

const PresenceDot = ({ online }) => (
  <span
    style={{
      width: "10px",
      height: "10px",
      borderRadius: "9999px",
      backgroundColor: online ? "#22c55e" : "#94a3b8",
      display: "inline-block",
      flexShrink: 0,
    }}
  />
)

const Chats = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [directoryUsers, setDirectoryUsers] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState("")
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [messageLoading, setMessageLoading] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef(null)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  )

  useEffect(() => {
    fetchInbox()
    const intervalId = window.setInterval(fetchInbox, 15000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId)
    } else {
      setMessages([])
    }
  }, [selectedConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, selectedConversationId])

  const fetchInbox = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.CHAT_INBOX)
      setConversations(response.data.conversations || [])
      setDirectoryUsers(response.data.directoryUsers || [])
      if (!selectedConversationId && response.data.conversations?.length) {
        setSelectedConversationId(response.data.conversations[0]._id)
      }
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Failed to load inbox")
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      setMessageLoading(true)
      const response = await axiosInstance.get(API_PATHS.GET_CONVERSATION_MESSAGES(conversationId))
      setMessages(response.data)
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Failed to load messages")
    } finally {
      setMessageLoading(false)
    }
  }

  const startDirectChat = async (participantId) => {
    try {
      const response = await axiosInstance.post(API_PATHS.START_DIRECT_CHAT, { participantId })
      const exists = conversations.some((conversation) => conversation._id === response.data._id)
      const nextConversations = exists
        ? conversations.map((conversation) => (conversation._id === response.data._id ? response.data : conversation))
        : [response.data, ...conversations]
      setConversations(nextConversations)
      setSelectedConversationId(response.data._id)
    } catch (startError) {
      setError(startError.response?.data?.message || "Failed to start chat")
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!selectedConversationId || !text.trim()) return

    try {
      const response = await axiosInstance.post(API_PATHS.SEND_CONVERSATION_MESSAGE(selectedConversationId), {
        text,
      })
      setMessages((prev) => [...prev, response.data])
      setText("")
      fetchInbox()
    } catch (sendError) {
      setError(sendError.response?.data?.message || "Failed to send message")
    }
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversationId || !selectedConversation) return
    if (!window.confirm(`Remove "${getConversationTitle(selectedConversation)}" from your inbox?`)) {
      return
    }

    try {
      await axiosInstance.delete(API_PATHS.DELETE_CONVERSATION_FOR_SELF(selectedConversationId))
      const remainingConversations = conversations.filter((conversation) => conversation._id !== selectedConversationId)
      setConversations(remainingConversations)
      setSelectedConversationId(remainingConversations[0]?._id || "")
      setMessages([])
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to remove chat")
    }
  }

  const getConversationTitle = (conversation) => {
    if (conversation.type === "group") {
      return conversation.group?.name || conversation.title || "Group Chat"
    }
    return conversation.counterpart?.name || "Direct Chat"
  }

  const getConversationSubtitle = (conversation) => {
    if (conversation.type === "group") {
      return `${conversation.participants?.length || 0} members`
    }
    if (!conversation.counterpart) return ""
    return `${statusLabel[conversation.counterpart.availabilityStatus] || "Available"}${conversation.counterpart.statusMessage ? ` · ${conversation.counterpart.statusMessage}` : ""}`
  }

  const formatMessageTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <>
      <Navbar />
      <div className="container" style={{ display: "grid", gap: "1.5rem" }}>
        <div
          className="chat-shell"
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            minHeight: "72vh",
            overflow: "hidden",
          }}
        >
          <div className="chat-sidebar" style={{ borderRight: "1px solid var(--border)", display: "grid", alignContent: "start" }}>
            <div style={{ padding: "1rem 1rem 0.75rem", borderBottom: "1px solid var(--border)" }}>
              <h1 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Chats</h1>
              <p style={{ color: "var(--text-light)", marginTop: "0.35rem" }}>
                Direct chats and group chats in one place.
              </p>
            </div>

            <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>Recent chats</h2>
              <div style={{ display: "grid", gap: "0.65rem" }}>
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation._id)}
                    className={`chat-list-item ${selectedConversationId === conversation._id ? "active" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <PresenceDot online={conversation.type === "group" ? true : !!conversation.counterpart?.isOnline} />
                      <strong>{getConversationTitle(conversation)}</strong>
                    </div>
                    <div style={{ color: "var(--text-light)", marginTop: "0.35rem", fontSize: "0.85rem" }}>
                      {getConversationSubtitle(conversation)}
                    </div>
                  </button>
                ))}
                {!conversations.length && !loading && (
                  <p style={{ color: "var(--text-light)" }}>No chats yet. Start one from the directory below.</p>
                )}
              </div>
            </div>

            <div style={{ padding: "1rem" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>People directory</h2>
              <div style={{ display: "grid", gap: "0.6rem", maxHeight: "280px", overflowY: "auto" }}>
                {directoryUsers.map((person) => (
                  <button
                    key={person._id}
                    type="button"
                    onClick={() => startDirectChat(person._id)}
                    className="chat-list-item"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <PresenceDot online={person.isOnline} />
                      <strong>{person.name}</strong>
                    </div>
                    <div style={{ color: "var(--text-light)", marginTop: "0.3rem", fontSize: "0.85rem" }}>
                      {person.email}
                    </div>
                    <div style={{ color: "var(--text-light)", marginTop: "0.25rem", fontSize: "0.8rem" }}>
                      {statusLabel[person.availabilityStatus] || "Available"}
                      {person.statusMessage ? ` · ${person.statusMessage}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: 0 }}>
            {selectedConversation ? (
              <>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", background: "#f0f2f5" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <PresenceDot online={selectedConversation.type === "group" ? true : !!selectedConversation.counterpart?.isOnline} />
                      <strong>{getConversationTitle(selectedConversation)}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteConversation}
                      className="btn btn-secondary"
                      style={{ borderRadius: "9999px", padding: "0.65rem 0.9rem", display: "flex", alignItems: "center", gap: "0.45rem" }}
                    >
                      <Trash2 size={15} />
                      Delete for me
                    </button>
                  </div>
                  <div style={{ color: "var(--text-light)", marginTop: "0.35rem", fontSize: "0.9rem" }}>
                    {selectedConversation.type === "group"
                      ? `Group chat · ${(selectedConversation.participants || []).length} participants`
                      : getConversationSubtitle(selectedConversation)}
                  </div>
                </div>

                <div className="chat-thread" style={{ padding: "1rem 1.1rem", overflowY: "auto", display: "grid", gap: "0.5rem" }}>
                  {messageLoading ? (
                    <p style={{ color: "var(--text-light)" }}>Loading messages...</p>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.sender?._id === user?._id
                      return (
                        <div key={message._id} className={`chat-message-row ${isOwn ? "own" : "other"}`}>
                          <div className={`chat-bubble ${isOwn ? "outgoing" : "incoming"}`}>
                            {!isOwn && (
                              <div className="chat-bubble-title">
                                {message.sender?.name}
                              </div>
                            )}
                            <div>{message.text}</div>
                            <div className="chat-bubble-meta">
                              <span>{formatMessageTime(message.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="chat-composer">
                  <input
                    className="input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message"
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" type="submit" style={{ borderRadius: "9999px", padding: "0.8rem 1.1rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <SendHorizontal size={16} />
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: "grid", placeItems: "center", color: "var(--text-light)" }}>
                Select or start a chat.
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    </>
  )
}

export default Chats

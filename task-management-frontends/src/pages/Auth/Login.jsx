"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/auth-context"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { LogIn } from "lucide-react"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("")
  const [forgotPasswordError, setForgotPasswordError] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const userData = await login(formData.email, formData.password)
      // Redirect based on role
      if (
        userData.role === "admin" ||
        userData.role === "founder" ||
        userData.role === "team_lead" ||
        userData.permissions?.manageTasks ||
        userData.permissions?.manageUsers ||
        userData.permissions?.manageGroups
      ) {
        navigate("/admin/dashboard")
      } else {
        navigate("/user/dashboard")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotPasswordError("")
    setForgotPasswordMessage("")
    setForgotPasswordLoading(true)

    try {
      const response = await axiosInstance.post(API_PATHS.FORGOT_PASSWORD, {
        email: forgotPasswordEmail,
      })
      setForgotPasswordMessage(response.data.message)
      setForgotPasswordEmail("")
    } catch (err) {
      setForgotPasswordError(err.response?.data?.message || "Failed to send reset request.")
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <LogIn size={48} style={{ color: "var(--primary)", margin: "0 auto" }} />
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", marginTop: "1rem", color: "var(--text)" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-light)", marginTop: "0.5rem" }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-0.25rem", marginBottom: "0.75rem" }}>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword((prev) => !prev)
                setForgotPasswordError("")
                setForgotPasswordMessage("")
                setForgotPasswordEmail(formData.email)
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--primary)",
                cursor: "pointer",
                fontWeight: "600",
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {showForgotPassword && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              backgroundColor: "var(--surface, #fff)",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem", color: "var(--text)" }}>Request password reset</h3>
            <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              This sends a request to the admin console so an admin can set a new password for you.
            </p>
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="forgotPasswordEmail">Email</label>
                <input
                  type="email"
                  id="forgotPasswordEmail"
                  name="forgotPasswordEmail"
                  className="input"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  placeholder="Enter your account email"
                />
              </div>

              {forgotPasswordError && <div className="error-message">{forgotPasswordError}</div>}
              {forgotPasswordMessage && <div className="success-message">{forgotPasswordMessage}</div>}

              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: "100%" }}
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? "Sending request..." : "Send Reset Request"}
              </button>
            </form>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-light)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--primary)", fontWeight: "600" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login

"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/auth-context"
import { UserPlus } from "lucide-react"

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee",
    founderTitle: "",
    jobTitle: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!formData.email.trim().toLowerCase().endsWith("@octasence.com")) {
      setError("Only @octasence.com email addresses are allowed")
      return
    }

    if (formData.role === "founder" && !formData.founderTitle.trim()) {
      setError("Founder title is required for founder signups")
      return
    }

    setLoading(true)

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        founderTitle: formData.role === "founder" ? formData.founderTitle : undefined,
        jobTitle: formData.jobTitle || undefined,
      }

      const newUser = await register(userData)

      // Redirect based on role
      if (
        newUser.role === "admin" ||
        newUser.role === "founder" ||
        newUser.role === "team_lead" ||
        newUser.permissions?.manageTasks ||
        newUser.permissions?.manageUsers ||
        newUser.permissions?.manageGroups
      ) {
        navigate("/admin/dashboard")
      } else {
        navigate("/user/dashboard")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <UserPlus size={48} style={{ color: "var(--primary)", margin: "0 auto" }} />
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", marginTop: "1rem", color: "var(--text)" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--text-light)", marginTop: "0.5rem" }}>
            Use your Octasence work email to create an employee or founder account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

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
            <small style={{ color: "var(--text-light)", fontSize: "0.75rem" }}>
              Only @octasence.com email addresses are allowed
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              name="role"
              className="input"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="employee">Employee</option>
              <option value="founder">Founder</option>
            </select>
          </div>

          {formData.role === "founder" ? (
            <div className="form-group">
              <label htmlFor="founderTitle">Founder Role</label>
              <input
                type="text"
                id="founderTitle"
                name="founderTitle"
                className="input"
                value={formData.founderTitle}
                onChange={handleChange}
                required={formData.role === "founder"}
                placeholder="CEO, CTO, COO, etc."
              />
              <small style={{ color: "var(--text-light)", fontSize: "0.75rem" }}>
                Sign up with the title you want displayed. Permissions are still granted by the admin.
              </small>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                className="input"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="Designer, Engineer, Ops, etc."
              />
            </div>
          )}

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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-light)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignUp

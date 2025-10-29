"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { UserPlus, Upload } from "lucide-react"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthday: "",
    iasPosition: "",
    adminInviteToken: "",
  })
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const iasPositions = [
    "COMMUNICATION",
    "FINANCE",
    "DESIGN AND MEDIA",
    "TECH",
    "HOSPITALITY",
    "Other"
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }
      setProfileImage(file)
      setImagePreview(URL.createObjectURL(file))
      setError("")
    }
  }

  const uploadProfileImage = async () => {
    if (!profileImage) return null

    try {
      const formData = new FormData()
      formData.append("image", profileImage)

      const response = await axiosInstance.post(API_PATHS.UPLOAD_IMAGE, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      return response.data.imageUrl
    } catch (err) {
      console.error("Error uploading image:", err)
      throw new Error("Failed to upload profile picture")
    }
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

    setLoading(true)

    try {
      let profileImageUrl = null
      if (profileImage) {
        profileImageUrl = await uploadProfileImage()
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        birthday: formData.birthday || null,
        iasPosition: formData.iasPosition || null,
        profileImageUrl,
        adminInviteToken: formData.adminInviteToken || undefined,
      }

      const newUser = await register(userData)

      if (newUser.role === "admin") {
        navigate("/admin/dashboard")
      } else {
        navigate("/user/dashboard")
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: "500px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <UserPlus size={48} style={{ color: "var(--primary)", margin: "0 auto" }} />
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", marginTop: "1rem", color: "var(--text)" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--text-light)", marginTop: "0.5rem" }}>Sign up to get started</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile Picture Upload */}
          <div className="form-group" style={{ textAlign: "center" }}>
            <label style={{ display: "block", marginBottom: "1rem" }}>Profile Picture (Optional)</label>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "var(--background)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed var(--border)"
                  }}
                >
                  <Upload size={32} style={{ color: "var(--text-light)" }} />
                </div>
              )}
              <label
                htmlFor="profileImage"
                className="btn btn-secondary"
                style={{ cursor: "pointer", display: "inline-block" }}
              >
                Choose Image
              </label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
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
            <label htmlFor="email">Email *</label>
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
            <label htmlFor="birthday">Birthday (Optional)</label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              className="input"
              value={formData.birthday}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="iasPosition">IAS Position (Optional)</label>
            <select
              id="iasPosition"
              name="iasPosition"
              className="input"
              value={formData.iasPosition}
              onChange={handleChange}
            >
              <option value="">Select Position</option>
              {iasPositions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
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
            <label htmlFor="confirmPassword">Confirm Password *</label>
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

          <div className="form-group">
            <label htmlFor="adminInviteToken">Admin Invite Token (Optional)</label>
            <input
              type="text"
              id="adminInviteToken"
              name="adminInviteToken"
              className="input"
              value={formData.adminInviteToken}
              onChange={handleChange}
              placeholder="Enter admin token if you have one"
            />
            <small style={{ color: "var(--text-light)", fontSize: "0.75rem" }}>
              Leave blank to register as a regular user
            </small>
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
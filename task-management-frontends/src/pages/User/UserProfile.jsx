"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"
import axiosInstance from "../../utils/axiosInstance"
import { API_PATHS } from "../../utils/apiPaths"
import { Upload, User as UserIcon, Save, Calendar, Briefcase } from "lucide-react"

const UserProfile = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthday: "",
    iasPosition: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const iasPositions = [
    "COMMUNICATION",
    "FINANCE",
    "DESIGN AND MEDIA",
    "TECH",
    "HOSPITALITY",
    "Other"
  ]

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "",
        iasPosition: user.iasPosition || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setImagePreview(user.profileImageUrl || null)
    }
  }, [user])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate password if trying to change it
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Current password is required to set a new password")
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords do not match")
        return
      }
      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters")
        return
      }
    }

    setLoading(true)

    try {
      const updateData = new FormData();
      updateData.append("name", formData.name);
      updateData.append("email", formData.email);
      updateData.append("birthday", formData.birthday || null);
      updateData.append("iasPosition", formData.iasPosition || null);

      if (profileImage) {
        updateData.append("profileImage", profileImage);
      }

      if (formData.newPassword) {
        updateData.append("password", formData.newPassword);
      }

      const response = await axiosInstance.put(API_PATHS.UPDATE_PROFILE(user._id), updateData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      updateUser(response.data)
      setSuccess("Profile updated successfully!")
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem", color: "var(--text)" }}>
          My Profile
        </h1>

        <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <form onSubmit={handleSubmit}>
            {/* Profile Picture Upload */}
            <div className="form-group" style={{ textAlign: "center", marginBottom: "2rem" }}>
              <label style={{ display: "block", marginBottom: "1rem", fontWeight: "600" }}>Profile Picture</label>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary)" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "3rem",
                      fontWeight: "700"
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <label
                  htmlFor="profileImage"
                  className="btn btn-secondary"
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <Upload size={16} />
                  Change Picture
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
              <label htmlFor="birthday">
                <Calendar size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                Birthday
              </label>
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
              <label htmlFor="iasPosition">
                <Briefcase size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                IAS Position
              </label>
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

            <hr style={{ margin: "2rem 0", border: "none", borderTop: "1px solid var(--border)" }} />

            <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>Change Password</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-light)", marginBottom: "1rem" }}>
              Leave blank if you don't want to change your password
            </p>

            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                className="input"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="input"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}
              >
                <Save size={16} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default UserProfile
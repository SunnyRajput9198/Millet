import { useState, useEffect } from "react"
import { User, Mail, Phone, Calendar, MapPin, Edit2, Save, X, Shield, Package, Heart, Clock } from "lucide-react"
import { getValidAccessToken } from "../utils/tokenRefresh"

interface UserProfile {
  id: string
  email: string
  username?: string
  phone?: string
  role: string
  emailVerified: boolean
  isActive: boolean
  avatarUrl?: string
  dateOfBirth?: string
  createdAt: string
  updatedAt: string
}

export function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    dateOfBirth: ""
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (data.success && data.data) {
        setUser(data.data)
        setFormData({
          username: data.data.username || "",
          phone: data.data.phone || "",
          dateOfBirth: data.data.dateOfBirth ? data.data.dateOfBirth.split('T')[0] : ""
        })
      } else {
        setError("Failed to load profile")
      }
    } catch (err) {
      setError("Error loading profile")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError("")
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Profile updated successfully!")
        setEditing(false)
        fetchUserProfile()
        
        // Update localStorage user data
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          localStorage.setItem("user", JSON.stringify({ ...userData, ...formData }))
        }
      } else {
        setError(data.message || "Failed to update profile")
      }
    } catch (err) {
      setError("Error updating profile")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setFormData({
      username: user?.username || "",
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : ""
    })
    setError("")
    setSuccess("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load profile</p>
          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Profile</h1>
              <p className="text-green-100">Manage your account information</p>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-5xl font-bold">
                  {user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {user.username || "User"}
              </h2>
              
              <p className="text-gray-600 text-sm mb-4">{user.email}</p>
              
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                <span>{user.role}</span>
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">Member Since</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">Email Verified</span>
                  <span className={`text-sm font-medium ${user.emailVerified ? 'text-green-600' : 'text-orange-600'}`}>
                    {user.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 text-sm">Account Status</span>
                  <span className={`text-sm font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="/orders" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">My Orders</span>
                </a>
                <a href="/wishlist" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <Heart className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Wishlist</span>
                </a>
                <a href="/recently-viewed" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Recently Viewed</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Username */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    <span>Username</span>
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your username"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {user.username || "Not set"}
                    </div>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed">
                    {user.email}
                    <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {user.phone || "Not set"}
                    </div>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Date of Birth</span>
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {user.dateOfBirth ? formatDate(user.dateOfBirth) : "Not set"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Section */}
            {user.role === "ADMIN" && (
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-lg p-6 mt-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Admin Access</h3>
                </div>
                <p className="text-green-100 mb-4">
                  You have administrator privileges. Access the admin panel to manage products, categories, and users.
                </p>
                <a
                  href="/admin"
                  className="inline-block px-6 py-3 bg-white text-green-700 rounded-lg font-medium hover:bg-green-50 transition"
                >
                  Go to Admin Panel →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Search, Loader, Ban, CheckCircle } from "lucide-react"
import { getValidAccessToken } from "../../utils/tokenRefresh"

interface User {
  id: string
  email: string
  username: string
  role: string
  isActive: boolean
  totalOrders: number
  totalSpent: number
  createdAt: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const accessToken = await getValidAccessToken()

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(roleFilter && { role: roleFilter }),
        ...(search && { search }),
      })

      const response = await fetch(`http://localhost:8000/api/v1/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()

      if (data.success) {
        setUsers(data.data.users)
        setTotalPages(data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const accessToken = await getValidAccessToken()

      const response = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      const data = await response.json()

      if (data.success) {
        fetchUsers()
      } else {
        alert(data.message || "Failed to update user status")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user status")
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return
    }

    try {
      const accessToken = await getValidAccessToken()

      const response = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (data.success) {
        fetchUsers()
      } else {
        alert(data.message || "Failed to update user role")
      }
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Failed to update user role")
    }
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-amber-50 via-emerald-50 to-green-50 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-emerald-900 font-playfair">Users Management</h1>
          <p className="text-emerald-700 mt-2 text-lg">Manage all registered community members</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600" />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchUsers()}
              className="w-full pl-10 pr-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 text-emerald-900 placeholder-emerald-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50 text-amber-900 font-medium"
          >
            <option value="">All Roles</option>
            <option value="USER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Orders</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Total Spent</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-emerald-900">{user.username || "N/A"}</div>
                        <div className="text-sm text-emerald-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                            user.role === "ADMIN"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          <option value="USER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-900">{user.totalOrders}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                        ₹{user.totalSpent.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.isActive
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-red-100 text-red-800 border border-red-300"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-emerald-600">
                        {new Date(user.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={`p-2 rounded-lg transition ${
                            user.isActive ? "hover:bg-red-100 text-red-600" : "hover:bg-green-100 text-green-600"
                          }`}
                          title={user.isActive ? "Deactivate" : "Activate"}
                        >
                          {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-emerald-100 flex items-center justify-between bg-emerald-50/30">
              <div className="text-sm font-semibold text-emerald-700">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border-2 border-emerald-300 rounded-lg hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 font-medium transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border-2 border-emerald-300 rounded-lg hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 font-medium transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

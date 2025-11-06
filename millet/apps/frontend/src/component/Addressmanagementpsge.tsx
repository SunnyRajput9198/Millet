"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MapPin, Plus, Edit2, Trash2, Home, Building, X, Save, Star, Leaf } from "lucide-react"
import { getValidAccessToken } from "../utils/tokenRefresh"

interface Address {
  id: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  country: string
  postalCode: string
  isDefault: boolean
  type?: string | null
  createdAt: string
  updatedAt: string
}

interface AddressFormData {
  name: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
  isDefault: boolean
  type: string
}

export function AddressManagementPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState<AddressFormData>({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    isDefault: false,
    type: "HOME",
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/addresses", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()

      if (data.success) {
        setAddresses(data.data)
      } else {
        setError("Failed to load addresses")
      }
    } catch (err) {
      setError("Error loading addresses")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    })
    setError("")
  }

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
      isDefault: false,
      type: "HOME",
    })
    setShowForm(false)
    setEditingId(null)
    setError("")
    setSuccess("")
  }

  const handleSubmit = async () => {
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.addressLine1.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.country.trim() ||
      !formData.postalCode.trim()
    ) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const url = editingId
        ? `http://localhost:8000/api/v1/addresses/${editingId}`
        : "http://localhost:8000/api/v1/addresses"

      const method = editingId ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingId ? "Address updated successfully!" : "Address added successfully!")
        resetForm()
        fetchAddresses()
      } else {
        setError(data.message || "Failed to save address")
      }
    } catch (err) {
      setError("Error saving address")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (address: Address) => {
    setFormData({
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
      type: address.type || "HOME",
    })
    setEditingId(address.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return

    try {
      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Address deleted successfully!")
        fetchAddresses()
      } else {
        setError(data.message || "Failed to delete address")
      }
    } catch (err) {
      setError("Error deleting address")
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-green-50 to-white">
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-white">
          <Leaf className="w-40 h-40 rotate-45" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <MapPin className="w-8 h-8" />
                <h1 className="text-4xl font-bold">My Delivery Addresses</h1>
              </div>
              <p className="text-emerald-100 text-lg">Manage your farm-to-home delivery locations</p>
            </div>
            <a href="/profile" className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition font-medium">
              ← Back to Profile
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {success && (
          <div className="mb-6 bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 text-emerald-800 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <Leaf className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg shadow-sm">
            {error}
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition shadow-lg hover:shadow-xl font-semibold text-lg"
          >
            <Plus className="w-6 h-6" />
            <span>Add New Delivery Address</span>
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-emerald-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {editingId ? "Edit Your Address" : "Add New Delivery Address"}
              </h2>
              <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-emerald-50/50"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-emerald-50/50"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Address Line 1 *</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-emerald-50/50"
                  placeholder="House No., Street Name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-emerald-50/50"
                  placeholder="Apartment, Suite, Landmark"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-emerald-50/50"
                    placeholder="Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-emerald-50/50"
                    placeholder="Maharashtra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-emerald-50/50"
                    placeholder="400001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-emerald-50/50"
                  placeholder="India"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Address Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-emerald-50/50"
                  >
                    <option value="HOME">Home</option>
                    <option value="WORK">Work</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex items-center pt-9">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">Set as default delivery address</label>
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition disabled:opacity-50 font-semibold"
                >
                  <Save className="w-5 h-5" />
                  <span>{submitting ? "Saving..." : editingId ? "Update Address" : "Save Address"}</span>
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-emerald-100">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-full">
                <MapPin className="w-16 h-16 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Delivery Addresses Yet</h3>
            <p className="text-gray-600 mb-8 text-lg">
              Add your first address to start receiving fresh, farm-sourced products
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Address</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-8 relative border-2 ${
                  address.isDefault
                    ? "border-emerald-500 bg-gradient-to-br from-white to-emerald-50"
                    : "border-gray-200"
                }`}
              >
                {address.isDefault && (
                  <div className="absolute top-4 right-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-full text-xs font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Default Address</span>
                  </div>
                )}

                <div className="flex items-start space-x-4 mb-6">
                  <div className={`p-4 rounded-xl ${address.type === "WORK" ? "bg-amber-100" : "bg-emerald-100"}`}>
                    {address.type === "WORK" ? (
                      <Building
                        className={`w-7 h-7 ${address.type === "WORK" ? "text-amber-600" : "text-emerald-600"}`}
                      />
                    ) : (
                      <Home className={`w-7 h-7 ${address.type === "WORK" ? "text-amber-600" : "text-emerald-600"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{address.name}</h3>
                      <span className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-xs font-semibold rounded-full">
                        {address.type || "HOME"}
                      </span>
                    </div>
                    <p className="text-gray-600 font-medium flex items-center space-x-1">
                      <span>📱</span>
                      <span>{address.phone}</span>
                    </p>
                  </div>
                </div>

                <div className="mb-6 text-gray-700 space-y-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="font-medium">{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p className="text-sm">
                    {address.city}, {address.state} <span className="font-semibold">{address.postalCode}</span>
                  </p>
                  <p className="text-sm text-gray-600">{address.country}</p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition font-semibold"
                  >
                    <Edit2 className="w-5 h-5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-red-400 text-red-600 rounded-lg hover:bg-red-50 transition font-semibold"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

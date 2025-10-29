import { useState, useEffect } from "react"
import { MapPin, Plus, Edit2, Trash2, Home, Building, X, Save, Star } from "lucide-react"
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
    type: "HOME"
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
        headers: { Authorization: `Bearer ${accessToken}` }
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
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
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
      type: "HOME"
    })
    setShowForm(false)
    setEditingId(null)
    setError("")
    setSuccess("")
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.addressLine1.trim() || 
        !formData.city.trim() || !formData.state.trim() || !formData.country.trim() || 
        !formData.postalCode.trim()) {
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
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
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
      type: address.type || "HOME"
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
        headers: { Authorization: `Bearer ${accessToken}` }
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
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Addresses</h1>
              <p className="text-green-100">Manage your delivery addresses</p>
            </div>
            <a
              href="/profile"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              ← Back to Profile
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
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

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Address</span>
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? "Edit Address" : "Add New Address"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="House No., Street Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Apartment, Suite, Landmark"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Maharashtra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="400001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="India"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="HOME">Home</option>
                    <option value="WORK">Work</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Set as default address
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? "Saving..." : editingId ? "Update Address" : "Save Address"}</span>
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No addresses saved</h3>
            <p className="text-gray-600 mb-6">Add your first delivery address to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Address</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl shadow-lg p-6 relative ${
                  address.isDefault ? "ring-2 ring-green-500" : ""
                }`}
              >
                {address.isDefault && (
                  <div className="absolute top-4 right-4 flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Default</span>
                  </div>
                )}

                <div className="flex items-start space-x-4 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    {address.type === "WORK" ? (
                      <Building className="w-6 h-6 text-green-600" />
                    ) : (
                      <Home className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{address.name}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {address.type || "HOME"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{address.phone}</p>
                  </div>
                </div>

                <div className="mb-4 text-gray-700 text-sm space-y-1">
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
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
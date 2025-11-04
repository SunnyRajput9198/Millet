import { Settings as SettingsIcon, Save } from 'lucide-react'

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your store settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Settings Page</h3>
          <p className="text-gray-600 mb-6">
            Configure your store settings, payment methods, shipping options, and more.
          </p>
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react';
import { Settings, Save, Trash2, Plus, RefreshCw } from 'lucide-react';
import { getValidAccessToken } from '../utils/tokenRefresh';

// Types
interface Setting {
  id: string;
  key: string;
  value: string;
  group: 'GENERAL' | 'PAYMENT' | 'SHIPPING' | 'EMAIL';
  createdAt: string;
  updatedAt: string;
}

const SettingsManagement = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    group: 'GENERAL' as const
  });

  const groups = ['ALL', 'GENERAL', 'PAYMENT', 'SHIPPING', 'EMAIL'];

  // Fetch settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const accessToken = await getValidAccessToken();
      
      // FIX 1: Use backticks for template literals
      const url = selectedGroup === 'ALL' 
        ? `http://localhost:8000/api/v1/settings`
        : `http://localhost:8000/api/v1/settings/group/${selectedGroup}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data.data.settings);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      alert(`Failed to load settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create setting
  const createSetting = async () => {
    if (!newSetting.key || !newSetting.value) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const accessToken = await getValidAccessToken();
      const response = await fetch(`http://localhost:8000/api/v1/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSetting)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create setting');
      }

      setNewSetting({ key: '', value: '', group: 'GENERAL' });
      setShowAddForm(false);
      fetchSettings();
      alert('Setting created successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Update setting
  const updateSetting = async (key: string) => {
    try {
      const accessToken = await getValidAccessToken();
      
      // FIX 2: Use backticks for template literals
      const response = await fetch(`http://localhost:8000/api/v1/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: editValue })
      });

      if (!response.ok) throw new Error('Failed to update setting');

      setEditingKey(null);
      setEditValue('');
      fetchSettings();
      alert('Setting updated successfully!');
    } catch (error: any) {
      alert(`Failed to update setting: ${error.message}`);
    }
  };

  // Delete setting
  const deleteSetting = async (key: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;

    try {
      const accessToken = await getValidAccessToken();
      
      // FIX 3: Use backticks for template literals
      const response = await fetch(`http://localhost:8000/api/v1/settings/${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete setting');

      fetchSettings();
      alert('Setting deleted successfully!');
    } catch (error: any) {
      alert(`Failed to delete setting: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [selectedGroup]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Settings Management</h1>
                <p className="text-gray-600">Manage your application settings</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Setting
            </button>
          </div>
        </div>

        {/* Add Setting Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Setting</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Key (e.g., stripe_api_key)"
                value={newSetting.key}
                onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Value"
                value={newSetting.value}
                onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newSetting.group}
                onChange={(e) => setNewSetting({...newSetting, group: e.target.value as any})}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GENERAL">GENERAL</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="SHIPPING">SHIPPING</option>
                <option value="EMAIL">EMAIL</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={createSetting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Setting
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedGroup === group
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {group}
              </button>
            ))}
            <button
              onClick={fetchSettings}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Settings List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading settings...</div>
          ) : settings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No settings found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settings.map((setting) => (
                    <tr key={setting.key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">{setting.key}</span>
                      </td>
                      <td className="px-6 py-4">
                        {editingKey === setting.key ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm text-gray-700">{setting.value}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          setting.group === 'PAYMENT' ? 'bg-green-100 text-green-800' :
                          setting.group === 'EMAIL' ? 'bg-blue-100 text-blue-800' :
                          setting.group === 'SHIPPING' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {setting.group}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(setting.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingKey === setting.key ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => updateSetting(setting.key)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingKey(null);
                                setEditValue('');
                              }}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingKey(setting.key);
                                setEditValue(setting.value);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteSetting(setting.key)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-600">
          Total Settings: {settings.length}
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;
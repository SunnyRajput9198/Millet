import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader, FolderTree, AlertTriangle } from 'lucide-react'
import { categoryAPI, type Category } from '../../api/categories'
import { getValidAccessToken } from '../../utils/tokenRefresh'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await categoryAPI.getAll()
      // Filter to show only parent categories (no parentId)
      const parentCategories = data.filter(cat => !cat.parentId)
      setCategories(parentCategories)
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      setError(err.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return

    setIsDeleting(true)
    try {
      const accessToken = await getValidAccessToken()
      
      const response = await fetch(
        `http://localhost:8000/api/v1/categories/${deletingCategory.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const data = await response.json()
      
      if (data.success) {
        setCategories(categories.filter(c => c.id !== deletingCategory.id))
        setShowDeleteDialog(false)
        setDeletingCategory(null)
      } else {
        alert(data.message || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={fetchCategories}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600 mt-1">Organize your products into categories</p>
        </div>
        
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-600">Total Categories</div>
          <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-600">With Images</div>
          <div className="text-2xl font-bold text-green-600">
            {categories.filter(c => c.image).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-600">With Subcategories</div>
          <div className="text-2xl font-bold text-blue-600">
            {categories.filter(c => c.children && c.children.length > 0).length}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No categories found</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Add Your First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition group"
            >
              {category.image ? (
                <div className="relative">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <h3 className="absolute bottom-4 left-4 font-bold text-white text-xl">
                    {category.name}
                  </h3>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-green-100 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <FolderTree className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <h3 className="font-bold text-gray-900 text-xl">{category.name}</h3>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {category.description || 'No description available'}
                </p>
                
                {category.children && category.children.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {category.children.length} subcategories
                    </span>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => alert('Edit functionality - Navigate to edit page')}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Category</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                "{deletingCategory?.name}"
              </span>
              ? This action cannot be undone and will permanently remove the category.
              {deletingCategory?.children && deletingCategory.children.length > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This category has {deletingCategory.children.length} subcategories that will also be affected.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false)
                setDeletingCategory(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

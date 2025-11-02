import { useState, useEffect } from "react";
import { X, Upload, Plus, Trash2, Image } from "lucide-react";
 import { getValidAccessToken } from '../utils/tokenRefresh'
interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ImageInput {
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    comparePrice: "",
    stock: "",
    sku: "",
    categoryId: "",
    tags: "",
  });

  const [images, setImages] = useState<ImageInput[]>([
    { url: "", alt: "", isPrimary: true, order: 0 }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchCategories();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const accessToken = await getValidAccessToken() // Changed this line
      if (!accessToken) {
        setIsAdmin(false);
        return;
      }
      const response = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (data.success && data.data.role === "ADMIN") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (index: number, field: keyof ImageInput, value: string | boolean | number) => {
    setImages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addImageField = () => {
    setImages(prev => [...prev, {
      url: "",
      alt: "",
      isPrimary: false,
      order: prev.length
    }]);
  };

  const removeImageField = (index: number) => {
    if (images.length > 1) {
      setImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (formData.name.length < 3) newErrors.name = "Name must be at least 3 characters";
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required";
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = "Valid stock is required";
    const validImages = images.filter(img => img.url.trim());
    if (validImages.length === 0) {
      newErrors.images = "At least one image is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async () => {
  
  if (!validateForm()) return;
  setLoading(true);
  setSuccessMessage("");

  try {
    // Get the access token from localStorage
  const accessToken = await getValidAccessToken() // Changed this line
    
    if (!accessToken) {
      throw new Error("You must be logged in to add products");
    }

    const productPayload = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
      stock: parseInt(formData.stock),
      sku: formData.sku || undefined,
      categoryId: formData.categoryId || undefined,
      tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : undefined,
    };

    // ADD AUTHORIZATION HEADER HERE
    const productResponse = await fetch("http://localhost:8000/api/v1/products", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}` // ⭐ ADD THIS LINE
      },
      body: JSON.stringify(productPayload),
    });

    const productData = await productResponse.json();
    if (!productResponse.ok || !productData.success) {
      throw new Error(productData.message || "Failed to create product");
    }

    const productId = productData.data.id;
    const validImages = images.filter(img => img.url.trim());
    
    // ALSO ADD AUTHORIZATION TO IMAGE UPLOADS
    for (const image of validImages) {
      await fetch(`http://localhost:8000/api/v1/products/${productId}/images`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}` // ⭐ ADD THIS LINE TOO
        },
        body: JSON.stringify({
          url: image.url,
          alt: image.alt || formData.name,
          isPrimary: image.isPrimary,
          order: image.order,
        }),
      });
    }

    setSuccessMessage("Product added successfully! 🎉");
    setTimeout(() => {
      resetForm();
      onClose();
    }, 2000);
  } catch (error: any) {
    setErrors({ submit: error.message || "Failed to add product" });
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", comparePrice: "", stock: "", sku: "", categoryId: "", tags: "" });
    setImages([{ url: "", alt: "", isPrimary: true, order: 0 }]);
    setErrors({});
    setSuccessMessage("");
  };

  return (
    <>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
              <h2 className="text-2xl font-bold text-[#264653]">Add New Product</h2>
              <button onClick={() => onClose()} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                  {successMessage}
                </div>
              )}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  {errors.submit}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#264653]">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent"
                      placeholder="e.g., Premium Raw Makhana"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent"
                      placeholder="e.g., MAKHANA-001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent resize-none"
                    placeholder="Describe your product..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#264653]">Pricing & Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent"
                      placeholder="299"
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price (₹)</label>
                    <input
                      type="number"
                      name="comparePrice"
                      value={formData.comparePrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent"
                      placeholder="399"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent"
                      placeholder="100"
                    />
                    {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#264653]">Category & Tags</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent"
                      placeholder="bestseller, organic, premium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#264653]">Product Images</h3>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-sm bg-[#2a9d8f] text-white px-3 py-1 rounded-lg hover:bg-[#264653] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Image
                  </button>
                </div>
                {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}
                {images.map((image, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-[#2a9d8f]" />
                        <span className="font-medium text-gray-700">Image {index + 1}</span>
                        {image.isPrimary && (
                          <span className="text-xs bg-[#2a9d8f] text-white px-2 py-1 rounded">Primary</span>
                        )}
                      </div>
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={image.url}
                          onChange={(e) => handleImageChange(index, "url", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                          <input
                            type="text"
                            value={image.alt}
                            onChange={(e) => handleImageChange(index, "alt", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent"
                            placeholder="Product image description"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className={`w-full px-4 py-2 rounded-lg transition-colors ${
                              image.isPrimary
                                ? "bg-[#2a9d8f] text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {image.isPrimary ? "Primary Image" : "Set as Primary"}
                          </button>
                        </div>
                      </div>
                      {image.url && (
                        <div className="mt-2">
                          <img
                            src={image.url}
                            alt={image.alt || "Preview"}
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => onClose()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-[#2a9d8f] text-white rounded-lg hover:bg-[#264653] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Add Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
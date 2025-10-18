import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Star, ShoppingCart, ArrowRight } from "lucide-react";
import { productAPI, type Product } from "../api/products";
import { categoryAPI, type Category } from "../api/categories";

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both products and categories
        const [productsResponse, categoriesData] = await Promise.all([
          productAPI.getAll(),
          categoryAPI.getAll(),
        ]);

        setProducts(productsResponse.data);
        setCategories(categoriesData);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.error || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products by category
  const handleCategoryFilter = async (categorySlug: string | null) => {
    try {
      setLoading(true);
      setSelectedCategory(categorySlug);

      if (categorySlug) {
        const response = await productAPI.getByCategory(categorySlug);
        setProducts(response.data);
      } else {
        const response = await productAPI.getAll();
        setProducts(response.data);
      }
    } catch (err: any) {
      console.error("Error filtering products:", err);
      setError(err.response?.data?.error || "Failed to filter products");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-15 bg-[#d97706]/30">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24">
          <div className="text-center">
            <p className="text-lg text-[#39485C]">Loading products...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-15 bg-[#d97706]/30">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24">
          <div className="text-center">
            <p className="text-lg text-red-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-[#2a9d8f] hover:bg-[#264653]"
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-15 bg-[#d97706]/30">
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        {/* Heading */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-playfair text-3xl lg:text-4xl font-bold text-[#264653]">
            Our Product Portfolio
          </h2>
          <p className="text-lg text-[#39485C] max-w-2xl mx-auto">
            Nature's perfect snacks, reimagined for modern lifestyles
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => handleCategoryFilter(null)}
              className={
                selectedCategory === null
                  ? "bg-[#2a9d8f] hover:bg-[#264653]"
                  : "border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
              }
            >
              All Products
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                onClick={() => handleCategoryFilter(category.slug)}
                className={
                  selectedCategory === category.slug
                    ? "bg-[#2a9d8f] hover:bg-[#264653]"
                    : "border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {products.map((product) => (
            <Card
              key={product.id}
              className="group hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.badge && (
                  <Badge
                    className={`absolute top-4 left-4 ${
                      product.badge === "BESTSELLER"
                        ? "bg-[#2a9d8f] text-white"
                        : "bg-[#264653] text-white"
                    }`}
                  >
                    {product.badge}
                  </Badge>
                )}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Out of Stock</span>
                  </div>
                )}
              </div>

              <CardContent className="p-6 space-y-4 flex flex-col flex-grow">
                <div className="space-y-2">
                  <h3 className="font-semibold text-xl">{product.name}</h3>
                  <p className="text-sm text-[#2a9d8f] font-medium">
                    {product.category}
                  </p>
                  <p className="text-sm text-[#39485C] line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-[#39485C]">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="space-x-2">
                    <span className="text-xl font-bold text-[#264653]">
                      {product.price}
                    </span>
                    {product.comparePrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.comparePrice}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#2a9d8f] hover:bg-[#264653] text-white"
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Coming Soon Card */}
          <Card className="group flex flex-col overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-8 flex-grow">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#F4C542] to-[#FFB74D] text-white text-3xl font-bold mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300">
                +
              </div>
              <div className="text-[#264653] font-semibold text-lg mb-1">
                Coming Soon
              </div>
              <p className="text-[#39485C] mt-2 text-sm text-center max-w-xs">
                More delicious snacks are on the way! Stay tuned for exciting new
                flavors.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white transition-colors duration-300"
          >
            Explore All Products
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
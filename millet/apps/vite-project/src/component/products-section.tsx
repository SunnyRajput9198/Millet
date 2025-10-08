import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Card, CardContent } from "../components/ui/card"
import { Star, ShoppingCart, ArrowRight } from "lucide-react"

export function ProductsSection() {
  const products = [
    {
      id: 1,
      name: "Raw Premium Makhana",
      tagline: "Pure, Crunchy, Wholesome",
      description: "Handpicked from clean wetlands of Bihar & UP. Perfect for roasting or cooking.",
      price: "₹299",
      originalPrice: "₹399",
      rating: 4.8,
      reviews: 156,
      image: "/premium-raw-makhana-fox-nuts-in-clear-package.jpg",
      badge: "BESTSELLER",
    },
    {
      id: 2,
      name: "Flavoured Makhana",
      tagline: "Snack Smart, Snack Tasty",
      description: "Available in Tangy Masala, Peri-Peri, and Cheese Burst variants.",
      price: "₹349",
      originalPrice: "₹449",
      rating: 4.7,
      reviews: 203,
      image: "/flavored-makhana-snacks-in-colorful-packaging.jpg",
      badge: "NEW",
    },
    {
      id: 3,
      name: "Millet Snacks",
      tagline: "Ancient Grains, Modern Taste",
      description: "Healthy blend of roasted millets, seasoned to perfection.",
      price: "₹279",
      originalPrice: "₹349",
      rating: 4.6,
      reviews: 89,
      image: "/roasted-millet-snacks-mix-in-organic-packaging.jpg",
    },
    {
      id: 4,
      name: "Makhana Biscuits",
      tagline: "Biscuits Reimagined",
      description: "India's first makhana-based biscuits with millet flour and jaggery.",
      price: "₹199",
      originalPrice: "₹249",
      rating: 4.9,
      reviews: 67,
      image: "/healthy-makhana-biscuits-in-eco-friendly-package.jpg",
      badge: "INNOVATIVE",
    },
    {
      id: 5,
      name: "Makhana Energy Bars",
      tagline: "Power On-the-Go",
      description: "Protein-packed bars with makhana, millet flakes, nuts, and natural sweeteners.",
      price: "₹399",
      originalPrice: "₹499",
      rating: 4.8,
      reviews: 124,
      badge: "PROTEIN+",
      image: "/protein-energy-bars-with-makhana-and-nuts.jpg",
    },
  ]

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
                    className={`absolute top-4 left-4 ${product.badge === "BESTSELLER"
                        ? "bg-[#2a9d8f] text-white"
                        : "bg-[#264653] text-white"
                      }`}
                  >
                    {product.badge}
                  </Badge>
                )}
              </div>

              <CardContent className="p-6 space-y-4 flex flex-col flex-grow">
                <div className="space-y-2">
                  <h3 className="font-semibold text-xl">{product.name}</h3>
                  <p className="text-sm text-[#2a9d8f] font-medium">{product.tagline}</p>
                  <p className="text-sm text-[#39485C]">{product.description}</p>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(product.rating)
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
                    <span className="text-xl font-bold text-[#264653]">{product.price}</span>
                    <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                  </div>
                  <Button size="sm" className="bg-[#2a9d8f] hover:bg-[#264653] text-white">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Empty Coming Soon Card */}
          <Card className="group flex flex-col overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-8 flex-grow">
              {/* Plus Circle */}
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#F4C542] to-[#FFB74D] text-white text-3xl font-bold mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300">
                +
              </div>
              {/* Title */}
              <div className="text-[#264653] font-semibold text-lg mb-1">Coming Soon</div>
              {/* Description */}
              <p className="text-[#39485C] mt-2 text-sm text-center max-w-xs">
                More delicious snacks are on the way! Stay tuned for exciting new flavors.
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
  )
}

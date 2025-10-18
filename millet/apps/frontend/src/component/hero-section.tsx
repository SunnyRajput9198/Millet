import { Button } from "../components/ui/button"
import { useEffect, useState } from "react"
import { Badge } from "../components/ui/badge"
import { Star, ArrowRight, Leaf, Shield, Heart } from "lucide-react"

export function HeroSection() {
  // Array of images to rotate
  const images = [
    "/premium-makhana-fox-nuts-package-with-organic-bran.jpg",
    "/suvria-makhana-with-fitness-equipments.jpg",
  ]

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Rotate image every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 4000)

    return () => clearInterval(interval) // cleanup
  }, [images.length])

  return (
    <section className="relative overflow-hidden  bg-[#d97706]/20">
      <div className="absolute inset-0 farm-pattern opacity-30"></div>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 pt-12 lg:pt-20 pb-20 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-10 lg:space-y-12">
              <Badge className="w-fit bg-gradient-to-r from-[#2a9d8f] to-[#264653] text-white shadow-md">
                <Leaf className="w-3 h-3 mr-1" />
                Premium Organic Makhana
              </Badge>
              <h1 className="font-playfair text-4xl lg:text-6xl font-bold text-balance leading-tight">
                Healthy Snacking, <span className="text-[#2a9d8f]">Purely Natural</span> – Without Compromising
                <span className="text-[#2a9d8f]"> Taste</span>
              </h1>
              <p className="text-lg text-[#39485C] text-pretty max-w-2xl">
                Time-starved professionals, fitness lovers, and families all look for snacks that are both nutritious
                and satisfying. Nature Millets brings you gluten-free, protein-rich, high-fiber makhana and millet
                snacks that power your day, naturally.
              </p>
            </div>
            {/* Trust Indicators */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-[#f4c542]" />
                ))}
                <span className="text-sm text-[#39485C] ml-2">Trusted by 2,500+ customers</span>
              </div>
            </div>
            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">Lab-tested Purity</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-destructive" />
                <span className="text-sm font-medium">Zero Cholesterol</span>
              </div>
              <div className="flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">9g Plant Protein</span>
              </div>
            </div>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-base bg-[#d97706] hover:bg-[#b45309] text-white"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base border-[#264653] text-[#264653] hover:bg-[#2a9d8f] hover:border-[#2a9d8f] hover:text-white"
              >
                Learn Benefits
              </Button>
            </div>
          </div>
          {/* Right Content - Product Image */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-[#264653] to-[#2a9d8f] rounded-3xl p-10 sm:p-12 lg:p-16">
              {/* 👇 Fixed 16:9 ratio container */}
              <div className="w-full aspect-video relative rounded-2xl overflow-hidden shadow-2xl">
                {images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Makhana ${i}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${i === currentImageIndex ? "opacity-100" : "opacity-0"
                      }`}
                  />
                ))}
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-[#f4c542] text-[#39485C] px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                Zero Additives
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#2a9d8f] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                Farm Fresh
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

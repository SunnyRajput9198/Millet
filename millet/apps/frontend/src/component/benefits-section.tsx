import { Leaf, Droplet, Heart, Sun, Wheat } from "lucide-react"

export function BenefitsSection() {
  const benefits = [
    {
      icon: Leaf,
      title: "Plant Protein",
      description: "9g per serving of nutrient-rich plant protein",
    },
    {
      icon: Droplet,
      title: "Low Glycemic",
      description: "Stable energy, diabetic-friendly snacking",
    },
    {
      icon: Heart,
      title: "Zero Cholesterol",
      description: "Heart-healthy snacks for daily well-being",
    },
    {
      icon: Sun,
      title: "High Antioxidants",
      description: "Supports immunity & overall health",
    },
    {
      icon: Wheat,
      title: "Rich in Fiber",
      description: "Boosts digestion & helps weight management",
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-[#FAF9F6]">
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        {/* Heading */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-playfair text-3xl lg:text-4xl font-bold text-[#264653]">
            Why Choose Nature Millets?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#2a9d8f] to-[#264653] mx-auto rounded-full"></div>
          <p className="text-lg text-[#39485C] max-w-2xl mx-auto">
            Ancient superfoods crafted for your modern lifestyle
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-lg hover:shadow-2xl hover:scale-105 transition-transform duration-300"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-gradient-to-br from-[#2a9d8f]/20 to-[#264653]/20">
                <benefit.icon className="w-8 h-8 text-[#2a9d8f]" />
              </div>

              {/* Title & Description */}
              <h3 className="font-semibold text-xl text-[#264653]">{benefit.title}</h3>
              <p className="text-sm text-[#39485C]">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

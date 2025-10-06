import { Badge } from "../components/ui/badge"
import { Star } from "lucide-react"

export function NutritionComparison() {
  const comparisons = [
    { nutrient: "Calories", makhana: "347 kcal", potato: "536 kcal" },
    { nutrient: "Protein", makhana: "9.7g", potato: "7g" },
    { nutrient: "Fat", makhana: "0.1g", potato: "34g" },
    { nutrient: "Cholesterol", makhana: "0mg", potato: "0mg" },
  ]

  return (
    <section className="relative py-20 bg-[#d97706]/30 overflow-hidden">
      {/* Decorative Soft Circles */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-tr from-[#fff3e0] to-[#ffe0b2] rounded-full opacity-40 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-br from-[#ffe0b2] to-[#fff3e0] rounded-full opacity-30 blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-6 sm:px-12 lg:px-24 relative z-10">
        {/* Heading */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-playfair text-3xl lg:text-4xl font-bold text-[#264653]">
            Why Nutritionists Recommend Makhana
          </h2>
          <p className="text-lg text-[#39485C] max-w-2xl mx-auto">
            The ancient superfood your modern lifestyle needs
          </p>
        </div>

        {/* Comparison Card */}
        <div className="max-w-4xl mx-auto relative">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-gray-200 relative overflow-hidden">
            {/* Floating Icons */}
            <Star className="absolute top-6 left-6 w-8 h-8 text-[#ffb74d]/40 animate-pulse" />
            <Star className="absolute bottom-6 right-10 w-12 h-12 text-[#ffb74d]/30 animate-pulse delay-200" />
            <Star className="absolute top-16 right-20 w-6 h-6 text-[#ffb74d]/20 animate-pulse delay-400" />

            {/* Top Comparison Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="text-center">
                <Badge className="mb-4 bg-[#2a9d8f] text-white px-4 py-2 rounded-full shadow-lg">
                  Low Glycemic
                </Badge>
                <h3 className="text-2xl font-bold mb-2 text-[#264653]">Makhana</h3>
                <p className="text-[#39485C]">Nature's Energy</p>
              </div>
              <div className="text-center">
                <Badge className="mb-4 bg-[#264653] text-white px-4 py-2 rounded-full shadow-lg">
                  High Glycemic
                </Badge>
                <h3 className="text-2xl font-bold mb-2 text-[#264653]">Potato Chips</h3>
                <p className="text-[#39485C]">Processed Snacks</p>
              </div>
            </div>

            {/* Nutrient Table */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-[#264653]">
                  How Suvria Fox Nuts Compare
                </h4>
              </div>

              {comparisons.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200 last:border-b-0"
                >
                  <div className="font-medium text-[#264653]">{item.nutrient}</div>
                  <div className="text-center font-semibold text-[#2a9d8f]">{item.makhana}</div>
                  <div className="text-center text-[#39485C]">{item.potato}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-[#39485C]/80 italic">
                * Per 100g serving. Source: USDA Food Database
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

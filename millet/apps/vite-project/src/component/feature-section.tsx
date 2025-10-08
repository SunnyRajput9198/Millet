import { Clock, Zap, Users } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Clock,
      title: "No Time For Meal Prep",
      description: "Between meetings and deadlines, preparing healthy snacks is often impossible.",
    },
    {
      icon: Zap,
      title: "Mid-Day Energy Crashes",
      description: "Processed snacks lead to sugar spikes followed by productivity-killing energy crashes.",
    },
    {
      icon: Users,
      title: "Contradicting Health Advice",
      description: "So many 'superfood' claims, sourcing quality items is exhausting.",
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-[#fef9f4]">
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        {/* Section Heading */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-playfair text-3xl lg:text-4xl font-bold text-[#264653]">
            We Understand Your Struggles
          </h2>
          <div className="w-24 h-1 bg-[#2a9d8f] mx-auto rounded-full"></div>
          <p className="text-lg text-[#39485C] max-w-2xl mx-auto">
            Finding healthy snacks that actually taste good and fit your busy lifestyle shouldn't be so difficult.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center space-y-4 bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#2a9d8f]/20 to-[#264653]/20 rounded-full flex items-center justify-center mx-auto">
                <feature.icon className="w-8 h-8 text-[#2a9d8f]" />
              </div>
              <h3 className="font-semibold text-xl text-[#264653]">{feature.title}</h3>
              <p className="text-[#39485C]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
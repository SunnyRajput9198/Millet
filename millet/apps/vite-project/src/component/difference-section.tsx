import { CheckCircle } from "lucide-react"

export function DifferenceSection() {
  const benefits = [
    "Hand-harvested from pristine wetlands",
    "Processed without chemicals or preservatives",
    "Supports sustainable farming communities",
    "Tested for purity and nutritional content",
  ]

  return (
    <section className="py-20 lg:py-32 bg-[#EAE0D5]">
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left - Image */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl">
            <img
              src="/makhana-farming-wetlands-in-bihar-with-farmers-har.jpg"
              alt="Makhana farming in Bihar wetlands"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="font-playfair text-3xl lg:text-4xl font-bold text-[#264653]">
                The Nature Millets Difference
              </h2>
              <p className="text-lg text-[#39485C] max-w-xl">
                We partner directly with farmers in Bihar & UP to bring you the purest fox nuts (makhana) and premium
                quality millets. Our mission: <strong>Healthy, Sustainable, and Honest Snacking.</strong>
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-[#2a9d8f] mt-0.5 flex-shrink-0" />
                  <span className="text-[#39485C]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

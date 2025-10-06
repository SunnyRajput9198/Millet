import { Leaf, Users, Recycle } from "lucide-react"

export function SustainabilitySection() {
  const commitments = [
    {
      icon: Leaf,
      title: "Sustainable harvesting practices",
      description: "Working with nature, not against it",
    },
    {
      icon: Users,
      title: "Better income for farmers",
      description: "Supporting communities in Purvanchal & Mithila",
    },
    {
      icon: Recycle,
      title: "Eco-friendly packaging",
      description: "Reducing our environmental footprint",
    },
  ]

  return (
    <section className="py-16 lg:py-24 ">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-playfair text-3xl lg:text-4xl font-bold">Sustainability Promise</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            By choosing Nature Millets, you support a better future for farmers and the environment
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {commitments.map((commitment, index) => (
            <div key={index} className="bg-card rounded-xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <commitment.icon className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold text-xl">{commitment.title}</h3>
              <p className="text-muted-foreground">{commitment.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

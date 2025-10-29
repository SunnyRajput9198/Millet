import { Header } from "../component/header"
import { HeroSection } from "../component/hero-section"
import { FeaturesSection } from "../component/feature-section"
import { DifferenceSection } from "../component/difference-section"
import { BenefitsSection } from "../component/benefits-section"
import { ProductsSection } from "../component/products-section"
import { SustainabilitySection } from "../component/sustainability-section"
import { NutritionComparison } from "../component/nutrition-comparison"
import { CategorySection } from "../component/category-section"
import { Footer } from "../component/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <FeaturesSection />
        <DifferenceSection />
        <BenefitsSection />
        <ProductsSection />
        <SustainabilitySection />
        <NutritionComparison />
      </main>
      <Footer />
    </div>
  )
}
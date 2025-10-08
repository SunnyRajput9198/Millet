import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { LeafIcon, FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-full">
                <LeafIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-playfair text-xl font-bold">Nature Millets</span>
                <span className="text-xs text-muted -mt-1">Purely Natural</span>
              </div>
            </Link>
            <p className="text-sm text-muted">
              Premium organic makhana and millet products directly from farmers. Healthy, sustainable, and honest
              snacking for modern lifestyles.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="text-background hover:text-primary">
                <FacebookIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-background hover:text-primary">
                <InstagramIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-background hover:text-primary">
                <TwitterIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-background hover:text-primary">
                <YoutubeIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Products</h3>
            <div className="space-y-2">
              <Link
                to="/products/raw-makhana"
                className="block text-sm text-muted hover:text-background transition-colors"
              >
                Raw Premium Makhana
              </Link>
              <Link
                to="/products/flavoured-makhana"
                className="block text-sm text-muted hover:text-background transition-colors"
              >
                Flavoured Makhana
              </Link>
              <Link
                to="/products/millet-snacks"
                className="block text-sm text-muted hover:text-background transition-colors"
              >
                Millet Snacks
              </Link>
              <Link
                to="/products/makhana-biscuits"
                className="block text-sm text-muted hover:text-background transition-colors"
              >
                Makhana Biscuits
              </Link>
              <Link
                to="/products/energy-bars"
                className="block text-sm text-muted hover:text-background transition-colors"
              >
                Energy Bars
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Company</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-muted hover:text-background transition-colors">
                About Us
              </Link>
              <Link to="/sustainability" className="block text-sm text-muted hover:text-background transition-colors">
                Sustainability
              </Link>
              <Link to="/farmers" className="block text-sm text-muted hover:text-background transition-colors">
                Our Farmers
              </Link>
              <Link to="/careers" className="block text-sm text-muted hover:text-background transition-colors">
                Careers
              </Link>
              <Link to="/press" className="block text-sm text-muted hover:text-background transition-colors">
                Press
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Stay Updated</h3>
            <p className="text-sm text-muted">Get the latest updates on new products and exclusive offers.</p>
            <div className="space-y-2">
              <Input placeholder="Enter your email" className="bg-background text-foreground" />
              <Button className="w-full">Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="border-t border-muted mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted">© 2025 Nature Millets. All rights reserved.</div>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy" className="text-muted hover:text-background transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted hover:text-background transition-colors">
                Terms of Service
              </Link>
              <Link to="/shipping" className="text-muted hover:text-background transition-colors">
                Shipping Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

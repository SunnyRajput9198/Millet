import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/Homepage"
import AuthPage from "./pages/auth-page"
import ProfilePage from "./pages/Profilepage"
import AddressPage from "./pages/adress-page"
import Wishlist from "./pages/wishlist"
import Recentlyviewed from "./pages/Recentlyviewedpage"
import Product from "./pages/product"
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<ProfilePage />} /> 
      <Route path="/addresses" element={<AddressPage />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/recently-viewed" element={<Recentlyviewed />} />
      <Route path="/products" element={<Product />} />
    </Routes>
  )
}

export default App
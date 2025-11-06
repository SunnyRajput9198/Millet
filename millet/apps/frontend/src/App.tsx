import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/Homepage"
import AuthPage from "./pages/auth-page"
import ProfilePage from "./pages/Profilepage"
import AddressPage from "./pages/adress-page"
import Wishlist from "./pages/wishlist"
import Recentlyviewed from "./pages/Recentlyviewedpage"
import Product from "./pages/product"
import CartPage from "./pages/cart-page"
import Notification from "./pages/Notification-page"
import SettingPage from "./pages/settingpage"
import MyReviews from "./pages/Reviewpage"
import ProductDetail from "./pages/productdetail"
import Checkout from "./pages/checkout"
import { AdminLayout } from "./component/AdminLayout"
import{ AdminDashboard} from "./pages/admin/dashboard-page"
import AdminOrders from "./pages/admin/orders-page"
import AdminUsers from "./pages/admin/Users"
import AdminProducts from "./pages/admin/Products"
import AdminCategories from "./pages/admin/categories"
import AdminSettings from "./pages/admin/setting"
import { TrackShipmentPage } from "./pages/Trackshipment"
import { UserOrdersPage } from "./pages/Userordeerpaage"
import { AdminShipmentsPage } from "./pages/admin/Shipment"
import { OrderDetailPageWrapper } from "./pages/OrderDetailspagewrapper"


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
      <Route path="/product/:slug" element={<ProductDetail />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/notifications" element={<Notification />} />
      <Route path="/settings" element={<SettingPage />} />
      <Route path="/my-reviews" element={<MyReviews />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/track-shipment" element={<TrackShipmentPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="shipments" element={<AdminShipmentsPage />} />
      </Route>
      <Route path="/orders" element={<UserOrdersPage />} />
      <Route path="/orders/:id" element={<OrderDetailPageWrapper />} />

    </Routes>
  )
}

export default App
import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/Homepage"
import AuthPage from "./pages/auth-page"
import ProfilePage from "./pages/Profilepage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<ProfilePage />} /> 
    </Routes>
  )
}

export default App
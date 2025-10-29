import { Header } from "../component/header"
import { ProfilePage as Profile } from "../component/Userprofilepage"
import { Footer } from "../component/footer"

export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Profile />
      <Footer />
    </div>
  )
}
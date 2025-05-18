//Her så importerer vi Outlet fra React router dom for å vise ruter som fylles inn her
import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import "../styles/Layout.scss"

//Her tar layout komponenten imot to props: 
//isLoggedIn er en boolean som sier om brukeren er innlogget
//onLogout er en funksjon som kalles når brukeren logger ut
const Layout = ({ isLoggedIn, onLogout }) => {
  return (
    <div className="app-container">
      <Header isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout

import { useState } from "react" // useState brukes for å kunne lagre og endre tilstand (state) i komponenten
// Kilde: https://reactjs.org/docs/hooks-state.html

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom" 
// Router og Routes brukes til å sette opp navigasjon/routing i appen
// Route brukes for å vise riktig komponent basert på URL
// Navigate brukes for å videresende/omdirigere brukere
// Kilde: https://reactrouter.com/en/main/start/overview

// Importerer forskjellige komponenter som brukes i appen
import Header from "./components/Header"
import Footer from "./components/Footer"
import Home from "./components/Home"
import EventDetails from "./components/EventDetails"
import Dashboard from "./components/Dashboard"
import Category from "./components/Category"
import Search from "./components/Search"
import NotFound from "./components/NotFound"
import "./styles/App.scss" // Importerer stilark for appen
// Kilde for SCSS i React: https://sass-lang.com/guide/

function App() {
  // State for om brukeren er logget inn
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // State for å lagre informasjon om den innloggede brukeren
  const [currentUser, setCurrentUser] = useState(null)

  // Funksjon som kjøres når en bruker logger inn
  const handleLogin = (user) => {
    console.log("Innlogging vellykket:", user) // Logger info om bruker til konsollen
    setIsLoggedIn(true) // Oppdaterer at bruker er logget inn
    setCurrentUser(user) // Lagre informasjon om brukeren
  }

  // Funksjon som kjøres når bruker logger ut
  const handleLogout = () => {
    setIsLoggedIn(false) // Bruker er ikke lenger logget inn
    setCurrentUser(null) // Nullstiller informasjon om brukeren
  }

  return (
    <Router> {/* Starter routing-systemet */}
      <div className="app">
        {/* Header vises på toppen, og får info om innlogget status og logout-funksjon */}
        <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <main className="main-content">
          <Routes> {/* Her defineres hvilke komponenter som vises for ulike URL-er */}
            <Route path="/" element={<Home />} /> {/* Hjem-siden */}
            <Route path="/event/:id" element={<EventDetails />} /> {/* Viser detaljer for et event basert på id i URL */}
            <Route path="/sanity-event/:id" element={<EventDetails />} /> {/* En alternativ rute for eventdetaljer */}

            {/* Dashboard vises kun hvis bruker er innlogget, og får med brukerdata og login-funksjon */}
            <Route
              path="/dashboard"
              element={<Dashboard isLoggedIn={isLoggedIn} currentUser={currentUser} onLogin={handleLogin} />}
            />

            {/* Kategori-ruter, f.eks. musikk, sport, osv. */}
            <Route path="/category/:categoryName" element={<Category />} />

            {/* Søk-side */}
            <Route path="/search" element={<Search />} />

            {/* Omdirigering fra gamle ruter til nye */}
            <Route path="/hjem" element={<Navigate to="/" replace />} /> {/* Omdirigerer fra gammel "/hjem" til "/" */}
            <Route path="/musikk" element={<Navigate to="/category/musikk" replace />} />
            <Route path="/sport" element={<Navigate to="/category/sport" replace />} />
            <Route path="/teater-og-show" element={<Navigate to="/category/teater-og-show" replace />} />

            {/* Hvis ingen ruter passer, vises 404-siden */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {/* Footer vises nederst på siden uansett hvilken rute man er på */}
        <Footer />
      </div>
    </Router>
  )
}

export default App 
import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import "../styles/Header.scss"


//her definerer vi en Header-komponent som tar imot to props: isLoggedIn og onLogout
//isLoggedIn: indikerer om brukeren er logget inn
//onLogout: En callback-funksjon for å håndtere utlogging
const Header = ({ isLoggedIn, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  //her bruker vi hooks for tilstandshåndtering
  //searchQuey er for lagring av søketeksten som brukeren skriver inn
  //mobileMenuOpen holder styr på om mobilmenyen er åpen eller lukket
  //nagivate er for navigasjon mellom sider
  //handle search hånterer søkeskjema-innsending, navigerer til søkesiden med søkeordet som URL-parameter
  //toggleMobileMenu: veksler mobilmeny åpen/lukket tilstand
  //handleLogout kaller onLogout-funksjonen hvis den finnes og lukker mobilmenyen
  //Kilder: 
  //MDN Web Docs om encodeURlComponent:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
      setMobileMenuOpen(false)
    }
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="header-container">
        <div className="logo-container">
          <Link to="/" className="logo">
            BillettLyst
          </Link>
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Meny">
            <span className={`hamburger ${mobileMenuOpen ? "active" : ""}`}></span>
          </button>
        </div>

        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Søk etter arrangementer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" aria-label="Søk">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z" />
                <path
                  d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </form>
        </div>

        <nav className={`main-nav ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <ul className="nav-links">
            <li>
              <NavLink to="/" onClick={() => setMobileMenuOpen(false)}>
                Hjem
              </NavLink>
            </li>
            <li>
              <NavLink to="/category/musikk" onClick={() => setMobileMenuOpen(false)}>
                Musikk
              </NavLink>
            </li>
            <li>
              <NavLink to="/category/sport" onClick={() => setMobileMenuOpen(false)}>
                Sport
              </NavLink>
            </li>
            <li>
              <NavLink to="/category/teater-og-show" onClick={() => setMobileMenuOpen(false)}>
                Teater og show
              </NavLink>
            </li>
            <li>
              {isLoggedIn ? (
                <div className="user-menu">
                  <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    Min side
                  </NavLink>
                  <button className="logout-button" onClick={handleLogout}>
                    Logg ut
                  </button>
                </div>
              ) : (
                <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  Logg inn
                </NavLink>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header

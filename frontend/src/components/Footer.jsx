import { Link } from "react-router-dom"
import "../styles/Footer.scss"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <section className="footer-container">
        <nav className="footer-nav">
          <ul>
            <li>
              <Link to="/">Hjem</Link>
            </li>
            <li>
              <Link to="/category/musikk">Musikk</Link>
            </li>
            <li>
              <Link to="/category/sport">Sport</Link>
            </li>
            <li>
              <Link to="/category/teater-og-show">Teater og show</Link>
            </li>
            <li>
              <Link to="/dashboard">Min side</Link>
            </li>
          </ul>
        </nav>
      </section>

      <section className="footer-bottom">
        <p>
          &copy; {currentYear} BillettLyst. Gruppe 8.
        </p>
      </section>
    </footer>
  )
}

export default Footer

import { Link } from "react-router-dom"
import "../styles/NotFound.scss"

//Notfound komponenten vises hvis brukeren prøver å gå til en rute som ikke finnes
const NotFound = () => {
  return (
    <section className="not-found-page">
      <section className="not-found-content">
        <h1>404</h1>
        <h2>Siden ble ikke funnet</h2>
        <p>Siden eksisterer ikke</p>
        <Link to="/" className="home-link">
          Gå til forsiden
        </Link>
      </section>
    </section>
  )
}

export default NotFound

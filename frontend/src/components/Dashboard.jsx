import { useState, useEffect } from "react"
import client, { authenticateUser, checkUserExists } from "../../lib/sanity"
import { urlFor } from "../../lib/imageUrlBuilder"
import "../styles/Dashboard.scss"

const Dashboard = ({ isLoggedIn: propIsLoggedIn, currentUser: propCurrentUser, onLogin }) => {
  //lokale state for å håndtere innlogging
  const [localIsLoggedIn, setLocalIsLoggedIn] = useState(propIsLoggedIn || false)
  const [localCurrentUser, setLocalCurrentUser] = useState(propCurrentUser || null)

  //bruker enten props eller lokal state
  const isLoggedIn = propIsLoggedIn !== undefined ? propIsLoggedIn : localIsLoggedIn
  const currentUser = propCurrentUser || localCurrentUser
//states for brukere, arrangementer, innlogging, og eventdetails
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [eventDetails, setEventDetails] = useState({})

  //henter brukere og arrangementer fra Sanity
  useEffect(() => {
    const fetchSanityData = async () => {
      try {
        //henter brukerne fra Sanity-databasen
        const usersData = await client.fetch(
          `*[_type == "user"]{ _id, name, email, gender, age, "wishlist": wishlist[]->{_id, title, apiId}, "previousPurchases": previousPurchases[]->{_id, title, apiId}, "friends": friends[]->{_id, name, email, "wishlist": wishlist[]->{_id, title}} }`,
        )
        //henter events
        const eventsData = await client.fetch(`*[_type == "event"]{ _id, title, apiId }`)

        setUsers(usersData)
        setEvents(eventsData)

        const detailsMap = {}
        eventsData.forEach((event) => {
          if (event.apiId) {
            detailsMap[event.apiId] = {
              name: event.title,
              //standardverdier for eventDetails
              dates: { start: { localDate: "2025-06-01" } },
              _embedded: {
                venues: [{ name: "Oslo", city: { name: "Oslo" }, country: { name: "Norge" } }],
              },
            }
          }
        })
        setEventDetails(detailsMap)
      } catch (error) {
        console.error("Error", error)
      }
    }

    fetchSanityData()
  }, [])

  //oppdatering av input-felt i innloggingsskjema
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))
  }

  //innsendelse av innlogginsskjema
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError("")
    setIsLoading(true)

    try {
      const { email, password } = loginForm //henter e-post og passord fra 

      console.log("Forsøker innlogging med:", email, password)

      //sjekk om bruker eksisterer i Sanity, hvis ikke gi en error
      const userExists = await checkUserExists(email)
      console.log("Bruker eksisterer:", userExists)

      if (!userExists) {
        setLoginError("Bruker ikke funnet")
        setIsLoading(false)
        return
      }

      const result = await authenticateUser(email, password)
      console.log("Autentiseringsresultat:", result)

      if (result.success) {
        //oppdater lokal state
        setLocalIsLoggedIn(true)
        setLocalCurrentUser(result.user)

        if (typeof onLogin === "function") {
          onLogin(result.user)
        }
      } else {
        setLoginError(result.message || "Prøv igjen")
      }
    } catch (error) {
      console.error("error:", error)
      setLoginError("En feil oppstod under innlogging")
    } finally {
      setIsLoading(false)
    }
  }

  //hent korrekt kobling til event
  const getEventLink = (event) => {
    const summerFestivals = ["Findings", "Neon", "Skeikampenfestivalen", "Tons of Rock"]
    if (event.title && summerFestivals.some((fest) => event.title.includes(fest))) {
      return `/event/${event.apiId}`
    }
    return `/sanity-event/${event.apiId}`
  }

  //hvis man ikke er logget inn vises funksjonalitet for innlogging
  if (!isLoggedIn) {
    return (
      <section className="dashboard-page">
        <article className="login-container">
          <h1>Logg inn</h1>
          <form onSubmit={handleLogin} className="login-form">
            {loginError && <p className="login-error">{loginError}</p>}
            <div className="form-group">
              <label htmlFor="email">E-post</label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginForm.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Passord</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginForm.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Logger inn..." : "Logg inn"}
            </button>
          </form>

          <div className="test-users">
            <h3>Testbruker</h3>
            <p>Du kan bruke en testbruker for å logge inn:</p>
            <ul>
              <li>
                E-post: <strong>admin@sanity.com</strong>, Passord: <strong>admin1</strong>
              </li>
            </ul>
          </div>
        </article>
      </section>
    )
  }

  //hvis logget inn vises dashboard-siden
  return (
    <section className="dashboard-page">
      <h1>Min side</h1>

      <section className="sanity-data-section">
        <article className="sanity-events">
          <h3>Alle arrangementer</h3>
          <div className="events-grid">
            {events.length > 0 ? (
              events.map((event) => (
                <article key={event._id} className="sanity-event-card">
                  <h4>{event.title}</h4>
                </article>
              ))
            ) : (
              <p>Ingen arrangementer funnet</p>
            )}
          </div>
        </article>

        <article className="sanity-users">
          <h3>Alle brukere</h3>
          <div className="users-grid">
            {users.length > 0 ? (
              users.map((user) => (
                <article key={user._id} className="user-card">
                  <h4>{user.name}</h4>
                  <p>E-post: {user.email}</p>
                  <p>Kjønn: {user.gender}</p>
                  <p>Alder: {user.age}</p>
                  <div className="user-events">
                    <p>Ønskeliste: {user.wishlist?.length || 0} arrangementer</p>
                    <p>Tidligere kjøp: {user.previousPurchases?.length || 0} arrangementer</p>
                  </div>
                </article>
              ))
            ) : (
              <p>Ingen brukere funnet</p>
            )}
          </div>
        </article>
      </section>

      {currentUser && (
        <section className="user-dashboard">
          <article className="user-profile">
            <h2>Din profil</h2>
            <div className="profile-details">
              <div className="profile-image">
                {currentUser.image && urlFor(currentUser.image) ? (
                  <img
                    src={urlFor(currentUser.image).width(200).height(200).url() || "/placeholder.svg"}
                    alt={currentUser.name}
                  />
                ) : (
                  <img src={`/abstract-geometric-shapes.png`} alt={currentUser.name} />
                )}
              </div>
              <div className="profile-info">
                <h3>{currentUser.name}</h3>
                <p>E-post: {currentUser.email}</p>
                {currentUser.gender && <p>Kjønn: {currentUser.gender}</p>}
                {currentUser.age && <p>Alder: {currentUser.age}</p>}
              </div>
            </div>
          </article>

          <div className="user-content">
            <article className="wishlist-section">
              <h3>Din ønskeliste</h3>
              {currentUser.wishlist && currentUser.wishlist.length > 0 ? (
                <div className="wishlist-grid">
                  {currentUser.wishlist.map((event) => (
                    <article key={event._id} className="wishlist-item">
                      <h4>{event.title}</h4>
                    </article>
                  ))}
                </div>
              ) : (
                <p>Ingen arrangementer i ønskelisten</p>
              )}
            </article>

            <article className="purchases-section">
              <h3>Dine tidligere kjøp</h3>
              {currentUser.previousPurchases && currentUser.previousPurchases.length > 0 ? (
                <div className="purchases-grid">
                  {currentUser.previousPurchases.map((event) => (
                    <article key={event._id} className="purchase-item">
                      <h4>{event.title}</h4>
                    </article>
                  ))}
                </div>
              ) : (
                <p>Ingen tidligere kjøp</p>
              )}
            </article>

            <article className="friends-section">
              <h3>Dine venner</h3>
              {currentUser.friends && currentUser.friends.length > 0 ? (
                <div className="friends-grid">
                  {currentUser.friends.map((friend) => {
                    const commonEvents =
                      currentUser.wishlist?.filter((ev) => friend.wishlist?.some((fe) => fe._id === ev._id)) || []
                    return (
                      <article key={friend._id} className="friend-card">
                        <h4>{friend.name}</h4>
                        {commonEvents.length > 0 && (
                          <div className="common-events">
                            <p>
                              Du og {friend.name} har samme event i ønskelisten. Hva med å dra sammen på{" "}
                              {commonEvents[0].title}?
                            </p>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p>Ingen venner 😭</p>
              )}
            </article>
          </div>
        </section>
      )}
    </section>
  )
}

export default Dashboard

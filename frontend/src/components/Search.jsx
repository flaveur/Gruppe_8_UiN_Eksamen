import { useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { API_KEY } from "../../lib/fallbackFestivalData"
import "../styles/Search.scss"

const Search = () => { // Navigasjonsfunksjon for å endre URL
  const navigate = useNavigate()
  const [searchParams] = useSearchParams() // Henter søkeparametere fra URL
  const query = searchParams.get("q") || "" // Henter verdien for søkeparameteren "q"

  const [events, setEvents] = useState([]) // Liste over arrangementer
  const [loading, setLoading] = useState(false) // Indikerer om data lastes
  const [error, setError] = useState(null) // Feilmelding hvis noe går galt
  const [page, setPage] = useState(0) // Nåværende side i paginering
  const [totalPages, setTotalPages] = useState(1) // Totalt antall sider
  const [totalEvents, setTotalEvents] = useState(0) // Totalt antall arrangementer funnet
  const [favorites, setFavorites] = useState({}) // Favorittarrangementer lagret i localStorage
  const eventsPerPage = 12 // Antall arrangementer som vises per side

  const [dateFilter, setDateFilter] = useState("") // Dato-filter
  const [countryFilter, setCountryFilter] = useState("") // Land-filter
  const [cityFilter, setCityFilter] = useState("") // By-filter
  const [availableCountries, setAvailableCountries] = useState([]) // Tilgjengelige land fra API-data
  const [availableCities, setAvailableCities] = useState([]) // Tilgjengelige byer fra API-data
  const [showFilters, setShowFilters] = useState(false) // Vise/skjule filter-seksjon
  const [localSearchQuery, setLocalSearchQuery] = useState(query) // Lokal søketekst (fra input-felt)

  useEffect(() => {
    const savedFavorites = localStorage.getItem("eventFavorites") // Henter favoritter fra localStorage
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites)) // Laster inn som objekt
      } catch (e) {
        console.error("Feil ved lasting av favoritter:", e)
        setFavorites({})
      }
    }
  }, [])

  useEffect(() => {
    setLocalSearchQuery(query)
  }, [query]) // Oppdaterer lokal søketekst når URL-endres

  const toggleFavorite = (event, e) => { 
    e.preventDefault() // Hindrer standard navigering
    e.stopPropagation() // Hindrer at klikket går videre til lenken

    setFavorites((prev) => {
      const newFavorites = { ...prev }
      if (newFavorites[event.id]) { // Fjerner fra favoritter hvis allerede lagt til
        delete newFavorites[event.id]
      } else {
        newFavorites[event.id] = { // Lagres i localStorage
          id: event.id,
          name: event.name,
          date: event.dates?.start?.localDate || "",
          imageUrl: getBestImageUrl(event), 
        }
      }

      localStorage.setItem("eventFavorites", JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  const getBestImageUrl = (event, ratio = "16_9", minWidth = 500) => {
    if (!event || !event.images || !event.images.length) {
      return "/abstract-geometric-shapes.png" // Fallback bilde
    }

    const preferredImage = event.images.find((img) => img.ratio === ratio && img.width >= minWidth)
    if (preferredImage) return preferredImage.url

    const largestImage = event.images.reduce((prev, current) => {
      return prev.width > current.width ? prev : current
    })

    return largestImage.url
  }

    // Formaterer dato til norsk format "DD.MM.ÅR"
  const formatDate = (dateString) => {
    if (!dateString) return "Dato ikke tilgjengelig" // Formaterer dato på norsk

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }
  // Kilde: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

  // Returnerer sted for et arrangement basert på tilgjengelige venue-data
  const getEventLocation = (event) => {
    if (!event._embedded || !event._embedded.venues || !event._embedded.venues[0]) {
      return "Sted ikke tilgjengelig"
    }

    const venue = event._embedded.venues[0]
    const venueName = venue.name || ""
    const city = venue.city?.name || ""
    const country = venue.country?.name || ""

    // Bygger stedsnavn avhengig av hvilke data som er tilgjengelige
    if (venueName && city && country) {
      return `${venueName}, ${city}, ${country}`
    } else if (venueName && city) {
      return `${venueName}, ${city}`
    } else if (city && country) {
      return `${city}, ${country}`
    } else if (venueName) {
      return venueName
    }

    return "Sted ikke tilgjengelig"
  }

  // Oppdaterer listen over tilgjengelige land og byer fra arrangementdata
  const updateAvailableFilters = (eventsData) => {
    const countries = new Set()
    const cities = new Set()

    eventsData.forEach((event) => {
      if (event._embedded && event._embedded.venues) {
        event._embedded.venues.forEach((venue) => {
          if (venue.country && venue.country.name) {
            countries.add(venue.country.name)
          }
          if (venue.city && venue.city.name) {
            cities.add(venue.city.name)
          }
        })
      }
    })

    setAvailableCountries(Array.from(countries).sort())
    setAvailableCities(Array.from(cities).sort())
  }

  // Gjør API-kall til Ticketmaster Discovery API og henter arrangementer basert på søkeord og filtre
  const searchEvents = async (searchQuery, pageNumber = 0, filters = {}) => {
    if (!searchQuery.trim() && !filters.startDateTime && !filters.countryCode && !filters.city) {
      setEvents([])
      setTotalPages(1)
      setTotalEvents(0)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Bygger API-url
      let apiUrl = `https://app.ticketmaster.com/discovery/v2/events?apikey=${API_KEY}&locale=*&countryCode=NO&keyword=${encodeURIComponent(
        searchQuery,
      )}&size=${eventsPerPage}&page=${pageNumber}`

      if (filters.startDateTime) {
        apiUrl += `&startDateTime=${filters.startDateTime}`
      }

      if (filters.countryCode && filters.countryCode !== "NO") {
        apiUrl = apiUrl.replace("countryCode=NO", `countryCode=${filters.countryCode}`)
      }

      if (filters.city) {
        apiUrl += `&city=${encodeURIComponent(filters.city)}`
      }

      console.log(`Søker etter arrangementer med søkeord: ${searchQuery}`, apiUrl)

      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`API-forespørsel feilet med status ${response.status}`)
      }

      const data = await response.json()

      if (data.page) {
        setTotalPages(data.page.totalPages || 1)
        setTotalEvents(data.page.totalElements || 0)
      }

      const eventsData = data._embedded && data._embedded.events ? data._embedded.events : []

      updateAvailableFilters(eventsData)

      setEvents(eventsData)
    } catch (error) {
      console.error(`Feil ved søk etter arrangementer: ${error}`)
      setError("Kunne ikke utføre søk. Vennligst prøv igjen senere.")
    } finally {
      setLoading(false)
    }
  }
    // Kilde: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

  // Håndterer søkeskjemaets submit-knapp
  const handleSearch = (e) => {
    e.preventDefault()

    if (localSearchQuery.trim() !== query) {
      navigate(`/search?q=${encodeURIComponent(localSearchQuery.trim())}`)
    } else {
      applyFilters()
    }
  }

  // Bruker gjeldende filtre og starter nytt søk
  const applyFilters = () => {
    setPage(0)

    const filters = {}

    if (dateFilter) {

      const date = new Date(dateFilter)
      filters.startDateTime = `${date.toISOString().split("T")[0]}T00:00:00Z`
    }
    //  Kilde: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString


    if (countryFilter) {

      const countryMap = {
        Norge: "NO",
        Sweden: "SE",
        Denmark: "DK",

      }
      filters.countryCode = countryMap[countryFilter] || countryFilter
    }

    if (cityFilter) {
      filters.city = cityFilter
    }

    searchEvents(query, 0, filters)
  }

  // Tilbakestiller alle filtre og gjør et nytt søk
  const resetFilters = () => {
    setDateFilter("")
    setCountryFilter("")
    setCityFilter("")
    searchEvents(query, 0)
  }

  // React useEffect-hook for å søke når komponenten lastes eller når søkeordet eller sidenummer endres
  useEffect(() => {
    if (query) {
      searchEvents(query, page)
    }
  }, [query, page])
  // Kilde: https://reactjs.org/docs/hooks-effect.html

  // Endrer side i paginering
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage)
      window.scrollTo(0, 0)
    }
  }

  // Funksjon for å vise/skjule filterseksjonen
  const toggleFilters = () => {
    setShowFilters(!showFilters) // Toggler verdien mellom true/false
  }

  // Hovedreturnering av komponenten
  return (
    <div className="search-page">
      <h1>Søkeresultater for "{query}"</h1>

      <div className="filter-section">
        <button className="toggle-filters-button" onClick={toggleFilters}>
          {showFilters ? "Skjul filtre" : "Vis filtre"}
        </button>

        <div className={`filters-container ${showFilters ? "show" : ""}`}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Søk etter arrangementer..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                Søk
              </button>
            </div>

            <div className="filters-grid">
              <div className="filter-group">
                <label htmlFor="date-filter">Dato</label>
                <input
                  type="date"
                  id="date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label htmlFor="country-filter">Land</label>
                <select
                  id="country-filter"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Alle land</option>
                  {availableCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="city-filter">By</label>
                <select
                  id="city-filter"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Alle byer</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-buttons">
                <button type="button" onClick={applyFilters} className="apply-filters-button">
                  Bruk filtre
                </button>
                <button type="button" onClick={resetFilters} className="reset-filters-button">
                  Tilbakestill
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="loading">Søker etter arrangementer...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {totalEvents > 0 ? (
            <div className="search-info">
              <p>Fant {totalEvents} arrangementer</p>
            </div>
          ) : (
            query && (
              <div className="no-results">
                <p>Ingen arrangementer funnet for søkeordet "{query}" med valgte filtre.</p>
                <button onClick={resetFilters} className="reset-filters-button">
                  Tilbakestill filtre
                </button>
                <div className="category-links">
                  <p>Prøv å søke i en av våre kategorier:</p>
                  <div className="category-buttons">
                    <Link to="/category/musikk" className="category-link">
                      Musikk
                    </Link>
                    <Link to="/category/sport" className="category-link">
                      Sport
                    </Link>
                    <Link to="/category/teater-og-show" className="category-link">
                      Teater og show
                    </Link>
                  </div>
                </div>
              </div>
            )
          )}

          {events.length > 0 && (
            <>
              <div className="events-grid">
                {events.map((event) => (
                  <Link to={`/event/${event.id}`} key={event.id} className="event-card-link">
                    <div className="event-card">
                      <button
                        className={`heart-button ${favorites[event.id] ? "active" : ""}`}
                        onClick={(e) => toggleFavorite(event, e)}
                        aria-label={favorites[event.id] ? "Fjern fra favoritter" : "Legg til i favoritter"}
                      >
                        {favorites[event.id] ? "❤️" : "🤍"}
                      </button>
                      <div className="event-image-container">
                        <img
                          src={getBestImageUrl(event) || "/abstract-geometric-shapes.png"}
                          alt={event.name}
                          className="event-image"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = "/abstract-geometric-shapes.png"
                          }}
                        />
                      </div>
                      <div className="event-info">
                        <h3>{event.name}</h3>
                        <p className="event-date">{formatDate(event.dates?.start?.localDate)}</p>
                        <p className="event-location">{getEventLocation(event)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                    className="pagination-button"
                  >
                    Forrige
                  </button>

                  <span className="page-info">
                    Side {page + 1} av {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages - 1}
                    className="pagination-button"
                  >
                    Neste
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Search

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { API_KEY } from "../../lib/fallbackFestivalData"
import "../styles/Category.scss"

//ID-er for kategorier
const SEGMENT_IDS = {
  musikk: "KZFzniwnSyZfZ7v7nJ", //musikk
  sport: "KZFzniwnSyZfZ7v7nE", //sport
  "teater-og-show": "KZFzniwnSyZfZ7v7na", //teater og show
}

const Category = () => {
  const navigate = useNavigate()
  const { categoryName } = useParams()
  //oppretter state for arrangementer, lasting, feil, sidehåndtering og favoritter
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEvents, setTotalEvents] = useState(0)
  const [favorites, setFavorites] = useState({})
  const eventsPerPage = 12 //12 events per side

  //oppretter state for filtre 
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [availableCountries, setAvailableCountries] = useState([])
  const [availableCities, setAvailableCities] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  //laster inn favoritter fra localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("eventFavorites")
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (e) {
        console.error("Feil ved lasting av favoritter", e)
        setFavorites({})
      }
    }
  }, [])

  //funksjon for å toggle favoritt-status
  const toggleFavorite = (event, e) => {
    e.preventDefault() //stopper navigering til arrangementer
    e.stopPropagation() //hindrer at klikket bobler opp til overliggende elementer

    setFavorites((prev) => {
      const newFavorites = { ...prev }
      if (newFavorites[event.id]) {
        delete newFavorites[event.id]
      } else {
        newFavorites[event.id] = {
          id: event.id,
          name: event.name,
          date: event.dates?.start?.localDate || "",
          imageUrl: getBestImageUrl(event),
        }
      }

      //lagring til localStorage
      localStorage.setItem("eventFavorites", JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  //formaterer kategorier for visning på siden
  const formatCategoryName = (category) => {
    const nameMap = {
      musikk: "Musikk",
      sport: "Sport",
      "teater-og-show": "Teater og show",
    }

    return nameMap[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")
  }

  //kode nedenfor er forklart i CategoryPage, til neste kommentar. dette tar for seg visning av bilder og detaljer for events
  const getBestImageUrl = (event, ratio = "16_9", minWidth = 500) => {
    if (!event || !event.images || !event.images.length) {
      return "/abstract-geometric-shapes.png"
    }

    const preferredImage = event.images.find((img) => img.ratio === ratio && img.width >= minWidth)
    if (preferredImage) return preferredImage.url

    const largestImage = event.images.reduce((prev, current) => {
      return prev.width > current.width ? prev : current
    })

    return largestImage.url
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Dato ikke tilgjengelig"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }
              
  const getEventLocation = (event) => {
    if (!event._embedded || !event._embedded.venues || !event._embedded.venues[0]) {
      return "Sted ikke tilgjengelig"
    }

    const venue = event._embedded.venues[0]
    const venueName = venue.name || ""
    const city = venue.city?.name || ""
    const country = venue.country?.name || ""

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

  //henter arrangementer for valgte kategori
  const fetchCategoryEvents = async (categoryName, pageNumber = 0, filters = {}) => {
    try {
      setLoading(true)
      setError(null)

      //sjekk etter segment ID for kategorien
      const segmentId = SEGMENT_IDS[categoryName]

      if (!segmentId) {
        throw new Error(`Ukjent kategori: ${categoryName}`)
      }

      //lager API URL med segment ID og filtre
      let apiUrl = `https://app.ticketmaster.com/discovery/v2/events?apikey=${API_KEY}&locale=*&countryCode=NO&segmentId=${segmentId}&size=${eventsPerPage}&page=${pageNumber}`

      //legg til søkeord filter hvis det finnes
      if (filters.keyword) {
        apiUrl += `&keyword=${encodeURIComponent(filters.keyword)}`
      }

      //legg til datofilter hvis det finnes
      if (filters.startDateTime) {
        apiUrl += `&startDateTime=${filters.startDateTime}`
      }

      //norge er standard land, men legger til landfilter hvis det finnes
      if (filters.countryCode && filters.countryCode !== "NO") {
        apiUrl = apiUrl.replace("countryCode=NO", `countryCode=${filters.countryCode}`)
      }

      //legg til byfilter hvis det finnes
      if (filters.city) {
        apiUrl += `&city=${encodeURIComponent(filters.city)}`
      }

      console.log(`Henter arrangementer for kategori: ${categoryName}`, apiUrl)

      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`API-forespørsel feilet ${response.status}`)
      }

      const data = await response.json()

      //oppdater totalt antall sider og events
      if (data.page) {
        setTotalPages(data.page.totalPages || 1)
        setTotalEvents(data.page.totalElements || 0)
      }

      const eventsData = data._embedded && data._embedded.events ? data._embedded.events : []

      //oppdater land og byer
      updateAvailableFilters(eventsData)

      setEvents(eventsData)
      setLoading(false)
    } catch (error) {
      console.error(`Feil ved henting av arrangementer for denne kategorien: ${categoryName}:`, error)
      setError("Kunne ikke laste arrangementer")
      setLoading(false)
    }
  }

  //oppretter tomme sett for forskjellige land og byer
  const updateAvailableFilters = (eventsData) => {
    const countries = new Set()
    const cities = new Set()
    //går gjennom alle arrangementer og sjekker etter informasjon om steder, og legger dette til om det finnes
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

  //søk innenfor en kategori
  const handleSearch = (e) => {
    e.preventDefault()
    applyFilters()
  }

  //håndter filtrering
  const applyFilters = () => {
    setPage(0) //tilbakestiller til første side ved filtrering

    const filters = {}

    if (searchQuery) {
      filters.keyword = searchQuery
    }

    if (dateFilter) {
      //returnerer dato og tid som string i ISO-format (ISO format for dato og tid vil si DD-MM-YYYY, hh:mm:ss)
      const date = new Date(dateFilter)
      filters.startDateTime = `${date.toISOString().split("T")[0]}T00:00:00Z`
    }

    if (countryFilter) {
      //konverter landnavn til landkode (Norge = NO osv.)
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

    fetchCategoryEvents(categoryName, 0, filters)
  }

  //tilbakestiller alle filtre
  const resetFilters = () => {
    setSearchQuery("")
    setDateFilter("")
    setCountryFilter("")
    setCityFilter("")
    fetchCategoryEvents(categoryName, 0)
  }

  //laster arrangementer når kategori endres eller side endres
  useEffect(() => {
    fetchCategoryEvents(categoryName, page)
  }, [categoryName, page])

  //sidenavigasjon
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage)
      window.scrollTo(0, 0)
    }
  }

  //navigering til søkesiden
  const handleGlobalSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  //t,oggle visning av filtre (i mobilvisning)
  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  if (loading) {
    return <div className="loading">Laster arrangementer...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="category-page">
      <h1>{formatCategoryName(categoryName)}</h1>

      <div className="filter-section">
        <button className="toggle-filters-button" onClick={toggleFilters}>
          {showFilters ? "Skjul filtre" : "Vis filtre"}
        </button>

        <div className={`filters-container ${showFilters ? "show" : ""}`}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                placeholder={`Søk i ${formatCategoryName(categoryName)}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  onChange={(e) => setCityFilter("")}
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

      {totalEvents > 0 ? (
        <div className="category-info">
          <p>
            Viser {events.length} av {totalEvents} arrangementer
          </p>
        </div>
      ) : (
        <div className="no-results">
          <p>Ingen arrangementer funnet med valgte filtre.</p>
          <button onClick={resetFilters} className="reset-filters-button">
            Tilbakestill filtre
          </button>
        </div>
      )}

      {events.length > 0 ? (
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
              <button onClick={() => handlePageChange(page - 1)} disabled={page === 0} className="pagination-button">
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
      ) : (
        <div className="no-events">
          <p>Ingen arrangementer funnet 😔 </p>
          <Link to="/" className="back-link">
            Tilbake til forsiden
          </Link>
        </div>
      )}
    </div>
  )
}

export default Category

import { useState, useEffect } from "react" 
import { useLocation, Link } from "react-router-dom" 
import "../styles/SearchResults.scss" 

const API_KEY = "pjEsHLGf9R4NAJ5lTIjG55PqpCvyY0oK" //Api-key fra developer api når man lager bruker

//const med Festival-Ids av de fire festivalene
const FESTIVAL_IDS = {
  TONS_OF_ROCK: "K8vZ917oWOV",
  FINDINGS: "K8vZ917K7fV",
  NEON: "K8vZ917_YJf",
  SKEIKAMPEN: "K8vZ917bJC7",
}

// Fallback-data hvis API ikke gir treff
const FALLBACK_FESTIVALS = [  ] 

// HOVEDKOMPONENT: Søkeresultater
const SearchResults = () => {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const query = searchParams.get("q") || ""

  // Tilstandsvariabler
  const [results, setResults] = useState({ events: [], attractions: [], venues: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("relevance")

  // Hjelpefunksjon: Finn beste bilde fra objekt
  const getBestImageUrl = (item, ratio = "16_9", minWidth = 500) => {
    if (!item?.images?.length) return "/placeholder.svg"
    const preferred = item.images.find((img) => img.ratio === ratio && img.width >= minWidth)
    return preferred?.url || item.images.reduce((a, b) => (a.width > b.width ? a : b)).url
  }

  // Hjelpefunksjon: Formatér dato som DD.MM.ÅÅÅÅ
  const formatDate = (dateString) => {
    if (!dateString) return "Dato ikke tilgjengelig"
    return new Intl.DateTimeFormat("nb-NO", { year: "numeric", month: "long", day: "numeric" }).format(new Date(dateString))
  }

  // Hjelpefunksjon: Hent stedsnavn fra event-data
  const getEventLocation = (event) => {
    const venue = event._embedded?.venues?.[0]
    if (!venue) return "Sted ikke tilgjengelig"
    const { name, city, country } = venue
    if (name && city?.name && country?.name) return `${name}, ${city.name}, ${country.name}`
    if (name && city?.name) return `${name}, ${city.name}`
    if (city?.name && country?.name) return `${city.name}, ${country.name}`
    return name || "Sted ikke tilgjengelig"
  }

  // Hent spesifikt arrangement med ID
  const fetchEventById = async (id) => {
    try {
      const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events/${id}?apikey=${API_KEY}`)
      if (!response.ok) throw new Error(`Status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error("Feil ved henting av arrangement:", error)
      return null
    }
  }

  // Søkefunksjon: henter events, artister og venues
  const searchAll = async (keyword) => {
    try {
      // Søk i events
      const eventsRes = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&keyword=${encodeURIComponent(keyword)}&countryCode=NO&size=20`)
      if (!eventsRes.ok) throw new Error(`Status: ${eventsRes.status}`)
      const eventsData = await eventsRes.json()
      let events = eventsData._embedded?.events || []

      // Søk i artister
      const attrRes = await fetch(`https://app.ticketmaster.com/discovery/v2/attractions.json?apikey=${API_KEY}&keyword=${encodeURIComponent(keyword)}&size=20`)
      if (!attrRes.ok) throw new Error(`Status: ${attrRes.status}`)
      const attractions = (await attrRes.json())._embedded?.attractions || []

      // Søk i venues
      const venuesRes = await fetch(`https://app.ticketmaster.com/discovery/v2/venues.json?apikey=${API_KEY}&keyword=${encodeURIComponent(keyword)}&countryCode=NO&size=20`)
      if (!venuesRes.ok) throw new Error(`Status: ${venuesRes.status}`)
      const venues = (await venuesRes.json())._embedded?.venues || []

      // Sjekk for festival-relaterte søk
      const includeFestivals = ["festival", "tons", "findings", "neon", "skeikampen"].some((term) =>
        keyword.toLowerCase().includes(term),
      )

      if (includeFestivals) {
        const existingIds = events.map((e) => e.id)
        const missing = []

        for (const id of Object.values(FESTIVAL_IDS)) {
          if (!existingIds.includes(id)) {
            const festival = await fetchEventById(id)
            if (festival) missing.push(festival)
          }
        }

        if (missing.length === 0 && events.length === 0) {
          const fallbackMatches = FALLBACK_FESTIVALS.filter((f) => f.name.toLowerCase().includes(keyword.toLowerCase()))
          events = [...events, ...fallbackMatches]
        } else {
          events = [...events, ...missing]
        }
      }

      return { events, attractions, venues }
    } catch (error) {
      console.error("Feil ved søk:", error)
      throw error
    }
  }

  // useEffect: kjører når søkeordet endres
  useEffect(() => {
    const fetchData = async () => {
      if (!query) return setLoading(false)
      try {
        setLoading(true)
        const data = await searchAll(query)
        setResults(data)
        setLoading(false)
      } catch {
        setError("Kunne ikke utføre søket. Prøv igjen senere.")
        setLoading(false)
      }
    }
    fetchData()
  }, [query])

  // Filtrering etter valgt kategori
  const getFilteredResults = () => {
    if (activeFilter === "all") return results
    return {
      events: activeFilter === "events" ? results.events : [],
      attractions: activeFilter === "attractions" ? results.attractions : [],
      venues: activeFilter === "venues" ? results.venues : [],
    }
  }

  // Sortering av filtrerte resultater
  const getSortedResults = (filtered) => {
    const { events, attractions, venues } = filtered
    if (sortOrder === "date") {
      return {
        events: [...events].sort((a, b) => new Date(a.dates?.start?.localDate || 0) - new Date(b.dates?.start?.localDate || 0)),
        attractions,
        venues,
      }
    }
    if (sortOrder === "name") {
      return {
        events: [...events].sort((a, b) => a.name.localeCompare(b.name)),
        attractions: [...attractions].sort((a, b) => a.name.localeCompare(b.name)),
        venues: [...venues].sort((a, b) => a.name.localeCompare(b.name)),
      }
    }
    return filtered
  }

  // Ferdig filtrerte og sorterte data
  const filtered = getFilteredResults()
  const sorted = getSortedResults(filtered)
  const total = sorted.events.length + sorted.attractions.length + sorted.venues.length

  // VISNING
  if (loading) return <div className="loading">Søker...</div>

  return (
    <div className="search-results-page">
      <h1>Søkeresultater for: "{query}"</h1>

      {error ? (
        <div className="error">{error}</div>
      ) : total === 0 ? (
        <div className="no-results">
          <p>Ingen resultater funnet for "{query}". Prøv et annet søkeord.</p>
        </div>
      ) : (
        <>
          {/* FILTER OG SORTERING */}
          <div className="search-filters">
            <div className="filter-buttons">
              {["all", "events", "attractions", "venues"].map((type) => (
                <button key={type} className={activeFilter === type ? "active" : ""} onClick={() => setActiveFilter(type)}>
                  {type === "all" && `Alle (${total})`}
                  {type === "events" && `Arrangementer (${results.events.length})`}
                  {type === "attractions" && `Artister (${results.attractions.length})`}
                  {type === "venues" && `Spillesteder (${results.venues.length})`}
                </button>
              ))}
            </div>
            <div className="sort-options">
              <label htmlFor="sort">Sorter etter:</label>
              <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="relevance">Relevans</option>
                <option value="date">Dato</option>
                <option value="name">Navn</option>
              </select>
            </div>
          </div>

          {/* ARRANGEMENTER */}
          {sorted.events.length > 0 && (activeFilter === "all" || activeFilter === "events") && (
            <section className="results-section">
              <h2>Arrangementer</h2>
              <div className="results-grid">
                {sorted.events.map((event) => (
                  <Link to={`/event/${event.id}`} key={event.id} className="result-card">
                    <div className="result-image">
                      <img src={getBestImageUrl(event)} alt={event.name} onError={(e) => (e.target.src = "/placeholder.jpg")} />
                    </div>
                    <div className="result-info">
                      <h3>{event.name}</h3>
                      <p className="result-date">{formatDate(event.dates?.start?.localDate)}</p>
                      <p className="result-location">{getEventLocation(event)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ARTISTER */}
          {sorted.attractions.length > 0 && (activeFilter === "all" || activeFilter === "attractions") && (
            <section className="results-section">
              <h2>Artister</h2>
              <div className="results-grid">
                {sorted.attractions.map((artist) => (
                  <div key={artist.id} className="result-card">
                    <div className="result-image">
                      <img src={getBestImageUrl(artist)} alt={artist.name} onError={(e) => (e.target.src = "/placeholder.jpg")} />
                    </div>
                    <div className="result-info">
                      <h3>{artist.name}</h3>
                      <p>{artist.classifications?.[0]?.segment?.name || "Artist/Utøver"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SPILLESTEDER */}
          {sorted.venues.length > 0 && (activeFilter === "all" || activeFilter === "venues") && (
            <section className="results-section">
              <h2>Spillesteder</h2>
              <div className="results-grid">
                {sorted.venues.map((venue) => (
                  <div key={venue.id} className="result-card">
                    <div className="result-image">
                      <img src={venue.images?.[0]?.url || "/placeholder.svg"} alt={venue.name} onError={(e) => (e.target.src = "/placeholder.jpg")} />
                    </div>
                    <div className="result-info">
                      <h3>{venue.name}</h3>
                      <p>
                        {venue.city?.name}
                        {venue.city && venue.country && ", "}
                        {venue.country?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default SearchResults
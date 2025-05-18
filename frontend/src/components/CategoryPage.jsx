import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import EventCard from "./EventCard"
import "../styles/CategoryPage.scss"

//API-nøkkel
const API_KEY = "pjEsHLGf9R4NAJ5lTIjG55PqpCvyY0oK"

const CategoryPage = () => {
  const { slug } = useParams()
  const [events, setEvents] = useState([])
  const [attractions, setAttractions] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wishlist, setWishlist] = useState([])

  const getBestImageUrl = (item, ratio = "16_9", minWidth = 500) => {
    if (!item || !item.images || !item.images.length) {
      return "/placeholder.svg"
    }

    //finn bilde med 16:9 forhold
    const preferredImage = item.images.find((img) => img.ratio === ratio && img.width >= minWidth)
    if (preferredImage) return preferredImage.url

    //hvis ikke, finn det største bildet
    const largestImage = item.images.reduce((prev, current) => {
      return prev.width > current.width ? prev : current
    })

    return largestImage.url
  }

  //visning av dato på siden for arrangementer i riktig format (DD-MM-YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return "Dato ikke tilgjengelig"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  //visning av event location
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

  //kategoritittel
  const getCategoryTitle = () => {
    const categoryTitles = {
      musikk: "Musikk",
      sport: "Sport",
      "teater-og-show": "Teater og show",
    }

    return categoryTitles[slug] || slug.charAt(0).toUpperCase() + slug.slice(1)
  }

  //laster events for kategori
  const fetchEventsByCategory = async (category, size = 12) => {
    try {
      const categoryMapping = {
        musikk: "Music",
        sport: "Sports",
        "teater-og-show": "Arts & Theatre",
      }

      const classificationName = categoryMapping[category] || category

      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&classificationName=${classificationName}&countryCode=NO&size=${size}`,
      )

      if (!response.ok) {
        throw new Error(`API-forespørsel feilet ${response.status}`)
      }

      const data = await response.json()
      return data._embedded && data._embedded.events ? data._embedded.events : []
    } catch (error) {
      console.error(`Feil ved henting av arrangementer for kategori ${category}:`, error)
      return []
    }
  }

  //laster artister etter kategori
  const fetchAttractionsByCategory = async (category, size = 6) => {
    try {
      const categoryMapping = {
        musikk: "Music",
        sport: "Sports",
        "teater-og-show": "Arts & Theatre",
      }

      const classificationName = categoryMapping[category] || category

      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/attractions.json?apikey=${API_KEY}&classificationName=${classificationName}&countryCode=NO&size=${size}`,
      )

      if (!response.ok) {
        throw new Error(`API-forespørsel feilet ${response.status}`)
      }

      const data = await response.json()
      return data._embedded && data._embedded.attractions ? data._embedded.attractions : []
    } catch (error) {
      console.error(`Feil ved henting av artister for kategori ${category}:`, error)
      return []
    }
  }

  //finner venues
  const fetchVenues = async (size = 6) => {
    try {
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/venues.json?apikey=${API_KEY}&countryCode=NO&size=${size}`,
      )

      if (!response.ok) {
        throw new Error(`API-forespørsel feilet med status ${response.status}`)
      }

      const data = await response.json()
      return data._embedded && data._embedded.venues ? data._embedded.venues : []
    } catch (error) {
      console.error("Feil ved henting av spillesteder:", error)
      return []
    }
  }

  //laster events for kategori
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true)

        //henter arrangementer for denne kategorien
        const eventsData = await fetchEventsByCategory(slug, 12)
        setEvents(eventsData)

        //henter artister for denne kategorien
        const attractionsData = await fetchAttractionsByCategory(slug, 6)
        setAttractions(attractionsData)

        //henter venues
        const venuesData = await fetchVenues(6)
        setVenues(venuesData)

        setLoading(false)
      } catch (error) {
        console.error(`Feil ved henting av data ${slug}:`, error)
        setError(`Kunne ikke hente data for ${getCategoryTitle()}.`)
        setLoading(false)
      }
    }

    fetchCategoryData()
  }, [slug])
  //funksjonalitet for å legge til/fjerne i wishlist
  //jeg så på dette forum-innlegget for å få en ide om hvordan man kan lage en fungerende wishlist med add og remove-funksjonalitet:
  //https://stackoverflow.com/questions/70447055/how-do-you-add-toggle-functionality-to-a-wishlist-button-to-add-and-remove-items
  //Google-søk: javascript how to make a wishlist you can add and remove items from
  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((itemId) => itemId !== id))
    } else {
      setWishlist([...wishlist, id])
    }
  }

  if (loading) return <div className="loading">Laster inn...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="category-page">
      <h1>{getCategoryTitle()}</h1>

      <section className="category-section">
        <h2>Artister</h2>
        {attractions.length > 0 ? (
          <div className="items-grid">
            {attractions.map((attraction) => (
              <div className="category-card" key={attraction.id}>
                <div
                  className={`wishlist-icon ${wishlist.includes(attraction.id) ? "wishlisted" : ""}`}
                  onClick={() => toggleWishlist(attraction.id)}
                >
                  {wishlist.includes(attraction.id) ? "❤️" : "🤍"}
                </div>
                <div className="card-image-container">
                  <img
                    src={getBestImageUrl(attraction) || "/placeholder.svg"}
                    alt={attraction.name}
                    className="card-image"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.jpg"
                    }}
                  />
                </div>
                <div className="card-info">
                  <h3>{attraction.name}</h3>
                  <p>
                    {attraction.classifications?.[0]?.segment?.name === "Music"
                      ? "Musikk"
                      : attraction.classifications?.[0]?.segment?.name === "Sports"
                        ? "Sport"
                        : attraction.classifications?.[0]?.segment?.name === "Arts & Theatre"
                          ? "Kunst & Teater"
                          : "Artist"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results">Ingen artister funnet</p>
        )}
      </section>

      <section className="category-section">
        <h2>Arrangementer</h2>
        {events.length > 0 ? (
          <div className="items-grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                date={formatDate(event.dates?.start?.localDate)}
                location={getEventLocation(event)}
                imageUrl={getBestImageUrl(event)}
              />
            ))}
          </div>
        ) : (
          <p className="no-results">Ingen arrangementer funnet</p>
        )}
      </section>

      <section className="category-section">
        <h2>Spillesteder</h2>
        <div className="items-grid">
          {venues.map((venue) => (
            <div className="category-card" key={venue.id}>
              <div
                className={`wishlist-icon ${wishlist.includes(venue.id) ? "wishlisted" : ""}`}
                onClick={() => toggleWishlist(venue.id)}
              >
                {wishlist.includes(venue.id) ? "❤️" : "🤍"}
              </div>
              <div className="card-image-container">
                <img
                  src={venue.images?.[0]?.url || "/placeholder.svg"}
                  alt={venue.name}
                  className="card-image"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = "/placeholder.jpg"
                  }}
                />
              </div>
              <div className="card-info">
                <h3>{venue.name}</h3>
                <p>
                  {venue.city?.name}, {venue.country?.name === "Norway" ? "Norge" : venue.country?.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default CategoryPage

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FALLBACK_FESTIVALS, fetchAllFestivals, fetchFestivalImages, API_KEY } from "../../lib/fallbackFestivalData"
import "../styles/Home.scss"

// Ticketmaster bruker segmentId-er for å filtrere typer arrangementer. Denne representerer musikkarrangementer.
// Kilde: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/#segment-list-v2
const MUSIC_SEGMENT_ID = "KZFzniwnSyZfZ7v7nJ"

const Home = () => {
  //state-variabler
  const [festivals, setFestivals] = useState([]) //liste med festivaldata
  const [musicEvents, setMusicEvents] = useState([]) //liste med musikkarrangementer
  const [loading, setLoading] = useState(true) //indikator for om innhold vises
  const [error, setError] = useState(null) //feilmelding ved feil i lasting
  const [favorites, setFavorites] = useState({}) //favoritter lagret som objekt (event.id -> event)

  
//laster inn lagrede favoritter fra localStorage når komponenten rendres første gang
// kilde: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

  useEffect(() => {
    const savedFavorites = localStorage.getItem("eventFavorites")
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (e) {
        console.error("Feil ved lasting av favoritter:", e)
        setFavorites({})
      }
    }
  }, [])

  
  //Oppdaterer localstorage hver gang favoritter endres
  useEffect(() => {
    localStorage.setItem("eventFavorites", JSON.stringify(favorites))
  }, [favorites])

  
//Legger til favoritter eller fjerner favoritter
  const toggleFavorite = (event, e) => {
    e.preventDefault() //Forhindre link-navigasjon
    e.stopPropagation() //Stopper event bubbling

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
      return newFavorites
    })
  }

  //Henter beste bilde fra event
  //Kilde: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/#search-events-v2

  //finner bilde med 16:9 ratio
  const getBestImageUrl = (event, ratio = "16_9", minWidth = 500) => {
  
    const preferredImage = event.images.find((img) => img.ratio === ratio && img.width >= minWidth)
    if (preferredImage) return preferredImage.url

    //Fallback: bruk største bildet
    const largestImage = event.images.reduce((prev, current) => {
      return prev.width > current.width ? prev : current
    })

    return largestImage.url
  }

  //Formaterer dato til norsk format
  const formatDate = (dateString) => {
    if (!dateString) return "Dato ikke tilgjengelig"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  //Henter sted for event
  const getEventLocation = (event) => {
    if (!event._embedded || !event._embedded.venues || !event._embedded.venues[0]) {
      return "Sted ikke tilgjengelig"
    }
    /*Kilde: Ticketmaster dokumentasjon:
   https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
   lenken viser hvordan event-data er strukturert og hvordan _embedded brukes
  */
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

  //Henter musikkarrangementer fra Ticketmaster
  const fetchMusicEvents = async (size = 6) => {
    try {
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events?apikey=${API_KEY}&countryCode=NO&size=${size}&segmentId=${MUSIC_SEGMENT_ID}`,
      )

      if (!response.ok) {
        throw new Error(`API-forespørsel feilet med status ${response.status}`)
      }

      const data = await response.json()
      return data._embedded && data._embedded.events ? data._embedded.events : []
    } catch (error) {
      console.error("Feil ved henting av musikkarrangementer:", error)
      return []
    }
  }

  //henter bilder for festivaler, brukes hvis API-data mangler bilder
  const fetchFestivalImagesAndUpdate = async (festival) => {
    try {
      const images = await fetchFestivalImages(festival.id)
      if (images && images.length > 0) {
        return {
          ...festival,
          imageUrl: images[0].url,
          images: images,
        }
      }
      return {
        ...festival,
        imageUrl: "/abstract-geometric-shapes.png",
      }
    } catch (error) {
      console.error(`Feil ved henting av bilder for festival ${festival.id}:`, error)
      return {
        ...festival,
        imageUrl: "/abstract-geometric-shapes.png",
      }
    }
  }

  //laster data, festivaler og musikkevents
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        //henter festivaler, eller fallback hvis det feiler
        let festivalsData = []
        try {
          festivalsData = await fetchAllFestivals()
          console.log("Festivaler hentet fra API:", festivalsData)
        } catch (apiError) {
          console.error("Feil ved henting fra API, bruker reservedata:", apiError)
        }

        //hvis det ikke er noen data, så brukes fallback 
        if (!festivalsData || festivalsData.length === 0) {
          console.log("Bruker reservedata for festivaler")

          
          const festivalsWithImages = await Promise.all(
            FALLBACK_FESTIVALS.map(async (festival) => {
              return await fetchFestivalImagesAndUpdate(festival)
            }),
          )

          const festivalsWithUrls = festivalsWithImages.map((festival) => ({
            ...festival,
            url: `/event/${festival.id}`,
          }))

          setFestivals(festivalsWithUrls)
        } else {
          
          //formater festivalene
          const formattedFestivals = festivalsData.map((festival) => ({
            id: festival.id,
            name: festival.name,
            date: festival.dates?.start?.localDate
              ? formatDate(festival.dates.start.localDate)
              : "Dato ikke tilgjengelig",
            location: getEventLocation(festival),
            imageUrl: getBestImageUrl(festival),
            url: `/event/${festival.id}`,
            ticketUrl: festival.url,
          }))

          setFestivals(formattedFestivals)
        }

       //hent musikkarrangementer
        const eventsData = await fetchMusicEvents(6)
        setMusicEvents(eventsData)

        setLoading(false)
      } catch (err) {
        console.error("Feil ved lasting av data", err)
        setError("Kunne ikke laste innhold. Vennligst prøv igjen senere.")
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <div className="loading">Laster innhold...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="home-page">
      <section className="festivals-section">
        <h2>Sommerens festivaler!</h2>
        <div className="festivals-grid">
          {/*går gjennom listen over festivaler og viser hver festival som et kort */}
          {festivals.map((festival) => (
            <Link to={festival.url} key={festival.id} className="festival-card-link">
              <div className="festival-card">
              
                {/*fallback-bilde hvis bilde mangler*/}
                <img
                  src={festival.imageUrl || "/abstract-geometric-shapes.png"}
                  alt={festival.name}
                  className="festival-image"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = "/abstract-geometric-shapes.png"
                  }}
                />
                {/*festivalnavn, dato, sted og lenke*/}
                <div className="festival-info">
                  <h3>{festival.name}</h3>
                  <p className="festival-date">{festival.date}</p>
                  <p className="festival-location">{festival.location}</p>
                  <p className="festival-link">Les mer om {festival.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="events-section">
        <h2>Arrangementer</h2>
        <div className="events-grid">
          {musicEvents.length > 0 ? (
            musicEvents.map((event) => (
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
                    {/*fallback-bilde*/}
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
            ))
          ) : (
            <p className="no-events">Ingen arrangementer funnet</p>
          )}
        </div>
      </section>

      {Object.keys(favorites).length > 0 && (
        <section className="favorites-section">
          <h2>Dine favoritter</h2>
          <div className="favorites-grid">
            {Object.values(favorites).map((favorite) => (
              <Link to={`/event/${favorite.id}`} key={favorite.id} className="favorite-card-link">
                <div className="favorite-card">
                  <button
                    className="heart-button active"
                    onClick={(e) => toggleFavorite({ id: favorite.id, name: favorite.name }, e)}
                    aria-label="Fjern fra favoritter"
                  >
                    ❤️
                  </button>
                  <div className="favorite-image-container">
                    {/*fallback-bilde*/}
                    <img
                      src={favorite.imageUrl || "/abstract-geometric-shapes.png"}
                      alt={favorite.name}
                      className="favorite-image"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/abstract-geometric-shapes.png"
                      }}
                    />
                  </div>
                  {/*favorittens navn og dato*/}
                  <div className="favorite-info">
                    <h3>{favorite.name}</h3>
                    {favorite.date && <p className="favorite-date">{formatDate(favorite.date)}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Home

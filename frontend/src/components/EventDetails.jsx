import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { getFestivalById, fetchFestivalDetails, fetchFestivalImages } from "../../lib/fallbackFestivalData"
import "../styles/EventDetails.scss"

const EventDetails = () => {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [eventImages, setEventImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
//vi brukte useParams for å hente arrangement-ID fra URL-en
//opprettet flere state-variabler for å håndtere arrangementsdata, bilder, loadingstatus, feilhåndtering


  //denne funksjonen tar et array med bildeobjekter som forsøker å finne et bilde med 16:9 aspect ratio
  //dette faller tilbake til det største tilgjengelige bildet hvis ingen matcher
  
  const getBestImageUrl = (images, ratio = "16_9", minWidth = 800) => {
  
    //prøver å finne et bilde med aspectratioet
    const preferredImage = images.find((img) => img.ratio === ratio && img.width >= minWidth)
    if (preferredImage) return preferredImage.url

    //hvis det er ingen foretrukket forhold, så finner den det største bildet
    const largestImage = images.reduce((prev, current) => {
      return prev.width > current.width ? prev : current
    })

    return largestImage.url
  }


  //denne funksjonen sjekker om dateString er null, undefined, tom streng
  //returnerer "Dato ikke tilgjengelig" hvis ingen dato er gitt
  //konverterer dateString til et Date-objekt
  //bruker intl.DateTimeFormat for å formatere datoen i norsk format. Med norsk format menes det for eksempel slik: "15. januar 2025"
  const formatDate = (dateString) => {
    if (!dateString) return "Dato ikke tilgjengelig"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  //denne sjekker om timeString er null, undefined eller en tom streng
  //den returnerer en tom streng hvis ungen tid er gitt
  //splitter timeString med ":" for å få timer og minutter.
  //returnerer formatet hours og minutes 
  const formatTime = (timeString) => {
    if (!timeString) return ""

    const [hours, minutes] = timeString.split(":")
    return `${hours}:${minutes}`
  }



  //denne henter event-detaljer ved bruk av useEffect.
  //i andre ord så henter dette detaljer om et arrangement ved hjelp av en API eller fallback-dataen vi opprettet hvis det er feil med API-et.
  //her starter den en async når komponenten monteres via useEffect
  //setter en loading status for å vise at den laster til nettsiden
  //henterer API-feil ved å fange opp eventuelle feil som oppstår under API-kallet
  //implementerer fallback, altså når API-kallet feiler eller ikke returnerer data, prøver den å hente reserve data fra getFestivalById(id)
  //det kommer opp en feil hvis verken API eller fallback gir resultater
  //oppdaterer komponentens state med de fetchende dataene. 
  //Kilder: React Query Dokumentasjon tanstack.com/query/latest/docs/react/guides/background-fetching-indicators](https://tanstack.com/query/latest/docs/react/guides/background-fetching-indicators)
  //MDN Web Docs om Fetch API og feilhåndtering:
  //https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful(https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful)
  //React.dev om datahenting i useEffect:
  //https://react.dev/reference/react/useEffect#fetching-data-with-effects(https://react.dev/reference/react/useEffect#fetching-data-with-effects)
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Henter detaljer for arrangement med ID:", id)

        // Prøv å hente arrangementdetaljer fra API
        let eventData = null
        try {
          eventData = await fetchFestivalDetails(id)
          console.log("Arrangement hentet fra API:", eventData)
        } catch (apiError) {
          console.error("Feil ved henting fra API:", apiError)
        }

        //hvis API-kallet feiler eller ikke returnerer data, så sjekker det om vi har reservedata
        if (!eventData) {
          console.log("Sjekker reservedata for festival:", id)
          eventData = getFestivalById(id)

          if (eventData) {
            console.log("Bruker reservedata for festival:", id)
          } else {
            throw new Error("Kunne ikke finne arrangementet")
          }
        }

        setEvent(eventData)






        //henter bilder for arrangementet
        try {
          const images = await fetchFestivalImages(id)
          console.log("Bilder hentet for arrangement:", images)
          setEventImages(images)
        } catch (imageError) {
          console.error("Feil ved henting av bilder:", imageError)
          // Fortsett med eventuelle bilder som allerede finnes i eventData
          setEventImages(eventData.images || [])
        }

        setLoading(false)
      } catch (error) {
        console.error(`Feil ved henting av arrangement med ID ${id}:`, error)
        setError("Kunne ikke hente arrangementsinformasjon. Prøv igjen senere.")
        setLoading(false)
      }
    }




    //Kaller fetchEventDetails-funksjonen når komponenten monteres eller når id endres
    //implementerer tilstansbasert rendering: 
    //viser en loading indicator når data hentes
    //viser en feilmelding hvis noe gikk galt
    //viser en melding som står "ikke funnet" hvis ingen arrangement ble funnet
    //Kilder
    //React.dev om betinget rendering: https://react.dev/learn/conditional-rendering
    //MDN Web Docs om Optional Chaining:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
    //MDN Web Docs om Nullish Coalescing:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
    fetchEventDetails()
  }, [id])

  if (loading) {
    return <div className="loading">Laster inn arrangementsinformasjon...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  if (!event) {
    return <div className="error">Fant ikke arrangementet.</div>
  }

  const venue = event._embedded?.venues?.[0]
  const attractions = event._embedded?.attractions || []

  //bruker enten bilder fra separate API-kall eller fra event-objektet
  const allImages = eventImages.length > 0 ? eventImages : event.images || []
  const mainImageUrl = getBestImageUrl(allImages)

  return (
    <div className="event-details">
      <div className="event-header">
        <div className="event-image-container">
          <img
            src={mainImageUrl || "/placeholder.svg"}
            alt={event.name}
            className="event-image"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "/abstract-geometric-shapes.png"
            }}
          />
        </div>

        <div className="event-info">
          <h1>{event.name}</h1>

          <div className="event-meta">
            <div className="meta-item">
              <span className="meta-label">Dato:</span>
              <span className="meta-value">{formatDate(event.dates?.start?.localDate)}</span>
            </div>

            {event.dates?.start?.localTime && (
              <div className="meta-item">
                <span className="meta-label">Tid:</span>
                <span className="meta-value">{formatTime(event.dates.start.localTime)}</span>
              </div>
            )}

            {venue && (
              <div className="meta-item">
                <span className="meta-label">Sted:</span>
                <span className="meta-value">
                  {venue.name}
                  {venue.city && `, ${venue.city.name}`}
                  {venue.country && `, ${venue.country.name === "Norway" ? "Norge" : venue.country.name}`}
                </span>
              </div>
            )}

            {event.priceRanges && event.priceRanges.length > 0 && (
              <div className="meta-item">
                <span className="meta-label">Pris:</span>
                <span className="meta-value">
                  {event.priceRanges[0].min} - {event.priceRanges[0].max} {event.priceRanges[0].currency}
                </span>
              </div>
            )}
          </div>

          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer" className="buy-tickets-button">
              Kjøp billetter
            </a>
          )}
        </div>
      </div>

      <div className="event-content">
        {event.info && (
          <section className="event-section">
            <h2>Om arrangementet</h2>
            <div dangerouslySetInnerHTML={{ __html: event.info }} />
          </section>
        )}

        {attractions.length > 0 && (
          <section className="event-section">
            <h2>Artister</h2>
            <div className="attractions-list">
              {attractions.map((attraction) => (
                <div key={attraction.id} className="attraction-item">
                  <img
                    src={attraction.images?.[0]?.url || `/abstract-geometric-shapes.png` || "/placeholder.svg"}
                    alt={attraction.name}
                    className="attraction-image"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `/abstract-geometric-shapes.png`
                    }}
                  />
                  <h3>{attraction.name}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

        {venue && (
          <section className="event-section">
            <h2>Spillested</h2>
            <div className="venue-info">
              <h3>{venue.name}</h3>
              <p>
                {venue.address?.line1}
                {venue.city && `, ${venue.city.name}`}
                {venue.postalCode && ` ${venue.postalCode}`}
                {venue.country && `, ${venue.country.name === "Norway" ? "Norge" : venue.country.name}`}
              </p>

              {venue.url && (
                <a href={venue.url} target="_blank" rel="noopener noreferrer" className="venue-link">
                  Besøk nettsted
                </a>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="back-link-container">
        <Link to="/" className="back-link">
         Tilbake til forsiden
        </Link>
      </div>
    </div>
  )
}

export default EventDetails

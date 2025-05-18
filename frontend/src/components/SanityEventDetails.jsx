 
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { client } from "../../lib/sanity"
import { urlFor } from "../../lib/imageUrlBuilder" //Brukes for å generere bildeadresser ifra Sanity
import "../styles/SanityEventDetails.scss"

const SanityEventDetails = () => {
  //Henter id fra url ved hjelp av useParams
  const { id } = useParams()
  //Brukes for å se tilstanden til arrengement,lasting, feil og ønskeliste
  const [event, setEvent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wishlist, setWishlist] = useState([])

  //Henter ønskelisten ifra Localstorage ved første lasting
  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist")
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist))
      } catch (err) {
        console.error("localStorage error", err)
      }
    }
  }, [])

 //her sjekkes det om dette arrangementet finnes i ønskelisten
  const isInWishlist = () => {
    return event && wishlist.some((item) => item.id === event._id)
  }

//Legger til og fjerner arrangemanger fra ønskelisten
  const toggleWishlist = () => {
    if (!event) return

    setWishlist((prevWishlist) => {
      const eventInWishlist = prevWishlist.some((item) => item.id === event._id)

      if (eventInWishlist) {
        //Fjerner ifra ønskelisten
        const newWishlist = prevWishlist.filter((item) => item.id !== event._id)
        localStorage.setItem("wishlist", JSON.stringify(newWishlist))
        return newWishlist
      } else {
        //Legg til i ønskelisten
        const newWishlist = [
          ...prevWishlist,
          {
            id: event._id,
            name: event.title,
            image: event.image ? urlFor(event.image).url() : null,
            date: event.date || null,
          },
        ]
        localStorage.setItem("wishlist", JSON.stringify(newWishlist))
        return newWishlist
      }
    })
  }

  //Henter arrangement data ifra Sanity
  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsLoading(true)
      try {
        
        //Her er det en Sanity spørring basert på _id
        const query = `*[_type == "event" && _id == $id][0]{
          _id,
          title,
          description,
          "imageUrl": image.asset->url,
          date,
          venue,
          city,
          category,
          apiId
        }`

        const data = await client.fetch(query, { id })

        if (!data) {
          throw new Error("fant ikke event")
        }

        console.log("Sanity event data:", data)
        setEvent(data)
      } catch (err) {
        console.error("Error", err)
        setError("får ikke lastet.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventDetails()
  }, [id])

  //Formaterer dato til norsk format
  const formatDate = (dateString) => {
    if (!dateString) {
      return "Dato ikke tilgjengelig"
    }

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  //Viser lastingstekst
  if (isLoading) {
    return <div className="loading">Laster arrangement</div>
  }

  //Viser feilmelding
  if (error) {
    return <div className="error">{error}</div>
  }
  //Hvis event ikke blir funnet
  if (!event) {
    return <div className="error">Arrangementet ble ikke funnet</div>
  }

  //Hovedinnholdet som vises når data er lastet
  return (
    <div className="sanity-event-page">
      <div
        className="event-header"
        style={{
          //bruker arrangementets bilde, eller standardbilde
          backgroundImage: event.imageUrl
            ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${event.imageUrl})`
            : `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80)`,
        }}
      >
        <div className="event-header-content">
          <div className="event-title-row">
            <h1>{event.title}</h1>
            <button
              className={`wishlist-button ${isInWishlist() ? "active" : ""}`}
              onClick={toggleWishlist}
              aria-label={isInWishlist() ? "Fjern fra ønskeliste" : "Legg til ønskeliste"}
            >
              {/*hjertesymbol SVG. Dette ble foreslått av Microsoft Copilot, egentlig med uhell da vi prøve å lage et symbol med generativ AI.
              Prompt: "Lag et hjerte som SVG, som jeg kan bruke til en favorittfunksjon i mitt react-prosjekt" (Joakim)
              Denne løsningen gjør det mulig å lage vektorgrafikk. Det er Path som tegner hjerteformen, viewBox definerer bredde og høyde.
              (24x24 i dette tilfellet). Strokewidth setter tykkelse, strokeLinecap og strokeLinejoin er satt til round for å gi myke linjer og runde hjørner*/}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isInWishlist() ? "currentColor" : "none"}
                //*fyller hjertet om isInWishlist() er true
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {/*Det skal innrømmes at dette kanskje ikke hadde vært hensiktsmessig å gjøre, men jeg (Joakim) syns det var en litt kul løsning*/}
            </button>
          </div>
          <p className="event-date">{formatDate(event.date)}</p>
          <p className="event-location">
            {event.city ? `${event.venue}, ${event.city}` : event.venue || "Sted ikke tilgjengelig"}
          </p>

          {event.category && (
            <div className="event-genres">
              <span className="genre-tag">{event.category}</span>
            </div>
          )}
        </div>
      </div>
      {/*arrangement innhold*/}
      <div className="event-content">
        <section className="event-description">
          <h2>Om arrangementet</h2>
          {event.description ? (
            <div className="description-text">
              <p>{event.description}</p>
            </div>
          ) : (
            <p>Ingen beskrivelse tilgjengelig</p>
          )}
        </section>


     
        {/*viser Ticketmaster-link om tilgjengelig*/}
        {event.apiId && (
          <section className="event-ticketmaster">
            <h2>Ticketmaster</h2>
            <p>Dette arrangementet er også tilgjengelig på Ticketmaster</p>
            <a href={`/event/${event.apiId}`} className="ticketmaster-link">
              Se på Ticketmaster
            </a>
          </section>
        )}
      </div>
    </div>
  )
}

export default SanityEventDetails

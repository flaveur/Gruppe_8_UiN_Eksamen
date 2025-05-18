import { useState } from "react"
import { Link } from "react-router-dom"
import "../styles/EventCard.scss"

//Her så dfinerer vi EventCard-komponenten som tar imot pros; id, name, date, location og imageUrl.
const EventCard = ({ id, name, date, location, imageUrl }) => {
  // useState er for å holde styr på om arrangementet er lagt til i ønskelista.
  const [isWishlisted, setIsWishlisted] = useState(false)

  // dette er når vi håndterer feil ved lasting av bilder.
  const [imageError, setImageError] = useState(false)


  //denne funksjonen er for å legge til eller fjerne arrangementet fra ønskelista
  const toggleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
  }
//funksjonen som er onerror-handler for bildet. dette aktiveres hvis det er feil med bildeinnlastinga.
  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className="event-card">
       {/* wishlist viser fylt hjerte hvis arrangementet 
       er i ønskelisten, ellers så er det tomt. */}
      <div className={`wishlist-icon ${isWishlisted ? "wishlisted" : ""}`} onClick={toggleWishlist}>
        {isWishlisted ? "❤️" : "🤍"} {/*hjerte-symboler for favorisering, hentet her: https://emojipedia.org/no*/}
      </div>

      <Link to={`/event/${id}`}>
        <div className="event-image-container">
            {/* dette viser bildet hvis det er tilgjengelig 
            og ikke har noe feil med å laste inn */}
          {!imageError ? (
            <img src={imageUrl || "/placeholder.svg"} alt={name} className="event-image" onError={handleImageError} />
          ) : (
             // viser en placeholder med første bokstav i navnet hvis bildeinnlasting feiler.

            <div className="event-image-placeholder">
              <span>{name.charAt(0)}</span>
            </div>
          )}
        </div>


        <div className="event-info">
          <h3>{name}</h3>
          <p className="event-date">{date}</p>
          <p className="event-location">{location}</p>
        </div>
         {/* har gitt classes til p med event-info, event-date og event-location. 
         dette viser informasjon om arrangementet ved navn, dato og sted. */}
      </Link>
    </div>
  )
}

export default EventCard

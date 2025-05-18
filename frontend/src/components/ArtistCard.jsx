import "../styles/ArtistCard.scss"

const ArtistCard = ({ artist }) => {
  //henter artistdata
  const { name, image, genre, description } = artist

  return (
    <div className="artist-card">
      {/*for å vise artistbilde*/}
      <div className="artist-card-image-container">
        <img
          src={image || "/placeholder.svg?height=300&width=300"}
          alt={name || "Artist"}
          className="artist-card-image"
        />
      </div>
      {/*vise detaljer om artist*/}
      <div className="artist-card-content">
        <h3 className="artist-card-name">{name || "Ukjent artist"}</h3>
        {genre && <p className="artist-card-genre">{genre}</p>}
        {description && <p className="artist-card-description">{description}</p>}
      </div>
    </div>
  )
}

export default ArtistCard

import { Link } from "react-router-dom"

function Eventcard({ event }) {
    return (
        <article className = "event-card">
            <h2>{event.name}</h2>
            <Link to ={`/event/${event.id}`}>Les mer</Link>
        </article>
    );
}

export default Eventcard;
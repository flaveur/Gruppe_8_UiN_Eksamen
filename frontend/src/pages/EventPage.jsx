import { useParams } from "react-router-dom"

function Eventpage() {
    const { id } = useParams

    return (
        <div>
            <h1>Event ID: {id}</h1>
        </div>
    );
}

export default Eventpage
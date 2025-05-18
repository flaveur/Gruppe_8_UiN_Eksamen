import {link} from "react-router-dom"

function Navbar() {
    return (
        <nav>
            <link to ="/" classname="Logo">Logo</link>
            <ul>
                <li><link to ="/category/musikk/">Musikk</link></li>
                <li><link to ="/category/sport/">Sport</link></li>
                <li><link to ="/category/teater/">Teater</link></li>
            </ul>
            <link to ="/dashboard">Logg inn</link>
        </nav>
    );
}

export default Navbar;
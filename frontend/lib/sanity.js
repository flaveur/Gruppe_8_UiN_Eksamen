import { createClient } from "@sanity/client"
const client = createClient({
  projectId: "zro1sm4c", 
  dataset: "production",
  useCdn: false, 
  apiVersion: "2025-05-15", 
})


// eksporterer en async function der hvor den sjekker om en bruker med gitt e-post finnes i sanity
export async function checkUserExists(email) {
  try {
    // her så henter den bruker basert på e-post
    const query = `*[_type == "user" && email == $email][0]`
    const user = await client.fetch(query, { email })
    return !!user // returnerer true hvis brukeren finnes, false hvis ikke
  } catch (error) { //catcher error og console-errorer "Error checking if user exists".
    console.error("Error checking if user exists:", error)
    return false
  }
}

// funksjonen for å autentisere en bruker
// exporterer async function autheticateUser
export async function authenticateUser(email, password) {
  try {
    //Denne koden henter bruker med all relatert informasjon, navn, email, passord, kjønn, alder, bilde, wishlist, forrige kjøp og venner
    const query = `*[_type == "user" && email == $email][0]{
      _id,
      name,
      email,
      password,
      gender,
      age,
      image,
      "wishlist": wishlist[]->{_id, title, apiId},
      "previousPurchases": previousPurchases[]->{_id, title, apiId},
      "friends": friends[]->{_id, name, email, "wishlist": wishlist[]->{_id, title}}
    }`

    //lager en const med user = await client.fetch 
    const user = await client.fetch(query, { email })
    //hvis bruker ikke blir funnet/ikke finnes, får man en melding "Bruker ikke funnet"
    if (!user) {
      return { success: false, message: "Bruker ikke funnet" }
    }

    //hvis passordet ikke stemmer, kommer det "Feil Passord"
    if (user.password !== password) {
      return { success: false, message: "Feil passord" }
    }

    //fjerner passordet fra bruker-objektet før det returneres
    //Kilde: Dette er hentet fra LLM-et Claude Sonnet 3.7
    //Prompt: "(Limte inn koden over for kontekst). Hvordan implementerer jeg fjerning av passordfeltet før det returneres?"
    //Bruk: linje 58-64, grunnen til bruk var fordi vi var usikre på om vi forstod konseptet, så vi spurte claude om implementeringen.
    const { password: _, ...userWithoutPassword } = user

    return { success: true, user: userWithoutPassword }
  } catch (error) {
    console.error("Authentication error:", error)
    return { success: false, message: "En feil oppstod under innlogging" }
  }
}

//denne funksjonen legger til event i wishlista
export async function addToWishlist(userId, eventId) {
  try {
    //sjekker om arrangementet allerede er i ønskelisten
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        "hasEvent": count(wishlist[_ref == $eventId]) > 0
      }`,
      { userId, eventId },
    )


    //hvis arrangementet allerede er i ønskelista, så kommer det "Arrangementet er allerede"
    if (user?.hasEvent) {
      return { success: false, message: "Arrangementet er allerede i ønskelisten" }
    }

    //dette legger til arrangementet i ønskelisten
    await client
      .patch(userId)
      .setIfMissing({ wishlist: [] })
      .append("wishlist", [{ _ref: eventId, _type: "reference" }])
      .commit()

    return { success: true }
  } catch (error) {
    console.error("Error adding to wishlist:", error)
    return { success: false, message: "Kunne ikke legge til i ønskelisten" }
  }
}

//funksjonen er for å fjerne et spesifikk arrangement fra ønskelista til en bruker i sanity.
//her bruker vi patch til å finne og slette referansen til arrangementet.
//når et arrangement fra ønskelisten blir fjernet og den er vellykket, returnerer det success: true
//om det oppstår en feil, har vi lagt til konsoll.error og return.
export async function removeFromWishlist(userId, eventId) {
  try {
    await client
      .patch(userId)
      .unset([`wishlist[_ref == "${eventId}"]`])
      .commit()

    return { success: true }
  } catch (error) {
    console.error("Error ved fjerning fra ønskelisten:", error)
    return { success: false, message: "Kunne ikke fjerne fra ønskelisten" }
  }
}


export default client

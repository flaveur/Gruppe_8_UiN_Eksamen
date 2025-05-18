export const FESTIVAL_IDS = {
  TONS_OF_ROCK: "Z698xZb_Z17q3rv", 
  FINDINGS: "Z698xZb_Z16v7eGkFy",
  NEON: "Z698xZb_Z17q339",
  SKEIKAMPEN: "Z698xZb_Z17qfa6",
}

//her opprettet vi et objekt som inneholder ID-ene for de fire festivalene.
//Vi fant disse id-ene gjennom Explorer API siden fra Ticketmaster

export const TICKETMASTER_URLS = {
  TONS_OF_ROCK: "https://www.ticketmaster.no/event/festivalpass-4-dager-tons-of-rock-2025-billetter/747417",
  FINDINGS: "https://www.ticketmaster.no/event/findings-festival-2025-festivalpass-billetter/1102306239",
  NEON: "https://www.ticketmaster.no/event/neon-%7C-lordagspass-billetter/752497",
  SKEIKAMPEN: "https://www.ticketmaster.no/event/skeikampenfestivalen-dagspass-lrdag-billetter/754247",
}

//dette er direkte lenker til billettene for hver festival på Ticketmaster.
// Dette brukes for "Kjøp biletter"-knappene i EventDetails.


export const API_KEY = "pjEsHLGf9R4NAJ5lTIjG55PqpCvyY0oK"
//Vår developer API key

//dette er et array med "fallback data". 
//dette er kun brukt som reservedata hvis Ticketmaster API ikke fungerer eller når det returnerer feil.
export const FALLBACK_FESTIVALS = [
  {
    id: FESTIVAL_IDS.TONS_OF_ROCK,
    name: "Tons of Rock Festival 2025",
    date: "25. juni 2025",
    location: "Ekebergsletta, Oslo, Norge",
    description: "Tons of Rock er Norges største rockfestival og arrangeres på Ekebergsletta i Oslo.",
    ticketUrl: TICKETMASTER_URLS.TONS_OF_ROCK,
  },
  {
    id: FESTIVAL_IDS.FINDINGS,
    name: "Findings Festival 2025",
    date: "15. august 2025",
    location: "Bislett Stadion, Oslo, Norge",
    description:
      "Findings Festival er en av Norges mest populære musikkfestivaler, med fokus på elektronisk musikk, pop og urban musikk.",
    ticketUrl: TICKETMASTER_URLS.FINDINGS,
  },
  {
    id: FESTIVAL_IDS.NEON,
    name: "Neon Festival 2025",
    date: "5. juli 2025",
    location: "Dahls Arena, Trondheim, Norge",
    description:
      "NEON Festival er en av Norges nyeste og mest spennende musikkfestivaler, med fokus på elektronisk musikk, pop og R&B.",
    ticketUrl: TICKETMASTER_URLS.NEON,
  },
  {
    id: FESTIVAL_IDS.SKEIKAMPEN,
    name: "Skeikampen Festival 2025",
    date: "18. juli 2025",
    location: "Skeikampen, Gausdal, Norge",
    description:
      "Skeikampenfestivalen er en intim og sjarmerende festival som arrangeres i naturskjønne omgivelser på Skeikampen i Gausdal.",
    ticketUrl: TICKETMASTER_URLS.SKEIKAMPEN,
  },
]


//denne funksjonen tar en festival-ID som parameter som søker gjennom FALLBACK_FESTIVALS for å finne festivalen med ID-en
//Hvis den finner festivalen, returnerer den et nytt objekt som blir formatert for å ligne dataen som skrevet ut fra Ticketmaster API-et.
export function getFestivalById(id) {
  const festival = FALLBACK_FESTIVALS.find((fest) => fest.id === id)

  if (festival) {
    return {
      id: festival.id,
      name: festival.name,
      dates: {
        start: {
          localDate:
            festival.date.split(". ")[1] +
            "-" +
            festival.date.split(". ")[0].padStart(2, "0") +
            "-" +
            festival.date.split(" ")[2],
        },
      },
      images: [
        {
          width: 800,
          height: 450,
          ratio: "16_9",
        },
      ],
      _embedded: {
        venues: [
          {
            name: festival.location.split(", ")[0],
            city: {
              name: festival.location.split(", ")[1],
            },
            country: {
              name: "Norge",
            },
          },
        ],
      },
      info: festival.description,
      url: festival.ticketUrl,
    }
  }

  return null
}




//denne funksjonen fetcher eventet med festivalID og ticketmaster link.
//her tar vi id-en til eventet og med api-keyet vårt, sender en forespørsel til ticketmaster API for å hente bilder for den spesifikke festivalen
//håndterer feil og returnerer et tomt array hvis noe er galt
//returnerer et array med bildeobjekter hvis forespørselen er vellykket. 
export async function fetchFestivalImages(festivalId) {
  try {
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${festivalId}/images?apikey=${API_KEY}&locale=*`,
    )

    if (!response.ok) {
      throw new Error(`API-forespørsel feil ${response.status}`)
    }

    const data = await response.json()
    return data.images || []
  } catch (error) {
    console.error(`Feil ved henting av bilder for festival ${festivalId}:`, error)
    return []
  }
}




//med denne funksjonen hentes det alle festivalene definert i FESTIVAL_IDS fra Ticketmaster API-et i en forespørsel
//Her konverterer det ID-ene til en string som er kommasperert for API-et
//det returneres et array med festivalobjekter hvis forespørselen er vellykket
export async function fetchAllFestivals() {
  try {
    const ids = Object.values(FESTIVAL_IDS).join(",")
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events?apikey=${API_KEY}&id=${ids}&locale=*`,
    )

    if (!response.ok) {
      throw new Error(`API-forespørsel feilet med status ${response.status}`)
    }

    const data = await response.json()
    return data._embedded && data._embedded.events ? data._embedded.events : []
  } catch (error) {
    console.error("Feil ved henting av festivaler:", error)
    return []
  }
}

//funksjonen for å hente festival-detaljer fra Ticketmaster API
//tar en festival-id som parameter også sender den en forspørsel/call til ticketmaster api for å hente detaljert informasjon om den spesifikke festivalen. 
//her håndterer man feil og returnerer null hvis noe går falt. returnerer et festivalobjekt med detaljer hvis callet er godkjent
export async function fetchFestivalDetails(festivalId) {
  try {
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${festivalId}?apikey=${API_KEY}&locale=*&domain=No`,
    )

    if (!response.ok) {
      throw new Error(`API-forespørsel feilet med status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Feil ved henting av detaljer for festival ${festivalId}:`, error)
    return null
  }
}

//Grunn til hvorfor vi implementerte fallbackFestival.js:
//Vi valgte å implemetere fallbackFestivalData i prosjektet vårt,
//fordi vi merket at det var stadig problemer med å hente inn fra Ticketmaster API-et
//Dette gjorde det vanskelig for oss å jobbe med selve nettsiden, så vi bestemte oss for å opprette dette i lib-mappa
//Med dette var nettsiden bedre fungerende og virket mer konsistent.
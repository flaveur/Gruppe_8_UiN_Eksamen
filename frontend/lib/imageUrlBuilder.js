import imageUrlBuilder from "@sanity/image-url"
import client from "./sanity"

const builder = imageUrlBuilder(client)

export function urlFor(source) {
  if (!source) {
    return null
  }
  return builder.image(source)
}

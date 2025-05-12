import { createClient } from "@sanity/client"

// Create a Sanity client
export const client = createClient({
  projectId: "your-project-id", // Replace with your actual project ID
  dataset: "production", // or your dataset name
  apiVersion: "2023-05-03", // Use today's date or any recent date
  useCdn: false, // Set to false during development
})

// Simple function to test the Sanity connection
export async function testSanityConnection() {
  try {
    // This query just counts the total number of documents
    const result = await client.fetch(`count(*[_type in ["event", "user"]])`)
    return {
      success: true,
      documentCount: result,
      message: `Connection successful! Found ${result} documents.`,
    }
  } catch (error) {
    console.error("Sanity connection error:", error)
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
    }
  }
}

// Function to fetch a sample of events
export async function fetchSampleEvents() {
  try {
    return await client.fetch(`*[_type == "event"][0...5]{
      _id,
      title,
      apiId
    }`)
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

// Function to fetch a sample of users
export async function fetchSampleUsers() {
  try {
    return await client.fetch(`*[_type == "user"][0...5]{
      _id,
      name,
      age,
      gender
    }`)
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

// Function to fetch all events
export async function getAllEvents() {
  try {
    return await client.fetch(`*[_type == "event"]{
      _id,
      title,
      apiId
    }`)
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

// Function to fetch all users
export async function getAllUsers() {
  try {
    return await client.fetch(`*[_type == "user"]{
      _id,
      name,
      age,
      gender,
      wishlist[]->{_id, title},
      previousPurchases[]->{_id, title}
    }`)
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

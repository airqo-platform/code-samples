import { MongoClient, type Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

if (!process.env.MONGODB_DB) {
  throw new Error("Please define the MONGODB_DB environment variable")
}

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  // Create a new MongoDB client with the connection string
  const client = new MongoClient(`mongodb://${uri}`)

  // Connect to the client
  await client.connect()

  // Get the database
  const db = client.db(dbName)

  // Cache the client and db connection
  cachedClient = client
  cachedDb = db

  return { client, db }
}

// Helper function to get a collection
export async function getCollection(collectionName: string) {
  const { db } = await connectToDatabase()
  return db.collection(collectionName)
}


export function validateEnv() {
  const requiredVars = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_API_TOKEN"]

  const missingVars = requiredVars.filter((name) => !process.env[name])

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
  }

  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    apiToken: process.env.NEXT_PUBLIC_API_TOKEN!,
    googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || null,
  }
}

/**
 * Environment variables accessible to client components
 */
export const env = validateEnv()


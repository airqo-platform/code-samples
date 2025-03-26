import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (sessionCookie && sessionCookie.value) {
      try {
        // Parse the JSON session data
        const userData = JSON.parse(sessionCookie.value)

        // Check if the user is active
        if (userData && userData.isActive) {
          return NextResponse.json({
            authenticated: true,
            user: userData,
          })
        }
      } catch (error) {
        console.error("Error parsing session cookie:", error)
      }
    }

    return NextResponse.json(
      {
        authenticated: false,
        message: "Not authenticated",
      },
      { status: 401 },
    )
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      {
        message: "An error occurred checking authentication",
      },
      { status: 500 },
    )
  }
}


import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const session = cookies().get("admin_session")

    if (session && session.value === "authenticated") {
      return NextResponse.json({ authenticated: true })
    }

    return NextResponse.json({ authenticated: false, message: "Not authenticated" }, { status: 401 })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ message: "An error occurred checking authentication" }, { status: 500 })
  }
}


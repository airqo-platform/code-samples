import { NextRequest, NextResponse } from "next/server"
import { getSiteSettings } from "@/lib/admin-store"
import { defaultSiteSettings } from "@/lib/site-settings"

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const settings = await getSiteSettings()
  const managedPage = settings.pages.find(
    (page) => page.path !== "/" && (pathname === page.path || pathname.startsWith(`${page.path}/`)),
  )
  const removedDefaultPage = defaultSiteSettings.pages.find(
    (page) =>
      page.path !== "/" &&
      !settings.pages.some((configuredPage) => configuredPage.path === page.path) &&
      (pathname === page.path || pathname.startsWith(`${page.path}/`)),
  )

  if ((managedPage && !managedPage.enabled) || removedDefaultPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    url.searchParams.set("unavailable", managedPage?.id ?? removedDefaultPage!.id)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|admin|_next/static|_next/image|favicon.ico|images|fonts).*)"],
}

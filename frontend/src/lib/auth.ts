export type UserRole = "admin" | "editor" | "viewer"

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  isActive: boolean
}

export function canAccessFeature(
  user: User | null,
  feature: "users" | "features" | "ai-technologies" | "media" | "settings",
): boolean {
  if (!user) return false
  if (!user.isActive) return false

  // Admin can access everything
  if (user.role === "admin") return true

  // Editor can access content-related features but not user management
  if (user.role === "editor") {
    switch (feature) {
      case "features":
      case "ai-technologies":
      case "media":
        return true
      case "users":
      case "settings":
        return false
    }
  }

  // Viewer can only view things, no edit access
  if (user.role === "viewer") {
    return ["features", "ai-technologies", "media"].includes(feature)
  }

  return false
}

export function canEditContent(user: User | null): boolean {
  if (!user || !user.isActive) return false
  return user.role === "admin" || user.role === "editor"
}

export function canDeleteContent(user: User | null): boolean {
  if (!user || !user.isActive) return false
  return user.role === "admin"
}

export function canManageUsers(user: User | null): boolean {
  if (!user || !user.isActive) return false
  return user.role === "admin"
}

export function canManageSettings(user: User | null): boolean {
  if (!user || !user.isActive) return false
  return user.role === "admin"
}


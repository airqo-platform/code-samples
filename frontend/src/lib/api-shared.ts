export const RETRYABLE_API_STATUSES = new Set([429, 500, 502, 503, 504])

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

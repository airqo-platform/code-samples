export const REPORT_REQUEST_RETRIES = 3
export const REPORT_RETRY_DELAY_MS = 5_000

type RetryOptions = {
  retries?: number
  delayMs?: number
}

const DETERMINISTIC_FAILURE_STATUSES = new Set([400, 401, 403, 404])

const wait = (delayMs: number) => new Promise<void>((resolve) => window.setTimeout(resolve, delayMs))

function errorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const record = error as { status?: unknown; response?: { status?: unknown }; cause?: { status?: unknown } }
    if (typeof record.status === "number") return record.status
    if (typeof record.response?.status === "number") return record.response.status
    if (typeof record.cause?.status === "number") return record.cause.status
  }
  return undefined
}

function isRetryable(error: unknown): boolean {
  const status = errorStatus(error)
  // No status means a network error; treat as retryable.
  if (status === undefined) return true
  // Deterministic client failures must not be retried.
  if (DETERMINISTIC_FAILURE_STATUSES.has(status)) return false
  // Retry timeouts, rate limits, and server faults.
  return status === 408 || status === 429 || (status >= 500 && status < 600)
}

export async function retryReportRequest<T>(
  request: () => Promise<T>,
  { retries = REPORT_REQUEST_RETRIES, delayMs = REPORT_RETRY_DELAY_MS }: RetryOptions = {},
): Promise<T> {
  let retryNumber = 0

  while (true) {
    try {
      return await request()
    } catch (error) {
      if (retryNumber >= retries || !isRetryable(error)) throw error

      retryNumber += 1
      await wait(delayMs)
    }
  }
}

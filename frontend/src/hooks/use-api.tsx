"use client"

import { useState, useCallback } from "react"

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface ApiState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
}

export function useApi<T>(apiFn: (...args: any[]) => Promise<T>, options: UseApiOptions<T> = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const data = await apiFn(...args)
        setState({ data, isLoading: false, error: null })
        options.onSuccess?.(data)
        return data
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setState({ data: null, isLoading: false, error })
        options.onError?.(error)
        throw error
      }
    },
    [apiFn, options],
  )

  return {
    ...state,
    execute,
    reset: useCallback(() => {
      setState({ data: null, isLoading: false, error: null })
    }, []),
  }
}


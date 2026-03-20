import { useState, useCallback } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export function useVehicleCheck() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const check = useCallback(async (input) => {
    setLoading(true)
    setError(null)
    setReport(null)

    const isVin = /^[A-HJ-NPR-Z0-9]{17}$/i.test(input.trim())
    const body = isVin
      ? { vin: input.trim().toUpperCase() }
      : { registration: input.trim().toUpperCase() }

    try {
      const { data } = await axios.post(`${API_BASE}/api/check`, body, {
        timeout: 30_000,
      })
      setReport(data)
      return data
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Something went wrong. Please try again.'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { report, loading, error, check }
}

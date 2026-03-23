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
        timeout: 60_000,
      })
      setReport(data)
      return data
    } catch (err) {
      let message
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        message = `Cannot reach the backend server. Check that VITE_API_URL is set in the Render dashboard for the frontend service (currently: "${API_BASE || 'not set'}") and that ALLOWED_ORIGINS on the backend includes the frontend URL.`
      } else if (err.code === 'ECONNABORTED') {
        message = 'Request timed out — the backend may be waking up from sleep (Render free tier). Wait 30 seconds and try again.'
      } else if (err.response?.status === 429) {
        message = "You've reached your limit of 10 searches per hour. Please try again in the next hour."
      } else {
        message =
          err.response?.data?.detail ||
          err.message ||
          'Something went wrong. Please try again.'
      }
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { report, loading, error, check }
}

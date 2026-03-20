import { format, parseISO } from 'date-fns'

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatMileage(val) {
  if (val == null) return '—'
  return `${val.toLocaleString('en-GB')} mi`
}

export function formatPassRate(rate) {
  if (rate == null) return '—'
  return `${rate.toFixed(0)}%`
}

export function formatFuelType(fuel) {
  const map = {
    PETROL: 'Petrol',
    DIESEL: 'Diesel',
    ELECTRIC: 'Electric',
    HYBRID: 'Hybrid',
    'PETROL/ELECTRIC': 'Petrol Hybrid',
    'DIESEL/ELECTRIC': 'Diesel Hybrid',
  }
  return map[fuel?.toUpperCase()] ?? fuel ?? '—'
}

export function capitalise(str) {
  if (!str) return '—'
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

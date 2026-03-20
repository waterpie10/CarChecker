export function riskColour(score) {
  if (score >= 85) return { bg: 'bg-green-500', text: 'text-green-700', label: 'Low Risk', ring: 'ring-green-200' }
  if (score >= 60) return { bg: 'bg-amber-500', text: 'text-amber-700', label: 'Moderate Risk', ring: 'ring-amber-200' }
  return { bg: 'bg-red-500', text: 'text-red-700', label: 'High Risk', ring: 'ring-red-200' }
}

export function severityBadge(severity) {
  switch (severity?.toUpperCase()) {
    case 'RED': return 'badge-red'
    case 'AMBER': return 'badge-amber'
    case 'GREEN': return 'badge-green'
    default: return 'badge-gray'
  }
}

export function motResultColour(result) {
  return result === 'PASSED' ? 'text-green-600' : 'text-red-600'
}

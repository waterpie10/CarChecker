import { AlertOctagon, AlertTriangle, CheckCircle } from 'lucide-react'

const ICON = {
  RED: <AlertOctagon size={16} className="text-red-500 flex-shrink-0 mt-0.5" />,
  AMBER: <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />,
  GREEN: <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />,
}

const BG = {
  RED: 'bg-red-50 border-red-100',
  AMBER: 'bg-amber-50 border-amber-100',
  GREEN: 'bg-green-50 border-green-100',
}

export default function RiskFlags({ flags, score }) {
  if (!flags || flags.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Risk Assessment</h2>
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-700">
          <CheckCircle size={16} />
          No risk flags found. This vehicle appears clean.
        </div>
      </div>
    )
  }

  const sorted = [...flags].sort(a => (a.severity === 'RED' ? -1 : a.severity === 'AMBER' ? 0 : 1))

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Risk Assessment</h2>
        <span className="text-sm text-gray-500">Risk score: <strong className="text-gray-800">{score}/100</strong></span>
      </div>

      <div className="space-y-2">
        {sorted.map((flag, i) => (
          <div key={i} className={`flex items-start gap-2.5 border rounded-lg p-3 ${BG[flag.severity] || 'bg-gray-50 border-gray-100'}`}>
            {ICON[flag.severity] || ICON.GREEN}
            <div>
              <p className="text-sm font-semibold text-gray-800">{flag.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{flag.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">Score impact: {flag.score_impact}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

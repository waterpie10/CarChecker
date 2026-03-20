import { AlertTriangle, Info, RotateCcw } from 'lucide-react'

export default function DefectsSummary({ report }) {
  const { all_advisories, all_failures, recurring_advisories, dangerous_defects_ever } = report

  // Deduplicate for display
  const uniqueAdvisories = [...new Set(all_advisories)]
  const uniqueFailures = [...new Set(all_failures)]

  return (
    <div className="card space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">Defects Summary</h2>

      {dangerous_defects_ever && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          This vehicle has had one or more <strong>DANGEROUS</strong> defects recorded in its MOT history.
        </div>
      )}

      {recurring_advisories.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <RotateCcw size={14} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-700">Recurring Advisories</h3>
          </div>
          <ul className="space-y-1">
            {recurring_advisories.map((a, i) => (
              <li key={i} className="text-xs px-2 py-1.5 bg-amber-50 text-amber-800 rounded border border-amber-100">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {uniqueFailures.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 mb-2">Failure Items ({uniqueFailures.length})</h3>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {uniqueFailures.map((f, i) => (
              <li key={i} className="text-xs px-2 py-1.5 bg-red-50 text-red-800 rounded border border-red-100">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {uniqueAdvisories.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Info size={14} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">All Advisories ({uniqueAdvisories.length})</h3>
          </div>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {uniqueAdvisories.map((a, i) => (
              <li
                key={i}
                className={`text-xs px-2 py-1.5 rounded border ${
                  recurring_advisories.includes(a)
                    ? 'bg-amber-50 text-amber-800 border-amber-100'
                    : 'bg-gray-50 text-gray-700 border-gray-100'
                }`}
              >
                {recurring_advisories.includes(a) && <span className="font-semibold mr-1">[Recurring]</span>}
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {uniqueAdvisories.length === 0 && uniqueFailures.length === 0 && (
        <p className="text-sm text-gray-500">No defects recorded.</p>
      )}
    </div>
  )
}

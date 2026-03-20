import { Database, Clock } from 'lucide-react'
import { formatDate } from '../utils/formatters.js'

export default function DataSources({ report }) {
  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">
            Data from:{' '}
            <span className="text-gray-700 font-medium">{report.data_sources?.join(', ') || 'Unknown'}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={12} />
          Report generated {formatDate(report.report_generated_at?.split('T')[0])}
        </div>
      </div>

      {report.warnings?.length > 0 && (
        <div className="mt-3 space-y-1">
          {report.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">{w}</p>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
        <p className="font-semibold text-gray-500">What this check does NOT cover:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Outstanding finance (requires HPI's private register)</li>
          <li>Confirmed insurance write-off category (Cat S/N/A/B — requires Thatcham data)</li>
          <li>Police stolen status (requires PNC access)</li>
          <li>Foreign vehicle history beyond DVSA records</li>
        </ul>
        <p className="pt-1">For a comprehensive check including finance and write-off category, consider a paid HPI or CarVertical report.</p>
      </div>
    </div>
  )
}

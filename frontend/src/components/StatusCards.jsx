import { formatDate } from '../utils/formatters.js'
import { CheckCircle, XCircle, AlertTriangle, ArrowUpRight } from 'lucide-react'

function StatusIcon({ status, positiveValues = ['Taxed', 'Valid'] }) {
  const isGood = positiveValues.includes(status)
  const isWarn = status === 'SORN' || status === 'No results'
  if (isGood) return <CheckCircle size={18} className="text-green-500" />
  if (isWarn) return <AlertTriangle size={18} className="text-amber-500" />
  return <XCircle size={18} className="text-red-500" />
}

function StatusCard({ title, status, subtitle, positiveValues }) {
  const isGood = positiveValues?.includes(status)
  const isWarn = ['SORN', 'No results', 'Unknown'].includes(status)
  const colourClass = isGood ? 'text-green-700 bg-green-50' : isWarn ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'

  return (
    <div className="card flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colourClass}`}>
        <StatusIcon status={status} positiveValues={positiveValues} />
        <span className="font-bold text-lg">{status}</span>
      </div>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  )
}

export default function StatusCards({ report }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatusCard
        title="Tax Status"
        status={report.tax_status}
        positiveValues={['Taxed']}
        subtitle={report.tax_due_date ? `Expires ${formatDate(report.tax_due_date)}` : undefined}
      />
      <StatusCard
        title="MOT Status"
        status={report.mot_status}
        positiveValues={['Valid']}
        subtitle={report.mot_expiry_date ? `Expires ${formatDate(report.mot_expiry_date)}` : undefined}
      />
      <div className="card flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">V5C Issued</p>
        <p className="font-bold text-lg text-gray-800">
          {report.date_of_last_v5c ? formatDate(report.date_of_last_v5c) : '—'}
        </p>
        <p className="text-xs text-gray-500">Last logbook issued date</p>
      </div>
      <div className="card flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Export Flag</p>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${report.marked_for_export ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {report.marked_for_export
            ? <><ArrowUpRight size={18} className="text-red-500" /><span className="font-bold text-lg">Marked</span></>
            : <><CheckCircle size={18} className="text-green-500" /><span className="font-bold text-lg">Clear</span></>
          }
        </div>
        <p className="text-xs text-gray-500">DVLA export marker</p>
      </div>
    </div>
  )
}

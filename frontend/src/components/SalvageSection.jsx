import { ShieldAlert, ShieldCheck, ExternalLink } from 'lucide-react'
import { formatDate } from '../utils/formatters.js'

export default function SalvageSection({ report }) {
  const { salvage_records, appears_in_salvage_auction } = report

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        {appears_in_salvage_auction
          ? <ShieldAlert size={20} className="text-red-500" />
          : <ShieldCheck size={20} className="text-green-500" />}
        <h2 className="text-lg font-semibold text-gray-800">Salvage & Auction Records</h2>
      </div>

      {!appears_in_salvage_auction ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-700">
          <ShieldCheck size={16} />
          No salvage auction records found for this vehicle.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <ShieldAlert size={16} />
            <strong>Warning:</strong>&nbsp;This vehicle has appeared in salvage auction listings.
          </div>

          {salvage_records.map((record, i) => (
            <div key={i} className="border border-red-100 rounded-lg p-3 bg-red-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-700 uppercase">{record.source}</span>
                {record.url && (
                  <a
                    href={record.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    View listing <ExternalLink size={10} />
                  </a>
                )}
              </div>
              {record.lot_number && (
                <p className="text-xs text-gray-600">Lot: {record.lot_number}</p>
              )}
              {record.sale_date && (
                <p className="text-xs text-gray-600">Sale date: {record.sale_date}</p>
              )}
              {record.damage_description && (
                <p className="text-xs text-gray-700">Damage: {record.damage_description}</p>
              )}
              {record.loss_type && (
                <p className="text-xs text-gray-700">Loss type: {record.loss_type}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { riskColour } from '../utils/riskColours.js'
import { capitalise, formatFuelType } from '../utils/formatters.js'
import { Car, Fuel, Calendar, Palette } from 'lucide-react'

export default function ReportHeader({ report }) {
  const { bg, label, ring } = riskColour(report.risk_score)

  return (
    <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        {/* Registration plate */}
        <div className="inline-flex items-center gap-0 mb-3">
          <div className="bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded-l">GB</div>
          <div className="bg-yellow-300 border-2 border-l-0 border-gray-800 text-gray-900 font-bold text-2xl tracking-widest px-4 py-1 rounded-r">
            {report.registration}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          {report.year} {capitalise(report.make)} {report.model || ''}
        </h1>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Palette size={14} />
            {capitalise(report.colour)}
          </span>
          <span className="flex items-center gap-1">
            <Fuel size={14} />
            {formatFuelType(report.fuel_type)}
          </span>
          {report.engine_cc && (
            <span className="flex items-center gap-1">
              <Car size={14} />
              {(report.engine_cc / 1000).toFixed(1)}L
            </span>
          )}
          {report.transmission && (
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {report.transmission}
            </span>
          )}
        </div>
        {report.vin && (
          <p className="text-xs text-gray-400 mt-1 font-mono">VIN: {report.vin}</p>
        )}
      </div>

      {/* Risk score dial */}
      <div className={`flex-shrink-0 flex flex-col items-center ring-4 ${ring} rounded-2xl p-4 bg-white`}>
        <div className={`w-20 h-20 rounded-full ${bg} flex items-center justify-center shadow-md`}>
          <span className="text-white text-2xl font-black">{report.risk_score}</span>
        </div>
        <span className="text-xs font-semibold mt-2 text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  )
}
